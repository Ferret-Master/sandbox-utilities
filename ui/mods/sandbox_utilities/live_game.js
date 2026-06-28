





var extractBones = function(unitPapa){
  $.get('/'+unitPapa, function(data) {
   var lastIndex = data.lastIndexOf("�");
   var armatureString = data.slice(lastIndex+1);
   var armatureStringArray = armatureString.split("");
   var newString = "";
  for(var i = 0;i<armatureStringArray.length-1;i++){
  var trueCharValue = armatureStringArray[i]
  var trueCharValue2 = armatureStringArray[i+1]

	if(trueCharValue.charCodeAt(0) == 0 && trueCharValue2.charCodeAt(0) == 0){continue}
	else if(trueCharValue.charCodeAt(0) == 0 && trueCharValue2.charCodeAt(0) !== 0){newString += " "}
	else{newString += trueCharValue}
	}

	var finalString = newString.trim();
  var boneArray = finalString.split(" ").filter(function(string){
    if(string.length>1){return string}
  });
	console.log(boneArray)
}, 'text');
}

var cursor_x = -1;
var cursor_y = -1;

document.addEventListener('mousemove', function(event) {
  cursor_x = event.pageX;
  cursor_y = event.pageY;
});



model.copiedSelection = [];
var copiedTypes = {};

function getTypes(spec) {
  if (copiedTypes && copiedTypes[spec]) return copiedTypes[spec];
  if (typeof model.unitSpecs === 'function') {
    var specs = model.unitSpecs();
    if (specs && specs[spec]) return specs[spec].types || [];
  }
  if (model.unitSpecs && typeof model.unitSpecs === 'object' && model.unitSpecs[spec]) {
    return model.unitSpecs[spec].types || [];
  }
  return [];
}

model.copySelection = function(){
  model.copiedSelection = model.selection().spec_ids;
  copiedTypes = {};
  api.Panel.message(api.panels.sandbox.id, 'copySelection', model.copiedSelection);
}

handlers.copySelectionTypes = function(payload){
  copiedTypes = payload || {};
}

model.pasteArmyId = ko.observable(-1);

model.spawnExact = function(army,spec,planet,location,orientation){
  var createJson = {

        army: model.players()[army].id,
        what: spec,
        planet: planet,
        location: location,
        orientation: orientation
  }
  model.send_message('create_unit', createJson)
}


model.pasteArray = function(unitObject,army,planet,location,raw){
  var objectKeys = _.keys(unitObject)
  var planetObject = model.planetListState().planets[planet]
  var planetRadius = planetObject.radius;
  var planetBiome = planetObject.biome;

  _.map(objectKeys, function(spec){
    var unitTypes = getTypes(spec);
    var spawnOffset = 0;
    if(_.contains(unitTypes,"UNITTYPE_Air") && _.contains(unitTypes,"UNITTYPE_Mobile")){spawnOffset = 50}
    if(_.contains(unitTypes,"UNITTYPE_Orbital") && !_.contains(unitTypes,"UNITTYPE_Land")){spawnOffset = 400}
    if(planetBiome == "gas"){spawnOffset = 0}
    var offsetMultiplier = 1 + (spawnOffset/planetRadius)
    var spawnLocation = (raw && raw.ok == true && spawnOffset < 400) ? raw.pos : location;
    var newLocation = [spawnLocation[0]*offsetMultiplier,spawnLocation[1]*offsetMultiplier,spawnLocation[2]*offsetMultiplier]
    for(var n = 0;n < unitObject[spec].length;n++){
      model.spawnExact(army,spec,planet,newLocation,[0,0,0])
    }
  })
}

ko.computed(function(){
  var controlFlags = model.playerControlFlags();
  for(var i = 0; i< controlFlags.length;i++){
    if(controlFlags[i] == true){model.pasteArmyId(i)}
  }
})

model.pasteSelection = function() {
  if (typeof model.sandbox !== 'function' || !model.sandbox()) return;
  if (model.scenarioModel !== undefined) return;
  if (model.pasteArmyId() == -1) return;
  if (_.keys(model.copiedSelection).length < 1) return;

  // document mousemove can be stale if another panel captured the mouse
  var cx = cursor_x, cy = cursor_y;
  if (typeof api !== 'undefined' && api.input && api.input.mouse) {
    var mx = (typeof api.input.mouse.x === 'function') ? api.input.mouse.x() : api.input.mouse.x;
    var my = (typeof api.input.mouse.y === 'function') ? api.input.mouse.y() : api.input.mouse.y;
    if (typeof mx === 'number' && typeof my === 'number' && mx >= 0 && my >= 0) { cx = mx; cy = my; }
  }
  if (cx < 0 || cy < 0) return;
  if (!model.holodeck || !model.holodeck.raycastTerrain) return;

  model.holodeck.raycastTerrain(cx, cy).then(function(loc3D) {
    if (!loc3D || !loc3D.pos) return;
    // prefer planet from the raycast hit; fall back to camera focus
    var planet = (typeof loc3D.planet === 'number') ? loc3D.planet : null;
    if (planet === null && api && api.camera && typeof api.camera.getFocus === 'function') {
      var focus = api.camera.getFocus(model.holodeck.id);
      if (focus && typeof focus.planet === 'function') planet = focus.planet();
    }
    if (planet === null || planet < 0) return;
    engine.call('worldview.fixupBuildLocations', 0, "/pa/units/land/assault_bot/assault_bot.json", 0, JSON.stringify([loc3D])).then(function(raw) {
      raw = JSON.parse(raw);
      model.pasteArray(model.copiedSelection, model.pasteArmyId(), planet, loc3D.pos, raw[0]);
    });
  });
}

model.toggleSandboxMenu = function(){
  api.Panel.message(api.panels.sandbox.id, 'toggleMenu', true);
}
