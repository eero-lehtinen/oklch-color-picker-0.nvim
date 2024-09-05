import { app, shell, BrowserWindow, ipcMain, Tray, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is, platform } from '@electron-toolkit/utils'
import net from 'node:net'

const NAME = 'oklch-picker-nvim'

let useTray = process.argv.includes('--tray')
let tray: Tray | null = null

let pipeName = platform.isWindows ? `\\\\.\\pipe\\${NAME}` : `/tmp/${NAME}.sock`

let nvimColor: string | null = null
let nvimSocket: net.Socket | null = null
let outputColor: string | null = null

let sendNvimColor: ((color: string) => void) | null = null

let server = net.createServer(socket => {
  console.log('Client connected')

  socket.on('data', data => {
    console.log('Got data:', data.toString())
    nvimSocket = socket
    nvimColor = data.toString()
    if (sendNvimColor) {
      console.log('Sending color to renderer', nvimColor)
      sendNvimColor(data.toString())
    }
  })

  socket.on('error', error => {
    console.log('Client error', error)
  })
})

server.listen(pipeName)

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 840,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    icon: join(__dirname, '../renderer/oklch-192.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/preload.mjs'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.on('did-finish-load', () => {
    sendNvimColor = (color: string) => {
      mainWindow.webContents.send('nvim-color', color)
      if (useTray) {
        mainWindow.show()
      } else {
        mainWindow.restore()
      }
    }

    console.log('Did finish load', nvimColor)
    if (nvimColor) {
      console.log('Sending color to renderer2', nvimColor)
      sendNvimColor!(nvimColor!)
      nvimColor = null
    }
  })

  mainWindow.webContents.setWindowOpenHandler(details => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  ipcMain.on('finish', () => {
    if (!nvimSocket) {
      console.log('No socket to send result')
      return
    }
    nvimSocket.write(outputColor ?? 'EMPTY')
    if (useTray) {
      mainWindow.hide()
    } else {
      mainWindow.minimize()
    }
  })

  ipcMain.on('update-color', (_, data) => {
    console.log('update-color', data)
    if (data.trim() !== '') {
      outputColor = data.toString()
    }
  })

  if (useTray) {
    tray = new Tray(join(__dirname, '../renderer/oklch-192.png'))
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Show', click: () => mainWindow.show() },
      { label: 'Quit', click: () => app.quit() }
    ])
    tray.setToolTip('OKLCH Color Picker')
    tray.setContextMenu(contextMenu)
    tray.on('click', () => mainWindow.show())
  }

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('asd.oklch.picker')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window, {
      zoom: true,
      escToCloseWindow: false
    })
  })

  console.log(app.getPath('userData'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
