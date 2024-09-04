window.addEventListener('DOMContentLoaded', () => {
  let doneButton = document.querySelector<HTMLButtonElement>('button.done')!

  doneButton.addEventListener('click', () => {
    window.electron.ipcRenderer.send('finish')
  })

  window.addEventListener('keydown', e => {
    if (e.key === 'd') {
      doneButton.click()
    }
  })
})
