local M = {}

function M.setup() end

local nio = require("nio")

-- app.stdin:write("ping\n")
--
local uv = vim.uv

-- let pipeName = platform.isWindows ? `\\\\.\\pipe\\${NAME}` : `/tmp/${NAME}`
--
--
local name = "oklch-picker-nvim"
local pipe_name = vim.loop.os_uname().sysname == "Windows" and "\\\\.\\pipe\\" .. name or "/tmp/" .. name

local pipe = uv.new_pipe(false)
pipe:bind(pipe_name)

local client = nil
local pending = nil

-- Function to detect all hex color codes in a line and their positions
local function find_hex_color(line, cursor_col)
  -- Patterns for hex colors with different formats
  local patterns = {
    "#%x%x%x%x%x%x%x%x", -- #RRGGBBAA
    "#%x%x%x%x%x%x", -- #RRGGBB
    "#%x%x%x%x", -- #RGBA
    "#%x%x%x", -- #RGB
  }

  -- Iterate over each pattern and find all matches
  for _, pattern in ipairs(patterns) do
    for start_pos, end_pos in line:gmatch("()" .. pattern .. "()") do
      -- Check if the cursor is within the match
      if cursor_col >= start_pos and cursor_col <= end_pos - 1 then
        return { start_pos, end_pos - 1 }, line:sub(start_pos, end_pos - 1)
      end
    end
  end

  return nil, nil
end

-- Function to find and possibly select a hex color code if the cursor is over it
local function find_color_under_cursor()
  local cursor_pos = vim.api.nvim_win_get_cursor(0)
  local line_number = cursor_pos[1]
  local cursor_col = cursor_pos[2] + 1 -- Convert to 1-based index

  local bufnr = vim.api.nvim_get_current_buf()

  local line = vim.api.nvim_buf_get_lines(bufnr, line_number - 1, line_number, false)[1]

  -- TODO: use nvim-color-thing-thing to parse
  local pos, color = find_hex_color(line, cursor_col)

  if pos then
    print("Found color at position " .. vim.inspect(pos) .. " with color " .. color)
    pending = {
      bufnr = bufnr,
      line_number = line_number,
      start = pos[1],
      finish = pos[2],
      color = color,
    }

    if not client then
      M.start_picker()
    else
      client:write(color)
    end
  end
end

-- Command to test the function
vim.api.nvim_create_user_command("FindColorUnderCursor", find_color_under_cursor, {})

function M.start_picker()
  uv.spawn("npx", {
    args = { "electron", "out/main/main.js" },
    -- cwd = "~/repos/oklch-picker",
  }, function(code, signal)
    -- print("exit code", code)
    -- print("exit signal", signal)
  end)

  pipe:listen(128, function(err)
    assert(not err, err)

    client = uv.new_pipe(false)
    pipe:accept(client)

    print("Client connected")

    assert(pending)
    client:write(pending.color)

    client:read_start(function(err, data)
      if err then
        print(err)
      elseif data then
        if data ~= "EMPTY" then
          print("Got data: " .. data)
          if pending then
            vim.schedule(function()
              vim.api.nvim_buf_set_text(
                pending.bufnr,
                pending.line_number - 1,
                pending.start - 1,
                pending.line_number - 1,
                pending.finish,
                { data }
              )
              pending = nil
            end)
          end
        end
      else
        print("Client disconnected")
        client:close()
        client = nil
      end
    end)
  end)
end

vim.api.nvim_create_autocmd("VimLeavePre", {
  callback = function()
    pipe:close()
  end,
})

return M
