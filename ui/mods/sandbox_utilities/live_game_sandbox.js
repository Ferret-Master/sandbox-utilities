console.log("sandbox utils loaded")


//labels tags by importance, instead of using it for sorting this is used to work out the section a unit belongs to automatically, adn should work with new units/mods properly
//need a way to rank tag combinations,e.g factoryBuild should be a high rank but a modifier, so bot + basic + factoryBuild is high up but something like a spawned unit is low
// although if it shows bot as the highest rank, then sorts via next highest, ie basic at a higher prio than advanced but still in bot section
// in that case if fabber is higher than bot it would separate the fabs but not otherwise
//types I want clumped alone should all have higher priorities than lower clump values

//negative values overtake others for initial grouping, but the group itself is sorted lower down
//custom tags will have custom rules but should not affect order

//tag group order will start out as the same and ill fix it later if needed
var tagImportance = { 
  "Commander":-90,
  "SupportCommander":70,
  "Fabber":100,
  "Debug":0,
  "Tank":95,
  "Bot":95,
  "Bomber":16,
  "Fighter":15,
  "Gunship":14,
  "Transport":13,
  "Teleporter":12,
  "Scout":20,
  "Structure":50,
  "Mobile":5,
  "Hover":89,
  "Wall":10,
  "Sub":40,
  "Nuke":70,
  "NukeDefense":50,
  "Heavy":20,
  "Artillery":55,
  "SelfDestruct":10,
  "Tactical":30,
  "MissileDefense":60,
  "LaserPlatform":40,
  "AirDefense":70,
  "SurfaceDefense":75,
  "OrbitalDefense":65,
  "ControlModule":50,
  "PlanetEngine":40,
  "CannonBuildable":10,
  "Titan":120,
  "MetalProduction":55,
  "EnergyProduction":50,
  "Construction":60,
  "Deconstruction":60,
  "Land":40,
  "Naval":95,
  "Air":95,
  "Orbital":95,
  "Basic":90,
  "Advanced":91,
  "CmdBuild":3,
  "FabBuild":4,
  "FabAdvBuild":5,
  "FabOrbBuild":6,
  "FactoryBuild":7,
  "CombatFabBuild":8,
  "CombatFabAdvBuild":9,
  "Economy":95,
  "Factory":110,
  "Defense":96,
  "Offense":30,
  "Recon":94,
  "NoBuild":-1000,
  "Important":0
}

//stores the categories and what units are in them, never changes but the results from it may be filtered, is ordered during creation

//format is customx:{
//          Fabber: {
//          unitList:[], 
//          css: "border green"
//          }
//       }
//objects sorted by unittype at some point
var unitCategories = {

}


model.copySelectionHotkey = ko.observable("not loaded");
model.pasteSelectionHotkey = ko.observable("not loaded");
model.toggleWindowHotkey = ko.observable("not loaded");


function TypeSorting(a,b){
    var a = a[1];
    var b = b[1];
    for(var i = 0;a.length;i++){
      if(b.length<i){return 1}
      if(a[i] < b[i]){return -1}
      if(a[i] > b[i]){return 1}
    }
    return -1;
}

function reverseSortNumber(a,b)
{
    return b-a;
}

//takes in unitTags and inserts the unit in the right category/makes one if needed
function createCategories(unitTypes, unitSpec){
  var customNumber = "NoCustom"; // custom 0 will be the section for units without a custom type
  var highestNumber = 0;
  var typeCategory = "NoCustom";
  var typeValues = [];
  _.forEach(unitTypes, function(unitType){
    var unitType = unitType.replace("UNITTYPE_", "");
    if(unitType.startsWith("Custom")){
      customNumber = unitType;
      return;
    }
    var customValue = Math.abs(tagImportance[unitType]);
    typeValues.push(customValue);
    if(highestNumber < customValue){
      highestNumber = customValue;
      typeCategory = unitType;
    }
})

  typeValues = typeValues.sort(reverseSortNumber);

  if(unitCategories["NoCustom"] == undefined){  unitCategories["NoCustom"] = {}}

  if(unitCategories[customNumber] == undefined){//push to the unit list and sort
    unitCategories[customNumber] = {};
  }

  var chosenCustom = unitCategories[customNumber];

  if(chosenCustom["NoCustom"] == undefined){chosenCustom["NoCustom"] = {//defining first so it show at the top
    "unitList":[]
  }
}

  if(chosenCustom[typeCategory] == undefined){
    chosenCustom[typeCategory] = { // needs css entry
      "unitList":[]
    }
  }

  chosenCustom[typeCategory]["unitList"].push([unitSpec, typeValues]);

  chosenCustom[typeCategory]["unitList"].sort(TypeSorting);
}

function simplifyUnitArray(unitArray){
  var returnArray = [];
  _.forEach(unitArray, function(unit){returnArray.push(unit[0])})
  return returnArray;
}

//filter observables
var activeFactionFilter = ko.observable("");
model.filterSelected = ko.observable(false);
model.filterInput = ko.observable("");
model.highlightModded = ko.observable(false);
model.hideModded = ko.observable(false);
model.hideVanilla = ko.observable(false);
model.hideVariants = ko.observable(true);
model.hideNoBuild = ko.observable(false);
model.showCustomTags = ko.observable(false);
model.pasteArmyId = ko.observable(0);
model.selectedBoxes = ko.computed(function(){return [model.filterSelected()]})

