import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is, platform } from '@electron-toolkit/utils'
import { connect } from 'node:net'

// import icon from '../../resources/icon.png?asset'
//

const NAME = 'oklch-picker-nvim'

let pipeName = platform.isWindows ? `\\\\.\\pipe\\${NAME}` : `/tmp/${NAME}`

let pageReady = false
let nvimColor: string | null = null
let outputColor: string | null = null

let sendNvimColor: ((color: string) => void) | null = null

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

let socket = connect(pipeName, () => {
  console.log('Connected to nvim')

  socket.on('data', data => {
    outputColor = null
    console.log('Got data:', data.toString())
    if (sendNvimColor) {
      console.log('Sending color to renderer1', nvimColor)
      sendNvimColor(data.toString())
    } else {
      nvimColor = data.toString()
    }
  })
})

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 840,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    // ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/preload.mjs'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.on('did-finish-load', () => {
    pageReady = true
    sendNvimColor = (color: string) => {
      mainWindow.webContents.send('nvim-color', color)
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.focus()
    }

    if (nvimColor) {
      console.log('Sending color to renderer2', nvimColor)
      sendNvimColor(nvimColor)
      nvimColor = null
    }
  })

  mainWindow.webContents.setWindowOpenHandler(details => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  ipcMain.on('finish', () => {
    socket.write(outputColor ?? 'EMPTY')
    mainWindow.minimize()
  })

  ipcMain.on('update-color', (_, data) => {
    console.log('update-color', data)
    outputColor = data.toString()
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
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
