import './view/base/index.js'
import './view/benchmark/index.js'
import './view/card/index.js'
import './view/chart/index.js'
import './view/checkbox/index.js'
import './view/code/index.js'
import './view/field/index.js'
import './view/fullmodel/index.js'
import './view/layout/index.js'
import './view/main/index.js'
import './view/minimodel/index.js'
import './view/mode/index.js'
import './view/range/index.js'
import './view/sample/index.js'
import './view/settings/index.js'
import './view/link/index.js'

window.addEventListener('DOMContentLoaded', () => {
  doAThing()
})

function doAThing(): void {
  const versions = window.electron.process.versions
  replaceText('.electron-version', `Electron v${versions.electron}`)
  replaceText('.chrome-version', `Chromium v${versions.chrome}`)
  replaceText('.node-version', `Node v${versions.node}`)

  // const ipcHandlerBtn = document.getElementById('ipcHandler')
  // ipcHandlerBtn?.addEventListener('click', () => {
  //   window.electron.ipcRenderer.send('ping')
  // })
}

function replaceText(selector: string, text: string): void {
  const element = document.querySelector<HTMLElement>(selector)
  if (element) {
    element.innerText = text
  }
}
