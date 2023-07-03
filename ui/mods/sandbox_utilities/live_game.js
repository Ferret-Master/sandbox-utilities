





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

document.onmousemove = function(event)
{

cursor_x = event.pageX;
cursor_y = event.pageY;
}



model.copiedSelection = [];

model.copySelection = function(){
  model.copiedSelection = model.selection().spec_ids;
  api.Panel.message(api.panels.sandbox.id, 'copySelection', model.copiedSelection);
}

model.pasteArmyId = ko.observable(0);

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
    var unitTypes = model.unitSpecs[spec].types;
    var spawnOffset = 0;
    if(_.contains(unitTypes,"UNITTYPE_Air") && _.contains(unitTypes,"UNITTYPE_Mobile")){spawnOffset = 50}
    if(_.contains(unitTypes,"UNITTYPE_Orbital") && !_.contains(unitTypes,"UNITTYPE_Land")){spawnOffset = 400}
    if(planetBiome == "gas"){spawnOffset = 0}
    var offsetMultiplier = 1 + (spawnOffset/planetRadius)
    if(raw.ok == true && spawnOffset <400){
      location = raw.pos;
     }
    var newLocation = [location[0]*offsetMultiplier,location[1]*offsetMultiplier,location[2]*offsetMultiplier]
    for(var i = 0;i < unitObject[spec].length;i++){
    model.spawnExact(army,spec,planet,newLocation,[0,0,0])
  }
  })
}


model.pasteSelection = function() {
  if (!model.sandbox() || model.scenarioModel !== undefined) return
  if (model.pasteArmyId() == -1) return
  if(_.keys(model.copiedSelection).length <1){return}
  var planet = model.currentFocusPlanetId();
  model.holodeck.raycastTerrain(cursor_x, cursor_y).then(function(loc3D) {
      engine.call('worldview.fixupBuildLocations', 0, "/pa/units/land/assault_bot/assault_bot.json",0, JSON.stringify([loc3D])).then(function(raw) {
       raw = JSON.parse(raw);
       model.pasteArray(model.copiedSelection,model.pasteArmyId(),planet,loc3D.pos, raw[0]);
      });
     
  })
}

model.toggleSandboxMenu = function(){
  api.Panel.message(api.panels.sandbox.id, 'toggleMenu', true);
}
