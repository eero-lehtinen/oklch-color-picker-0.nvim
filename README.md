# OKLCH Color Picker (for Neovim)

Forked from https://github.com/evilmartians/oklch-picker,
stuffed into an electron app, and added a companion Neovim plugin.

![Screenshot_20240906_010725](https://github.com/user-attachments/assets/81dd8d08-1c3a-499e-931e-774dc1d8461c)

## Features

- Choose a color from your buffer and edit it in a graphical editor
- Works only with hex colors for now (e.g. `#RRGGBB`, short form and alpha also supported)
- Picker uses the Oklch colorspace
  - Motivation: [An article by the Oklab creator](https://bottosson.github.io/posts/oklab/)
  - Oklch uses the same theory as Oklab, but uses parameters that are easier to understand
- Blazing fast <sub>Note: Satisfaction not guaranteed. The first launch takes 3-7 seconds. After use it's not closed, but only hidden to avoid paying for slow startup multiple times. Sockets are used to coordinate the next picking. Memory usage is _only_ about 1.5G. The same window can be used for multiple Neovim instances.</sub>

[brenoprata10/nvim-highlight-colors](https://github.com/brenoprata10/nvim-highlight-colors) is a good companion for this plugin.

## Installation

Node.js and npm are required.

[lazy.nvim](https://github.com/folke/lazy.nvim)

```lua
{
  'eero-lehtinen/oklch-picker',
  build = 'npm install && npm run build',
  opts = {},
},
```

Use `:ColorPickOklch` to pick a color under cursor, or call 
```lua
require('oklch-picker').pick_color_under_cursor()
```

Keymaps you have to setup yourself, e.g. 
```lua
vim.keymap.set('n', '<leader>p', require('oklch-picker').pick_color_under_cursor)
```

## Default Options

```lua
{
  -- Minimize to tray after usage (set to false to minimize to taskbar)
  use_tray = true,
  -- What level of notifications to emit
  log_level = vim.log.levels.INFO,
}
```

## Other similar plugins
- [KabbAmine/vCoolor.vim](https://github.com/KabbAmine/vCoolor.vim)
- [ziontee113/color-picker.nvim](https://github.com/ziontee113/color-picker.nvim)
