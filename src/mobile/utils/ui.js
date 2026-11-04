// 移动端轻量交互：轻提示与确认弹窗。
// 刻意不依赖 Element Plus 的消息组件：移动端样式与尺寸需要完全自定义。
import '@/mobile/styles/mobile.scss'

let toastTimer = null

// 轻提示，同一时刻只保留一个节点。
export function showToast(message, duration = 2000) {
  if (!message) return
  let el = document.querySelector('.m-toast')
  if (!el) {
    el = document.createElement('div')
    el.className = 'm-toast'
    document.body.appendChild(el)
  }
  el.textContent = message
  // 强制重排以便连续调用时动画可以重放
  void el.offsetWidth
  el.classList.add('is-show')
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    el.classList.remove('is-show')
  }, duration)
}

// 确认弹窗，返回 Promise<boolean>；用于删除地址、退出登录等二次确认。
export function mConfirm({ title = '提示', message = '', okText = '确定', cancelText = '取消' } = {}) {
  return new Promise((resolve) => {
    const mask = document.createElement('div')
    mask.className = 'm-dialog-mask'

    const dialog = document.createElement('div')
    dialog.className = 'm-dialog'

    const titleEl = document.createElement('div')
    titleEl.className = 'm-dialog__title'
    titleEl.textContent = title

    const bodyEl = document.createElement('div')
    bodyEl.className = 'm-dialog__body'
    bodyEl.textContent = message

    const actions = document.createElement('div')
    actions.className = 'm-dialog__actions'

    const cancelBtn = document.createElement('button')
    cancelBtn.type = 'button'
    cancelBtn.className = 'm-dialog__btn m-dialog__btn--plain'
    cancelBtn.textContent = cancelText

    const okBtn = document.createElement('button')
    okBtn.type = 'button'
    okBtn.className = 'm-dialog__btn m-dialog__btn--primary'
    okBtn.textContent = okText

    actions.appendChild(cancelBtn)
    actions.appendChild(okBtn)
    dialog.appendChild(titleEl)
    dialog.appendChild(bodyEl)
    dialog.appendChild(actions)
    mask.appendChild(dialog)
    document.body.appendChild(mask)

    let settled = false
    const close = (result) => {
      if (settled) return
      settled = true
      mask.classList.remove('is-show')
      window.setTimeout(() => mask.remove(), 180)
      resolve(result)
    }

    cancelBtn.addEventListener('click', () => close(false))
    okBtn.addEventListener('click', () => close(true))
    mask.addEventListener('click', (e) => {
      if (e.target === mask) close(false)
    })

    void mask.offsetWidth
    mask.classList.add('is-show')
  })
}

// 毫秒时间差转「几分钟前 / 几小时前 / 日期」，消息与流水列表复用。
export function friendlyTime(input) {
  if (!input) return ''
  // 后端返回 "2026-10-29T20:15:00+08:00"，Safari 对带空格格式敏感，统一交给 Date 解析 ISO 串
  const date = new Date(String(input).replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return String(input)
  const diff = Date.now() - date.getTime()
  const minute = 60 * 1000
  if (diff >= 0 && diff < minute) return '刚刚'
  if (diff >= 0 && diff < 60 * minute) return `${Math.floor(diff / minute)} 分钟前`
  if (diff >= 0 && diff < 24 * 60 * minute) return `${Math.floor(diff / (60 * minute))} 小时前`
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// 金额展示：保留两位小数，避免 0 显示成 "0.00 元" 之外的多余位数。
export function formatMoney(value) {
  const num = Number(value || 0)
  return num.toFixed(2)
}
