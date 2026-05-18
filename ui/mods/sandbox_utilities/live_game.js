





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
  try {
    console.log('sandbox-utilities: pasteSelection invoked', {
      sandboxFn: typeof model.sandbox,
      sandboxVal: (typeof model.sandbox === 'function') ? model.sandbox() : '(not a function)',
      scenarioModel: model.scenarioModel,
      pasteArmyId: (typeof model.pasteArmyId === 'function') ? model.pasteArmyId() : model.pasteArmyId,
      copiedSelectionKeys: _.keys(model.copiedSelection || {}),
      cursor_x: cursor_x,
      cursor_y: cursor_y,
      players: (typeof model.players === 'function') ? (model.players() || []).length : '(no model.players)',
      currentFocusPlanetId: (typeof model.currentFocusPlanetId === 'function') ? model.currentFocusPlanetId() : '(no currentFocusPlanetId)',
      hasHolodeck: !!model.holodeck,
      hasRaycastTerrain: !!(model.holodeck && model.holodeck.raycastTerrain)
    });

    if (typeof model.sandbox !== 'function') { console.warn('sandbox-utilities: paste aborted, model.sandbox not available in this scene'); return; }
    if (!model.sandbox()) { console.warn('sandbox-utilities: paste aborted, not in sandbox mode'); return; }
    if (model.scenarioModel !== undefined) { console.warn('sandbox-utilities: paste aborted, scenarioModel is defined'); return; }
    if (model.pasteArmyId() == -1) { console.warn('sandbox-utilities: paste aborted, no controlled army'); return; }
    if(_.keys(model.copiedSelection).length <1){ console.warn('sandbox-utilities: paste aborted, nothing copied'); return; }

    // Try several cursor sources — document mousemove can be stale if other panels capture mouse
    var cx = cursor_x, cy = cursor_y;
    try {
      if (typeof api !== 'undefined' && api.input && api.input.mouse) {
        var mx = (typeof api.input.mouse.x === 'function') ? api.input.mouse.x() : api.input.mouse.x;
        var my = (typeof api.input.mouse.y === 'function') ? api.input.mouse.y() : api.input.mouse.y;
        if (typeof mx === 'number' && typeof my === 'number' && mx >= 0 && my >= 0) {
          cx = mx; cy = my;
          console.log('sandbox-utilities: using api.input.mouse', cx, cy);
        }
      }
    } catch (e) { /* fall back to document coords */ }

    if (cx < 0 || cy < 0) { console.warn('sandbox-utilities: paste aborted, cursor position unknown'); return; }
    if (!model.holodeck || !model.holodeck.raycastTerrain) { console.warn('sandbox-utilities: paste aborted, no holodeck.raycastTerrain'); return; }

    console.log('sandbox-utilities: invoking raycastTerrain', cx, cy);

    model.holodeck.raycastTerrain(cx, cy).then(function(loc3D) {
      try {
        console.log('sandbox-utilities: raycastTerrain returned', loc3D);
        if (!loc3D || !loc3D.pos) { console.warn('sandbox-utilities: raycastTerrain returned no position', loc3D); return; }

        // Resolve planet index: prefer the planet from the raycast hit; fall back to focused holodeck's planet.
        var planet = (typeof loc3D.planet === 'number') ? loc3D.planet : null;
        if (planet === null && api && api.camera && typeof api.camera.getFocus === 'function' && model.holodeck) {
          try {
            var focus = api.camera.getFocus(model.holodeck.id);
            if (focus && typeof focus.planet === 'function') planet = focus.planet();
          } catch (e) { /* ignore */ }
        }
        if (planet === null || planet < 0) { console.warn('sandbox-utilities: paste aborted, could not determine planet index', loc3D); return; }
        console.log('sandbox-utilities: resolved planet', planet);

        engine.call('worldview.fixupBuildLocations', 0, "/pa/units/land/assault_bot/assault_bot.json",0, JSON.stringify([loc3D])).then(function(raw) {
          try {
            console.log('sandbox-utilities: fixupBuildLocations returned', raw);
            raw = JSON.parse(raw);
            model.pasteArray(model.copiedSelection,model.pasteArmyId(),planet,loc3D.pos, raw[0]);
            console.log('sandbox-utilities: pasteArray dispatched');
          } catch (err) {
            console.error('sandbox-utilities: paste failed inside fixup callback', err);
          }
        }, function(err){ console.error('sandbox-utilities: fixupBuildLocations rejected', err); });
      } catch (err) {
        console.error('sandbox-utilities: raycastTerrain success handler threw', err);
      }
    }, function(err){ console.error('sandbox-utilities: raycastTerrain rejected', err); });
  } catch (err) {
    console.error('sandbox-utilities: pasteSelection threw synchronously', err);
  }
}

model.toggleSandboxMenu = function(){
  api.Panel.message(api.panels.sandbox.id, 'toggleMenu', true);
}
