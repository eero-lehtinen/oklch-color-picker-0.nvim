window.addEventListener('DOMContentLoaded', () => {
  let doneButton = document.querySelector<HTMLButtonElement>('button.done')!

  doneButton.addEventListener('click', () => {
    window.electron.ipcRenderer.send('close')
    console.log('close')
  })
})
