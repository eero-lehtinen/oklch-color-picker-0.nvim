# OKLCH & LCH Color Picker (for Neovim)

Forked from [https://github.com/evilmartians/oklch-picker] ([`oklch.com`](https://oklch.com)),
packaged into an electron app and integrated into Neovim for easy color picking.

## Features

- Choose a color from your buffer and edit it in a graphical editor
- Works only with hex colors for now (e.g. `#RRGGBB`, short form and alpha also supported)
- Picker uses OKLCH colorspace (motivation: [The article by Oklab creator](https://bottosson.github.io/posts/oklab/))
- Blazing fast <sub>Note: Satisfaction not guaranteed. The first launch takes 2-5 seconds. After the first use it's only hidden to avoid subsequent slow startups. The plugin uses sockets to tell the app when to start the next picking. Memory usage is _only_ about 1.5G. The same window can be used for multiple Neovim instances.</sub>

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

Use `:ColorPickOklch` to pick a color under cursor, or call `require('oklch-picker').pick_color_under_cursor()` from Lua. Keymaps you have to setup yourself.

## Default Options

```lua
{
  -- Minimize to tray after usage (set to false to minimize to taskbar)
  use_tray = true,
  -- What level of notifications to emit
  log_level = vim.log.levels.INFO,
}
```
