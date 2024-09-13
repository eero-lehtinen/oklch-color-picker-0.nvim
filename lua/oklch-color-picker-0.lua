local M = {}

M.default_opts = {
  use_tray = true,
  log_level = vim.log.levels.INFO,
}

function M.setup(config)
  M.config = vim.tbl_deep_extend("force", M.default_opts, config or {})
end

local uv = vim.uv

local name = "oklch-picker.nvim"
local pipe_name = vim.loop.os_uname().sysname == "Windows" and "\\\\.\\pipe\\" .. name or "/tmp/" .. name .. ".sock"

local pipe = nil
local connected = false
local pending_edit = nil

local app_started = false

local function log(msg, level)
  if level >= M.config.log_level then
    vim.schedule(function()
      vim.notify(msg, level)
    end)
  end
end

local function script_path()
  local str = debug.getinfo(2, "S").source:sub(2)
  return str:match("(.*/)")
end

function M.start_app()
  if app_started then
    return
  end

  app_started = true

  local cmd = "./node_modules/electron/dist/electron"
  local args = { "." }
  if M.config.use_tray then
    table.insert(args, "--tray")
  end
  table.insert(args, "--ozone-platform-hint=auto")

  uv.spawn(cmd, { args = args, cwd = script_path() .. ".." })
end

local function send_color(color)
  assert(connected, "not connected")
  assert(pipe, "pipe is nil")
  log("OKLCH sending color: " .. color, vim.log.levels.DEBUG)
  pipe:write(color, function(err)
    if err then
      log("OKLCH send error: " .. err, vim.log.levels.ERROR)
    end
  end)
end

local function connect_to_app(start_time)
  if not start_time then
    start_time = vim.loop.hrtime()
    app_started = false
  end

  if vim.loop.hrtime() - start_time > 4 * 1000000000 then
    log("OKLCH color picker timed out", vim.log.levels.ERROR)
    return
  end

  if connected then
    return
  end

  pipe = uv.new_pipe(false)

  local on_connect = function(connect_err)
    if connect_err then
      log("OKLCH couldn't connect: " .. connect_err, vim.log.levels.DEBUG)

      -- Likely couldn't connect because the app isn't running, so start it
      M.start_app()

      uv.sleep(50)
      vim.schedule(function()
        connect_to_app(start_time)
      end)

      return
    end

    connected = true

    log("OKLCH connected", vim.log.levels.DEBUG)

    if pending_edit then
      send_color(pending_edit.color)
    end

    local on_read = function(err, data)
      if data then
        log("Got data: " .. data, vim.log.levels.DEBUG)
        if data == "EMPTY" or not pending_edit then
          return
        end
        vim.schedule(function()
          vim.api.nvim_buf_set_text(
            pending_edit.bufnr,
            pending_edit.line_number - 1,
            pending_edit.start - 1,
            pending_edit.line_number - 1,
            pending_edit.finish,
            { data }
          )
          pending_edit = nil
        end)
      elseif err then
        log("OKLCH receive error: " .. err, vim.log.levels.ERROR)
      else
        log("OKLCH disconnected", vim.log.levels.DEBUG)
        pipe:close()
        connected = false
      end
    end

    pipe:read_start(on_read)
  end

  local _, err_name, err_message = pipe:connect(pipe_name, on_connect)
  if err_name then
    log("OKLCH failed to start connection" .. err_name .. " " .. err_message, vim.log.levels.ERROR)
  end
end

local function find_hex_color(line, cursor_col)
  local patterns = {
    "#%x%x%x%x%x%x%x%x", -- #RRGGBBAA
    "#%x%x%x%x%x%x", -- #RRGGBB
    "#%x%x%x%x", -- #RGBA
    "#%x%x%x", -- #RGB
  }

  for _, pattern in ipairs(patterns) do
    for start_pos, end_pos in line:gmatch("()" .. pattern .. "()") do
      if cursor_col >= start_pos and cursor_col <= end_pos - 1 then
        return { start_pos, end_pos - 1 }, line:sub(start_pos, end_pos - 1)
      end
    end
  end

  return nil, nil
end

function M.pick_color_under_cursor()
  local cursor_pos = vim.api.nvim_win_get_cursor(0)
  local row = cursor_pos[1]
  local col = cursor_pos[2] + 1

  local bufnr = vim.api.nvim_get_current_buf()

  local line = vim.api.nvim_buf_get_lines(bufnr, row - 1, row, false)[1]

  -- TODO: use nvim-color-thing-thing to parse
  local pos, color = find_hex_color(line, col)

  if not pos or not color then
    log("No color under cursor", vim.log.levels.INFO)
    return
  end

  log("Found color at position " .. vim.inspect(pos) .. " with color " .. color, vim.log.levels.DEBUG)
  pending_edit = {
    bufnr = bufnr,
    line_number = row,
    start = pos[1],
    finish = pos[2],
    color = color,
  }

  if connected then
    send_color(pending_edit.color)
  else
    connect_to_app()
  end
end

vim.api.nvim_create_user_command("ColorPickOklch", M.pick_color_under_cursor, {})

vim.api.nvim_create_autocmd("VimLeavePre", {
  callback = function()
    if pipe and not pipe:is_closing() then
      pipe:close()
    end
  end,
})

return M
