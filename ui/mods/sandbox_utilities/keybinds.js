action_sets.hacks.paste_selection = function () {
  if (model.pasteSelection) model.pasteSelection()
}
api.settings.definitions.keyboard.settings.paste_selection = {
  title: 'selection paste units',
  type: 'keybind',
  set: 'mods',
  display_group: 'mods',
  display_sub_group: 'sandbox utilities',
  default: 'alt+v'
}



action_sets.hacks.copy_selection = function () {
  if (model.copySelection) model.copySelection()
}
api.settings.definitions.keyboard.settings.copy_selection = {
  title: 'copy current selection',
  type: 'keybind',
  set: 'mods',
  display_group: 'mods',
  display_sub_group: 'sandbox utilities',
  default: 'alt+c'
}

action_sets.hacks.toggle_sandbox_menu = function () {
    if (model.toggleSandboxMenu) model.toggleSandboxMenu()
  }
  api.settings.definitions.keyboard.settings.toggle_sandbox_menu = {
    title: 'toggle sandbox menu',
    type: 'keybind',
    set: 'mods',
    display_group: 'mods',
    display_sub_group: 'sandbox utilities',
    default: 'alt+x'
  }

console.log("sandbox utils settings loaded")