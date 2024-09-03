const THRESHOLD = 100
function init(): void {
  let main = document.querySelector<HTMLElement>('.main')!

  let expand = main.querySelector<HTMLButtonElement>('.main_expand')!

  // let links = main.querySelectorAll<HTMLAnchorElement>('a')

  let startY = 0

  let isExpanded = expand.ariaExpanded === 'true'

  let mobile = window.matchMedia('(max-width:830px)')

  mobile.addEventListener('change', init)

  function changeExpanded(shouldExpand = false): void {
    if (shouldExpand === isExpanded) return

    isExpanded = shouldExpand
    expand.ariaExpanded = String(isExpanded)
    document.body.classList.toggle('is-main-collapsed', !isExpanded)
  }

  function onTouchStart(event: TouchEvent): void {
    startY = event.touches[0].clientY
  }

  function onTouchMove(event: TouchEvent): void {
    event.preventDefault()
    let endY = event.changedTouches[0].clientY
    let diff = endY - startY
    let allowPositive = isExpanded && diff > 0
    let allowNegative = !isExpanded && diff < 0

    if (allowPositive || allowNegative) {
      main.style.setProperty('--touch-diff', `${diff}px`)
    }
  }

  function onTouchEnd(event: TouchEvent): void {
    let endY = event.changedTouches[0].clientY
    let diff = startY - endY

    main.style.removeProperty('--touch-diff')

    if (Math.abs(diff) > THRESHOLD) {
      changeExpanded(diff > 0)
    }
  }

  function onScroll(): void {
    changeExpanded(false)
  }

  expand.addEventListener('click', () => {
    changeExpanded(!isExpanded)
  })

  if (mobile.matches) {
    window.addEventListener('scroll', onScroll, { once: true })
    main.addEventListener('touchstart', onTouchStart)
    main.addEventListener('touchmove', onTouchMove)
    main.addEventListener('touchend', onTouchEnd)
  } else {
    window.removeEventListener('scroll', onScroll)
    main.removeEventListener('touchstart', onTouchStart)
    main.removeEventListener('touchmove', onTouchMove)
    main.removeEventListener('touchend', onTouchEnd)
  }
}

window.addEventListener('DOMContentLoaded', () => {
  init()
})
