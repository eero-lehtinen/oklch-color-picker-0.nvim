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

function M.start_picker()
  if not client then
    uv.spawn("npx", {
      args = { "electron", "out/main/main.js" },
      -- cwd = "~/repos/oklch-picker",
    }, function(code, signal)
      -- print("exit code", code)
      -- print("exit signal", signal)
    end)
  end

  pipe:listen(128, function(err)
    assert(not err, err)

    client = uv.new_pipe(false)
    pipe:accept(client)

    print("Client connected")

    client:write("#123456\n")

    client:read_start(function(err, data)
      if err then
        print(err)
      elseif data then
        if data ~= "EMPTY" then
          print("Got data: " .. data)
        end
      else
        print("Client disconnected")
        client:close()
        client = nil
      end
    end)
  end)
end

M.start_picker()

vim.api.nvim_create_autocmd("VimLeavePre", {
  callback = function()
    pipe:close()
  end,
})

return M