//takes in filter parameters and returns valid category groups for display
function filteredCategories(factionFilter, filterInput, hideVariants, hideNoBuild, showCustomTags, hideModded, hideVanilla){
  var filteredCategories = [];
  var totalCategories = [];
  _.map(unitCategories, function(unitCategory, customKey){//each custom category
    if(factionFilter == "" || customKey == factionFilter){
      _.map(unitCategory,function(categoryObject, categoryKey){
        if(showCustomTags == true){categoryKey = customKey + " " + categoryKey}
        if(hideNoBuild !== true || categoryKey !== "NoBuild"){totalCategories.push([categoryKey, simplifyUnitArray(categoryObject.unitList)])}
      })
    }
  })




  var unitSpecs = model.unitSpecs();

  _.map(totalCategories, function(category){
    var filteredCategory = [category[0],[]]
    _.map(category[1], function(unitSpec){
      var pushUnitBool = true;
      var unit = unitSpecs[unitSpec];
      var unitTypes = unit.types;
      var modded = vanillaSpecList[unitSpec] == undefined;
      if(hideModded == true && modded == true){pushUnitBool = false}
      if(hideVanilla == true && modded == false){pushUnitBool = false}
      if(hideVariants == true){
        if(_.contains(unitTypes, "UNITTYPE_Commander") && _.contains(unitTypes, "UNITTYPE_Custom58")){
          
          if(unitSpec !== "/pa/units/commanders/raptor_nefelpitou/raptor_nefelpitou.json"){pushUnitBool = false}
        }
      }
      if(filterInput !== ""){
        var unitName = unit.name;
        var filterStrings = [unitName, unitSpec]
        var splitFilterInput = filterInput.split(",")
        var validMatches = []
        _.map(unitTypes, function(type){filterStrings.push(type)})
        _.map(splitFilterInput, function(filterString){
          var localValidMatch = false;
          _.map(filterStrings, function(string){
            if(string.toLowerCase().indexOf(filterString.toLowerCase()) !== -1){localValidMatch = true}
          })
          if(localValidMatch){validMatches.push(true)}
        })
      
        if(validMatches.length < splitFilterInput.length){pushUnitBool = false}
      }

      if(pushUnitBool){filteredCategory[1].push(unitSpec)}
 
    })
    if(filteredCategory[1].length > 0){
      filteredCategories.push(filteredCategory);
    }
   
  })

  return filteredCategories;
}



//replacing default function
model.sandbox_units_filtered = ko.computed(function() {
  getHotkeys();
  var unitSpecs = model.unitSpecs()
	if (!model.sandbox_expanded())
		return [];
  if(_.keys(unitCategories).length == 0){
	_.map(model.unitSpecs(), function(unit, spec) //takes in each unit and its spec(filepath)
	{
    createCategories(unit.types,spec);
  })}

  var result = _.map(filteredCategories(activeFactionFilter(), model.filterInput(), model.hideVariants(), model.hideNoBuild(), model.showCustomTags(), model.hideModded(),model.hideVanilla()), function(baseCategory) //takes in each unit and its spec(filepath)
	{

      var test = _.map(baseCategory[1], function(unitSpec){
        var unit = unitSpecs[unitSpec];
        var name = loc(unit.name);
        var modded = vanillaSpecList[unitSpec] == undefined;
        var hide = false;
        var icon = buildImages[unitSpec]
      
        if(model.highlightModded() == false){modded = false}
        return({
          spec: unitSpec,
          modded: modded,
          icon: icon,
          name: name,
          tooltip: name + ' ' + loc(unit.description),
          sort: unit.unit_name
        });
       
      })		

    return new ko.observable([baseCategory[0], test]);
	})

	return result;
});



multipleFactions = ko.observable(false)

var activeTabNumber = 0;
var factionCustoms = ["","Custom58","Custom2","Custom1"]
var tabLabels = ["all","mla","bugs","legion"];

model.toggleFaction = function(){
  activeFactionFilter(factionCustoms[(activeTabNumber+=1)%4])
  $("#activeFaction").attr("src", "coui://ui/mods/sandbox_utilities/img/"+tabLabels[activeTabNumber%4]+".png");
}


ko.computed(function() {
  var pauseInput = _.contains(model.selectedBoxes(),true);
  if (pauseInput) {
      api.game.captureKeyboard(true);
  }
  else{
      api.game.releaseKeyboard(true);
 }
 api.Panel.message(api.Panel.parentId, 'pauseInput', pauseInput);
});

engine.call('panel.noKeyboard', api.Panel.pageId, false);


$.get("coui://ui/mods/sandbox_utilities/sandbox_utilities.html", function (html) {
		$(".sandbox_utilities").append(html);
    $("#activeFaction").attr("src", "coui://ui/mods/sandbox_utilities/img/"+tabLabels[activeTabNumber%4]+".png");
})

model.copiedSelection = ko.observable([])

handlers.copySelection = function(payload){

  var tempArray = [];

    _.map(payload,function(idArray,spec){
      tempArray.push(
        {
          "spec":spec,
          "count":idArray.length,
          "icon":Build.iconForSpecId(spec)
        }
      )
    })
  
  model.copiedSelection(tempArray)
}

handlers.toggleMenu = function(){
  model.sandbox_expanded(!model.sandbox_expanded())
}

function getHotkeys(){
  model.copySelectionHotkey(api.settings.getSynchronous('keyboard','copy_selection'));
  model.pasteSelectionHotkey(api.settings.getSynchronous('keyboard','paste_selection'));
  model.toggleWindowHotkey(api.settings.getSynchronous('keyboard','toggle_sandbox_menu'));
}

function testImageSources(){
  var units = _.keys(model.unitSpecs());
  _.map(units, function(unit){
    $.get(Build.iconForSpecId(unit)).then(function(){buildImages[unit] = Build.iconForSpecId(unit)}).fail(function(err){buildImages[unit] = undefined});
  })
  _.delay(function(){if(model.sandbox_expanded()){model.sandbox_expanded(!model.sandbox_expanded());model.sandbox_expanded(!model.sandbox_expanded())}},1000)
}


var buildImages = {//function runs through unit list to check build images and defines them as existing or not here

}

_.delay(testImageSources,1000);
vanillaSpecList = {

  "/pa/units/air/l_air_bomb/l_air_bomb.json":true,
  "/pa/units/air/l_air_bomb/triggered/l_air_bomb.json":true,
  "/pa/units/air/l_air_carrier/l_air_carrier.json":true,
  "/pa/units/air/l_air_carrier/l_drone/l_drone.json":true,
  "/pa/units/air/l_air_factory/l_air_factory.json":true,
  "/pa/units/air/l_air_factory_adv/l_air_factory_adv.json":true,
  "/pa/units/air/l_air_scout_adv/l_air_scout_adv.json":true,
  "/pa/units/air/l_air_scout_adv/l_vision/l_vision.json":true,
  "/pa/units/air/l_bomber/l_bomber.json":true,
  "/pa/units/air/l_fabrication_aircraft/l_fabrication_aircraft.json":true,
  "/pa/units/air/l_fabrication_aircraft_adv/l_fabrication_aircraft_adv.json":true,
  "/pa/units/air/l_fighter/l_fighter.json":true,
  "/pa/units/air/l_fighter_adv/l_fighter_adv.json":true,
  "/pa/units/air/l_firestarter/l_drop_turret/l_drop_turret.json":true,
  "/pa/units/air/l_firestarter/l_firestarter.json":true,
  "/pa/units/air/l_flying_teleporter/l_flying_teleporter.json":true,
  "/pa/units/air/l_gunship/l_gunship.json":true,
  "/pa/units/air/l_raider/l_raider.json":true,
  "/pa/units/air/l_titan_air/l_titan_air.json":true,
  "/pa/units/air/l_transport/l_transport.json":true,
  "/pa/units/commanders/l_base/l_base.json":true,
  "/pa/units/commanders/l_cyclops/l_cyclops.json":true,
  "/pa/units/commanders/l_overwatch/l_overwatch.json":true,
  "/pa/units/commanders/l_rockteeth/l_rockteeth.json":true,
  "/pa/units/commanders/l_wasushi/l_wasushi.json":true,
  "/pa/units/land/l_air_defense/l_air_defense.json":true,
  "/pa/units/land/l_air_defense_adv/l_air_defense_adv.json":true,
  "/pa/units/land/l_anti_nuke_launcher/l_anti_nuke_launcher.json":true,
  "/pa/units/land/l_artillery_long/l_artillery_long.json":true,
  "/pa/units/land/l_artillery_short/l_artillery_short.json":true,
  "/pa/units/land/l_assault_bot/l_assault_bot.json":true,
  "/pa/units/land/l_bot_aa/l_bot_aa.json":true,
  "/pa/units/land/l_bot_aa_adv/l_bot_aa_adv.json":true,
  "/pa/units/land/l_bot_artillery/bomb/bomb.json":true,
  "/pa/units/land/l_bot_artillery/l_bot_artillery.json":true,
  "/pa/units/land/l_bot_artillery_adv/l_bot_artillery_adv.json":true,
  "/pa/units/land/l_bot_bomb/l_bot_bomb.json":true,
  "/pa/units/land/l_bot_factory/l_bot_factory.json":true,
  "/pa/units/land/l_bot_factory_adv/l_bot_factory_adv.json":true,
  "/pa/units/land/l_bot_support_commander/l_bot_support_commander.json":true,
  "/pa/units/land/l_control_module/l_control_module.json":true,
  "/pa/units/land/l_energy_plant/l_energy_plant.json":true,
  "/pa/units/land/l_energy_plant_adv/l_energy_plant_adv.json":true,
  "/pa/units/land/l_fabrication_bot/l_fabrication_bot.json":true,
  "/pa/units/land/l_fabrication_bot_adv/l_fabrication_bot_adv.json":true,
  "/pa/units/land/l_fabrication_vehicle/l_fabrication_vehicle.json":true,
  "/pa/units/land/l_fabrication_vehicle_adv/l_fabrication_vehicle_adv.json":true,
  "/pa/units/land/l_fabrication_vehicle_combat/l_fabrication_vehicle_combat.json":true,
  "/pa/units/land/l_flame_turret/l_flame_turret.json":true,
  "/pa/units/land/l_hover_tank/l_hover_tank.json":true,
  "/pa/units/land/l_hover_tank_adv/l_hover_tank_adv.json":true,
  "/pa/units/land/l_land_barrier/l_land_barrier.json":true,
  "/pa/units/land/l_land_mine/l_land_mine.json":true,
  "/pa/units/land/l_mex/l_mex.json":true,
  "/pa/units/land/l_mex_adv/l_mex_adv.json":true,
  "/pa/units/land/l_mortar_tank/l_mortar_tank.json":true,
  "/pa/units/land/l_necromancer/l_necromancer.json":true,
  "/pa/units/land/l_necromancer/l_minion/l_minion.json":true,
  "/pa/units/land/l_nuke_launcher/l_nuke_launcher.json":true,
  "/pa/units/land/l_radar/l_radar.json":true,
  "/pa/units/land/l_radar_adv/l_radar_adv.json":true,
  "/pa/units/land/l_riot_bot/l_riot_bot.json":true,
  "/pa/units/land/l_rocket_barrage/l_rocket_barrage.json":true,
  "/pa/units/land/l_scout_bot/l_scout_bot.json":true,
  "/pa/units/land/l_scout_bot/l_scout_bot_radar_mode.json":true,
  "/pa/units/land/l_shield_gen/l_shield_gen.json":true,
  "/pa/units/land/l_shotgun_tank/l_shotgun_tank.json":true,
  "/pa/units/land/l_sniper_bot/l_sniper_bot.json":true,
  "/pa/units/land/l_sniper_tank/l_sniper_tank.json":true,
  "/pa/units/land/l_storage/l_storage.json":true,
  "/pa/units/land/l_swarm_hive/l_hive_nanoswarm/l_hive_nanoswarm.json":true,
  "/pa/units/land/l_swarm_hive/l_swarm_hive.json":true,
  "/pa/units/land/l_t1_turret_adv/l_t1_turret_adv.json":true,
  "/pa/units/land/l_t1_turret_basic/l_t1_turret_basic.json":true,
  "/pa/units/land/l_tank_heavy_armor/l_tank_heavy_armor.json":true,
  "/pa/units/land/l_tank_laser_adv/l_tank_laser_adv.json":true,
  "/pa/units/land/l_tank_shank/l_tank_shank.json":true,
  "/pa/units/land/l_tank_swarm/l_tank_swarm.json":true,
  "/pa/units/land/l_teleporter/l_teleporter.json":true,
  "/pa/units/land/l_titan_bot/l_titan_bot.json":true,
  "/pa/units/land/l_titan_structure/l_titan_structure.json":true,
  "/pa/units/land/l_titan_vehicle/l_titan_vehicle.json":true,
  "/pa/units/land/l_vehicle_factory/l_vehicle_factory.json":true,
  "/pa/units/land/l_vehicle_factory_adv/l_vehicle_factory_adv.json":true,
  "/pa/units/orbital/l_defense_satellite/l_defense_satellite.json":true,
  "/pa/units/orbital/l_delta_v_engine/l_delta_v_engine.json":true,
  "/pa/units/orbital/l_ion_defense/l_ion_defense.json":true,
  "/pa/units/orbital/l_mining_platform/l_mining_platform.json":true,
  "/pa/units/orbital/l_orbital_battleship/l_drone/l_drone.json":true,
  "/pa/units/orbital/l_orbital_battleship/l_orbital_battleship.json":true,
  "/pa/units/orbital/l_orbital_dropper/l_orbital_dropper.json":true,
  "/pa/units/orbital/l_orbital_fabrication_bot/l_orbital_fabrication_bot.json":true,
  "/pa/units/orbital/l_orbital_factory/l_orbital_factory.json":true,
  "/pa/units/orbital/l_orbital_fighter/l_orbital_fighter.json":true,
  "/pa/units/orbital/l_orbital_lander/l_orbital_lander.json":true,
  "/pa/units/orbital/l_orbital_laser/l_orbital_laser.json":true,
  "/pa/units/orbital/l_orbital_launcher/l_orbital_launcher.json":true,
  "/pa/units/orbital/l_orbital_probe/l_orbital_probe.json":true,
  "/pa/units/orbital/l_orbital_railgun/l_orbital_railgun.json":true,
  "/pa/units/orbital/l_radar_satellite/l_radar_satellite.json":true,
  "/pa/units/orbital/l_radar_satellite_adv/l_radar_satellite_adv.json":true,
  "/pa/units/orbital/l_titan_orbital/l_titan_orbital.json":true,
  "/pa/units/sea/l_attack_sub/l_attack_sub.json":true,
  "/pa/units/sea/l_battleship/l_battleship.json":true,
  "/pa/units/sea/l_destroyer/l_destroyer.json":true,
  "/pa/units/sea/l_fabrication_ship/l_fabrication_ship.json":true,
  "/pa/units/sea/l_fabrication_ship_adv/l_fabrication_ship_adv.json":true,
  "/pa/units/sea/l_fabrication_sub_combat_adv/l_fabrication_sub_combat_adv.json":true,
  "/pa/units/sea/l_frigate/l_frigate.json":true,
  "/pa/units/sea/l_hover_ship/l_hover_ship.json":true,
  "/pa/units/sea/l_missile_ship/l_missile_ship.json":true,
  "/pa/units/sea/l_naval_factory/l_naval_factory.json":true,
  "/pa/units/sea/l_naval_factory_adv/l_naval_factory_adv.json":true,
  "/pa/units/sea/l_sea_mine/l_sea_mine.json":true,
  "/pa/units/sea/l_sea_scout/l_sea_scout.json":true,
  "/pa/units/sea/l_sea_tank/l_sea_tank.json":true,
  "/pa/units/sea/l_torpedo_launcher/l_torpedo_launcher.json":true,
  "/pa/units/sea/l_torpedo_launcher_adv/l_torpedo_launcher_adv.json":true,
  "/pa/units/structure/bug_basic_torp/bug_basic_torp.json":true,
  "/pa/units/structure/bug_advanced_torp/bug_advanced_torp.json":true,
  "/pa/units/structure/bug_catalyst/bug_catalyst.json":true,
  "/pa/units/structure/bug_halley/bug_halley.json":true,
  "/pa/units/structure/bug_rag/bug_rag.json":true,
  "/pa/units/structure/bug_nuke/bug_nuke.json":true,
  "/pa/units/structure/bug_anti_nuke/bug_anti_nuke.json":true,
  "/pa/units/structure/bug_mine/bug_mine.json":true,
  "/pa/units/structure/bug_mine_big/bug_mine_big.json":true,
  "/pa/units/structure/bug_anti_orbital/bug_anti_orbital.json":true,
  "/pa/units/structure/bug_aa_small/bug_aa_small.json":true,
  "/pa/units/structure/bug_aa_large/bug_aa_large.json":true,
  "/pa/units/structure/bug_radar_advanced/bug_radar_advanced.json":true,
  "/pa/units/structure/bug_radar/bug_radar.json":true,
  "/pa/units/structure/bug_basic_energy/bug_basic_energy.json":true,
  "/pa/units/structure/bug_advanced_energy/bug_advanced_energy.json":true,
  "/pa/units/structure/bug_basic_extractor/bug_basic_extractor.json":true,
  "/pa/units/structure/bug_advanced_extractor/bug_advanced_extractor.json":true,
  "/pa/units/structure/bug_turret_small/bug_turret_small.json":true,
  "/pa/units/structure/bug_turret_large/bug_turret_large.json":true,
  "/pa/units/structure/bug_turret_acid/bug_turret_acid.json":true,
  "/pa/units/structure/bug_turret_needle/bug_turret_needle.json":true,

  "/pa/units/structure/advanced_hive/advanced_hive.json":true,
  "/pa/units/structure/basic_hive/basic_hive.json":true,
  "/pa/units/structure/bug_swarm_hive/bug_swarm_hive.json":true,
  "/pa/units/structure/bug_orbital_launcher/bug_orbital_launcher.json":true,
  "/pa/units/structure/bug_jig/bug_jig.json":true,
  "/pa/units/structure/bug_gas_hive/bug_gas_hive.json":true,
  "/pa/units/structure/bug_anchor/bug_anchor.json":true,
  "/pa/units/structure/basic_air_hive/basic_air_hive.json":true,
  "/pa/units/structure/advanced_air_hive/advanced_air_hive.json":true,
  "/pa/units/structure/basic_naval_hive/basic_naval_hive.json":true,
  "/pa/units/structure/bug_teleporter/bug_teleporter.json":true,
  "/pa/units/structure/bug_arty_small/bug_arty_small.json":true,
  "/pa/units/structure/bug_arty_large/bug_arty_large.json":true,
  "/pa/units/structure/bug_combined_storage/bug_combined_storage.json":true,

  "/pa/units/structure/bug_missile_defence_basic/bug_missile_defence_basic.json":true,
  "/pa/units/structure/bug_air_drone_launcher/bug_air_drone_launcher.json":true,
  "/pa/units/structure/bug_air_drone_launcher/bug_air_drone/bug_air_drone.json":true,
  "/pa/units/structure/bug_stealth_turret/bug_stealth_turret.json":true,
  
  "/pa/units/research/unlocks/base_unlock/base_research.json":true,
  "/pa/units/research/unlocks/base_unlock/base_adv_research.json":true,
  "/pa/units/research/unlocks/base_unlock/base_unlock.json":true,

  "/pa/units/research/unlocks/bug_boomer_mine_unlock/research_boomer_mine.json":true,
  "/pa/units/research/unlocks/bug_grunt_big_unlock/research_grunt.json":true,
  "/pa/units/research/unlocks/bug_ripper_stealth_unlock/research_ripper.json":true,
  "/pa/units/research/unlocks/bug_combat_fab_cheap_unlock/research_combat_fab.json":true,
  "/pa/units/research/unlocks/bug_needler_fast_unlock/research_needler.json":true,

  "/pa/units/research/unlocks/bug_crusher_unlock/research_crusher.json":true,
  "/pa/units/research/unlocks/bug_hydra_unlock/research_hydra.json":true,

  "/pa/units/research/unlocks/bug_ripper_stealth_unlock/bug_ripper_stealth_unlock.json":true,
  "/pa/units/research/unlocks/bug_boomer_mine_unlock/bug_boomer_mine_unlock.json":true,
  "/pa/units/research/unlocks/bug_grunt_big_unlock/bug_grunt_big_unlock.json":true,
  "/pa/units/research/unlocks/bug_crusher_unlock/bug_crusher_unlock.json":true,
  "/pa/units/research/unlocks/bug_hydra_unlock/bug_hydra_unlock.json":true,
  "/pa/units/research/unlocks/bug_combat_fab_cheap_unlock/bug_combat_fab_cheap_unlock.json":true,
  "/pa/units/research/unlocks/bug_needler_fast_unlock/bug_needler_fast_unlock.json":true,

  "/pa/units/research/unlocks/bug_orbital_fighter_vision_unlock/research_bug_orbital_fighter_vision.json":true,

  "/pa/units/research/unlocks/bug_orbital_battleship_unlock/research_bug_orbital_battleship.json":true,
  "/pa/units/research/unlocks/bug_chomper_unlock/research_bug_chomper.json":true,
  "/pa/units/research/unlocks/bug_orbital_laser_unlock/research_bug_orbital_laser.json":true,
  "/pa/units/research/unlocks/bug_advanced_orbital_radar_unlock/research_bug_advanced_orbital_radar.json":true,

  "/pa/units/research/unlocks/bug_orbital_fighter_vision_unlock/bug_orbital_fighter_vision_unlock.json":true,

  "/pa/units/research/unlocks/bug_orbital_battleship_unlock/bug_orbital_battleship_unlock.json":true,
  "/pa/units/research/unlocks/bug_chomper_unlock/bug_chomper_unlock.json":true,
  "/pa/units/research/unlocks/bug_orbital_laser_unlock/bug_orbital_laser_unlock.json":true,
  "/pa/units/research/unlocks/bug_advanced_orbital_radar_unlock/bug_advanced_orbital_radar_unlock.json":true,

  "/pa/units/orbital/bug_lander/bug_lander.json":true,
  "/pa/units/orbital/bug_orbital_mine/bug_orbital_mine.json":true,
  "/pa/units/orbital/bug_orbital_battleship/bug_orbital_battleship.json":true,
  "/pa/units/orbital/bug_orbital_battleship/bug_land_drone/bug_land_drone.json":true,
  "/pa/units/orbital/bug_orbital_chomper/bug_orbital_chomper.json":true,
  "/pa/units/orbital/bug_orbital_fabricator/bug_orbital_fabricator.json":true,
  "/pa/units/orbital/bug_orbital_fabricator/bug_orbital_fabricator_landed.json":true,
  "/pa/units/orbital/bug_orbital_fighter/bug_orbital_fighter.json":true,
  "/pa/units/orbital/bug_orbital_fighter/bug_orbital_fighter_vision.json":true,
  "/pa/units/orbital/bug_orbital_laser/bug_orbital_laser.json":true,
  "/pa/units/orbital/bug_orbital_radar/bug_orbital_radar.json":true,
  "/pa/units/orbital/bug_advanced_orbital_radar/bug_advanced_orbital_radar.json":true,

  "/pa/units/air/bug_fighter/bug_fighter.json":true,
  "/pa/units/air/bug_fighter_adv/bug_fighter_adv.json":true,
  "/pa/units/air/bug_bomber/bug_bomber.json":true,
  "/pa/units/air/bug_bomber_adv/bug_bomber_adv.json":true,
  "/pa/units/air/bug_air_scout/bug_air_scout.json":true,
  "/pa/units/air/bug_air_fab/bug_air_fab.json":true,
  "/pa/units/air/bug_air_fab_adv/bug_air_fab_adv.json":true,
  "/pa/units/air/bug_harpy/bug_harpy.json":true,
  "/pa/units/air/bug_basilisk/bug_basilisk.json":true,
  "/pa/units/air/bug_air_titan/bug_air_titan.json":true,

  "/pa/units/land/bug_combat_fab/bug_combat_fab.json":true,
  "/pa/units/land/bug_combat_fab/bug_combat_fab_cheap.json":true,
  "/pa/units/land/bug_crusher/bug_crusher.json":true,
  "/pa/units/land/bug_hydra/bug_hydra.json":true,
  "/pa/units/land/bug_gren/bug_gren.json":true,
  "/pa/units/land/bug_bot_fab/bug_bot_fab.json":true,
  "/pa/units/land/bug_aa/bug_aa.json":true,
  "/pa/units/land/bug_aa_big/bug_aa_big.json":true,
  "/pa/units/land/bug_bot_fab_advanced/bug_bot_fab_advanced.json":true,
  "/pa/units/land/bug_boomer/bug_boomer.json":true,
  "/pa/units/land/bug_boomer/bug_boomer_r.json":true,
  "/pa/units/land/bug_boomer_big/bug_boomer_big.json":true,
  "/pa/units/land/bug_matriarch/bug_matriarch.json":true,
"/pa/units/land/bug_matriarch/bug_matriarch_death_unit.json":true,
  "/pa/units/land/bug_ripper_stealth/bug_ripper_stealth.json":true,
  "/pa/units/land/bug_ripper/bug_ripper.json":true,
  "/pa/units/land/bug_runner/bug_runner.json":true,
  
  "/pa/units/land/bug_scorcher/bug_scorcher.json":true,
  "/pa/units/land/bug_titan/bug_titan.json":true,
  "/pa/units/land/bug_laser_spider/bug_laser_spider.json":true,

"/pa/units/land/bug_grunt_big/bug_grunt_big.json":true,

  "/pa/units/land/bug_needler/bug_needler.json":true,
  "/pa/units/land/bug_needler/bug_needler_fast.json":true,
  "/pa/units/land/bug_manticore/bug_manticore.json":true,
  "/pa/units/land/bug_sniper/bug_sniper.json":true,

  "/pa/units/land/bug_grunt/bug_grunt.json":true,


"/pa/units/air/air_factory/air_factory.json":true,
"/pa/units/air/air_factory_adv/air_factory_adv.json":true,
"/pa/units/air/air_scout/air_scout.json":true,
"/pa/units/air/base_flyer/base_flyer.json":true,
"/pa/units/air/bomber/bomber.json":true,
"/pa/units/air/bomber_adv/bomber_adv.json":true,
"/pa/units/air/fabrication_aircraft/fabrication_aircraft.json":true,
"/pa/units/air/fabrication_aircraft_adv/fabrication_aircraft_adv.json":true,
"/pa/units/air/fighter/fighter.json":true,
"/pa/units/air/fighter_adv/fighter_adv.json":true,
"/pa/units/air/gunship/gunship.json":true,
"/pa/units/air/transport/transport.json":true,
"/pa/units/commanders/avatar/avatar.json":true,
"/pa/units/commanders/base_commander/base_commander.json":true,
"/pa/units/commanders/imperial_able/imperial_able.json":true,
"/pa/units/commanders/imperial_aceal/imperial_aceal.json":true,
"/pa/units/commanders/imperial_alpha/imperial_alpha.json":true,
"/pa/units/commanders/imperial_aryst0krat/imperial_aryst0krat.json":true,
"/pa/units/commanders/imperial_base/imperial_base.json":true,
"/pa/units/commanders/imperial_chronoblip/imperial_chronoblip.json":true,
"/pa/units/commanders/imperial_delta/imperial_delta.json":true,
"/pa/units/commanders/imperial_enzomatrix/imperial_enzomatrix.json":true,
"/pa/units/commanders/imperial_fiveleafclover/imperial_fiveleafclover.json":true,
"/pa/units/commanders/imperial_fusion/imperial_fusion.json":true,
"/pa/units/commanders/imperial_gamma/imperial_gamma.json":true,
"/pa/units/commanders/imperial_gnugfur/imperial_gnugfur.json":true,
"/pa/units/commanders/imperial_invictus/imperial_invictus.json":true,
"/pa/units/commanders/imperial_jt100010117/imperial_jt100010117.json":true,
"/pa/units/commanders/imperial_kapowaz/imperial_kapowaz.json":true,
"/pa/units/commanders/imperial_kevin4001/imperial_kevin4001.json":true,
"/pa/units/commanders/imperial_mjon/imperial_mjon.json":true,
"/pa/units/commanders/imperial_mostlikely/imperial_mostlikely.json":true,
"/pa/units/commanders/imperial_nagasher/imperial_nagasher.json":true,
"/pa/units/commanders/imperial_progenitor/imperial_progenitor.json":true,
"/pa/units/commanders/imperial_sangudo/imperial_sangudo.json":true,
"/pa/units/commanders/imperial_seniorhelix/imperial_seniorhelix.json":true,
"/pa/units/commanders/imperial_stelarch/imperial_stelarch.json":true,
"/pa/units/commanders/imperial_thechessknight/imperial_thechessknight.json":true,
"/pa/units/commanders/imperial_theta/imperial_theta.json":true,
"/pa/units/commanders/imperial_toddfather/imperial_toddfather.json":true,
"/pa/units/commanders/imperial_tykus24/imperial_tykus24.json":true,
"/pa/units/commanders/imperial_vidicarus/imperial_vidicarus.json":true,
"/pa/units/commanders/imperial_visionik/imperial_visionik.json":true,
"/pa/units/commanders/quad_ajax/quad_ajax.json":true,
"/pa/units/commanders/quad_armalisk/quad_armalisk.json":true,
"/pa/units/commanders/quad_base/quad_base.json":true,
"/pa/units/commanders/quad_calyx/quad_calyx.json":true,
"/pa/units/commanders/quad_commandonut/quad_commandonut.json":true,
"/pa/units/commanders/quad_gambitdfa/quad_gambitdfa.json":true,
"/pa/units/commanders/quad_locust/quad_locust.json":true,
"/pa/units/commanders/quad_mobiousblack/quad_mobiousblack.json":true,
"/pa/units/commanders/quad_osiris/quad_osiris.json":true,
"/pa/units/commanders/quad_potbelly79/quad_potbelly79.json":true,
"/pa/units/commanders/quad_pumpkin/quad_pumpkin.json":true,
"/pa/units/commanders/quad_raventhornn/quad_raventhornn.json":true,
"/pa/units/commanders/quad_sacrificiallamb/quad_sacrificiallamb.json":true,
"/pa/units/commanders/quad_shadowdaemon/quad_shadowdaemon.json":true,
"/pa/units/commanders/quad_spartandano/quad_spartandano.json":true,
"/pa/units/commanders/quad_spiderofmean/quad_spiderofmean.json":true,
"/pa/units/commanders/quad_theflax/quad_theflax.json":true,
"/pa/units/commanders/quad_tokamaktech/quad_tokamaktech.json":true,
"/pa/units/commanders/quad_twoboots/quad_twoboots.json":true,
"/pa/units/commanders/quad_xenosentryprime/quad_xenosentryprime.json":true,
"/pa/units/commanders/quad_xinthar/quad_xinthar.json":true,
"/pa/units/commanders/quad_zancrowe/quad_zancrowe.json":true,
"/pa/units/commanders/raptor_base/raptor_base.json":true,
"/pa/units/commanders/raptor_beast/raptor_beast.json":true,
"/pa/units/commanders/raptor_beast_king/raptor_beast_king.json":true,
"/pa/units/commanders/raptor_beniesk/raptor_beniesk.json":true,
"/pa/units/commanders/raptor_betadyne/raptor_betadyne.json":true,
"/pa/units/commanders/raptor_centurion/raptor_centurion.json":true,
"/pa/units/commanders/raptor_damubbster/raptor_damubbster.json":true,
"/pa/units/commanders/raptor_diremachine/raptor_diremachine.json":true,
"/pa/units/commanders/raptor_enderstryke71/raptor_enderstryke71.json":true,
"/pa/units/commanders/raptor_iwmiked/raptor_iwmiked.json":true,
"/pa/units/commanders/raptor_majuju/raptor_majuju.json":true,
"/pa/units/commanders/raptor_nefelpitou/raptor_nefelpitou.json":true,
"/pa/units/commanders/raptor_nemicus/raptor_nemicus.json":true,
"/pa/units/commanders/raptor_raizell/raptor_raizell.json":true,
"/pa/units/commanders/raptor_rallus/raptor_rallus.json":true,
"/pa/units/commanders/raptor_spz58624/raptor_spz58624.json":true,
"/pa/units/commanders/raptor_stickman9000/raptor_stickman9000.json":true,
"/pa/units/commanders/raptor_unicorn/raptor_unicorn.json":true,
"/pa/units/commanders/raptor_xov/raptor_xov.json":true,
"/pa/units/commanders/raptor_zaazzaa/raptor_zaazzaa.json":true,
"/pa/units/commanders/tank_aeson/tank_aeson.json":true,
"/pa/units/commanders/tank_banditks/tank_banditks.json":true,
"/pa/units/commanders/tank_base/tank_base.json":true,
"/pa/units/commanders/tank_reaver/tank_reaver.json":true,
"/pa/units/commanders/tank_sadiga/tank_sadiga.json":true,
"/pa/units/land/aa_missile_vehicle/aa_missile_vehicle.json":true,
"/pa/units/land/air_defense/air_defense.json":true,
"/pa/units/land/air_defense_adv/air_defense_adv.json":true,
"/pa/units/land/anti_nuke_launcher/anti_nuke_launcher.json":true,
"/pa/units/land/artillery_long/artillery_long.json":true,
"/pa/units/land/artillery_short/artillery_short.json":true,
"/pa/units/land/assault_bot/assault_bot.json":true,
"/pa/units/land/assault_bot_adv/assault_bot_adv.json":true,
"/pa/units/land/avatar_factory/avatar_factory.json":true,
"/pa/units/land/base_bot/base_bot.json":true,
"/pa/units/land/base_structure/base_structure.json":true,
"/pa/units/land/base_vehicle/base_vehicle.json":true,
"/pa/units/land/bot_aa/bot_aa.json":true,
"/pa/units/land/bot_bomb/bot_bomb.json":true,
"/pa/units/land/bot_factory/bot_factory.json":true,
"/pa/units/land/bot_factory_adv/bot_factory_adv.json":true,
"/pa/units/land/bot_grenadier/bot_grenadier.json":true,
"/pa/units/land/bot_sniper/bot_sniper.json":true,
"/pa/units/land/bot_spider_adv/bot_spider_adv.json":true,
"/pa/units/land/bot_tactical_missile/bot_tactical_missile.json":true,
"/pa/units/land/control_module/control_module.json":true,
"/pa/units/land/energy_plant/energy_plant.json":true,
"/pa/units/land/energy_plant_adv/energy_plant_adv.json":true,
"/pa/units/land/energy_storage/energy_storage.json":true,
"/pa/units/land/fabrication_bot/fabrication_bot.json":true,
"/pa/units/land/fabrication_bot_adv/fabrication_bot_adv.json":true,
"/pa/units/land/fabrication_bot_combat/fabrication_bot_combat.json":true,
"/pa/units/land/fabrication_bot_combat_adv/fabrication_bot_combat_adv.json":true,
"/pa/units/land/fabrication_vehicle/fabrication_vehicle.json":true,
"/pa/units/land/fabrication_vehicle_adv/fabrication_vehicle_adv.json":true,
"/pa/units/land/land_barrier/land_barrier.json":true,
"/pa/units/land/land_mine/land_mine.json":true,
"/pa/units/land/land_scout/land_scout.json":true,
"/pa/units/land/laser_defense/laser_defense.json":true,
"/pa/units/land/laser_defense_adv/laser_defense_adv.json":true,
"/pa/units/land/laser_defense_single/laser_defense_single.json":true,
"/pa/units/land/metal_extractor/metal_extractor.json":true,
"/pa/units/land/metal_extractor_adv/metal_extractor_adv.json":true,
"/pa/units/land/metal_storage/metal_storage.json":true,
"/pa/units/land/nuke_launcher/nuke_launcher.json":true,
"/pa/units/land/radar/radar.json":true,
"/pa/units/land/radar_adv/radar_adv.json":true,
"/pa/units/land/tactical_missile_launcher/tactical_missile_launcher.json":true,
"/pa/units/land/tank_armor/tank_armor.json":true,
"/pa/units/land/tank_heavy_armor/tank_heavy_armor.json":true,
"/pa/units/land/tank_heavy_mortar/tank_heavy_mortar.json":true,
"/pa/units/land/tank_laser_adv/tank_laser_adv.json":true,
"/pa/units/land/tank_light_laser/tank_light_laser.json":true,
"/pa/units/land/teleporter/teleporter.json":true,
"/pa/units/land/unit_cannon/unit_cannon.json":true,
"/pa/units/land/vehicle_factory/vehicle_factory.json":true,
"/pa/units/land/vehicle_factory_adv/vehicle_factory_adv.json":true,
"/pa/units/orbital/base_orbital/base_orbital.json":true,
"/pa/units/orbital/base_orbital_structure/base_orbital_structure.json":true,
"/pa/units/orbital/deep_space_radar/deep_space_radar.json":true,
"/pa/units/orbital/defense_satellite/defense_satellite.json":true,
"/pa/units/orbital/delta_v_engine/delta_v_engine.json":true,
"/pa/units/orbital/ion_defense/ion_defense.json":true,
"/pa/units/orbital/mining_platform/mining_platform.json":true,
"/pa/units/orbital/orbital_fabrication_bot/orbital_fabrication_bot.json":true,
"/pa/units/orbital/orbital_factory/orbital_factory.json":true,
"/pa/units/orbital/orbital_fighter/orbital_fighter.json":true,
"/pa/units/orbital/orbital_lander/orbital_lander.json":true,
"/pa/units/orbital/orbital_laser/orbital_laser.json":true,
"/pa/units/orbital/orbital_launcher/orbital_launcher.json":true,
"/pa/units/orbital/radar_satellite/radar_satellite.json":true,
"/pa/units/orbital/radar_satellite_adv/radar_satellite_adv.json":true,
"/pa/units/orbital/solar_array/solar_array.json":true,
"/pa/units/sea/attack_sub/attack_sub.json":true,
"/pa/units/sea/base_ship/base_ship.json":true,
"/pa/units/sea/battleship/battleship.json":true,
"/pa/units/sea/destroyer/destroyer.json":true,
"/pa/units/sea/fabrication_ship/fabrication_ship.json":true,
"/pa/units/sea/fabrication_ship_adv/fabrication_ship_adv.json":true,
"/pa/units/sea/frigate/frigate.json":true,
"/pa/units/sea/missile_ship/missile_ship.json":true,
"/pa/units/sea/naval_factory/naval_factory.json":true,
"/pa/units/sea/naval_factory_adv/naval_factory_adv.json":true,
"/pa/units/sea/nuclear_sub/nuclear_sub.json":true,
"/pa/units/sea/sea_mine/sea_mine.json":true,
"/pa/units/sea/sea_scout/sea_scout.json":true,
"/pa/units/sea/torpedo_launcher/torpedo_launcher.json":true,
"/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv.json":true,
"/pa/units/air/bomber_heavy/bomber_heavy.json":true,
"/pa/units/air/solar_drone/solar_drone.json":true,
"/pa/units/air/strafer/strafer.json":true,
"/pa/units/air/support_platform/support_platform.json":true,
"/pa/units/air/titan_air/titan_air.json":true,
"/pa/units/commanders/tutorial_ai_commander/tutorial_ai_commander.json":true,
"/pa/units/commanders/tutorial_ai_commander_2/tutorial_ai_commander_2.json":true,
"/pa/units/commanders/tutorial_ai_commander_3/tutorial_ai_commander_3.json":true,
"/pa/units/commanders/tutorial_player_commander/tutorial_player_commander.json":true,
"/pa/units/commanders/tutorial_titan_commander/tutorial_titan_commander.json":true,
"/pa/units/land/artillery_unit_launcher/artillery_unit_launcher.json":true,
"/pa/units/land/attack_vehicle/attack_vehicle.json":true,
"/pa/units/land/bot_nanoswarm/bot_nanoswarm.json":true,
"/pa/units/land/bot_support_commander/bot_support_commander.json":true,
"/pa/units/land/bot_tesla/bot_tesla.json":true,
"/pa/units/land/tank_flak/tank_flak.json":true,
"/pa/units/land/tank_hover/tank_hover.json":true,
"/pa/units/land/tank_nuke/tank_nuke.json":true,
"/pa/units/land/titan_bot/titan_bot.json":true,
"/pa/units/land/titan_structure/titan_structure.json":true,
"/pa/units/land/titan_vehicle/titan_vehicle.json":true,
"/pa/units/orbital/orbital_battleship/orbital_battleship.json":true,
"/pa/units/orbital/orbital_carrier/orbital_carrier.json":true,
"/pa/units/orbital/orbital_probe/orbital_probe.json":true,
"/pa/units/orbital/orbital_railgun/orbital_railgun.json":true,
"/pa/units/orbital/titan_orbital/titan_orbital.json":true,
"/pa/units/sea/drone_carrier/carrier/carrier.json":true,
"/pa/units/sea/drone_carrier/drone/drone.json":true,
"/pa/units/sea/fabrication_barge/fabrication_barge.json":true,
"/pa/units/sea/hover_ship/hover_ship.json":true
}