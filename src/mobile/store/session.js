// 移动端登录态：独立于后台管理的 user store，避免与 gin-vue-admin 的 x-token 互相污染。
// 令牌来自 POST /api/v1/passenger/auth/mobile-login 的 access_token，有效期 2 小时（后端为准）。
import { reactive } from 'vue'

const TOKEN_KEY = 'ride_passenger_token'
const PROFILE_KEY = 'ride_passenger_profile'

// 读取本地缓存的乘客摘要，用于刷新页面后首屏不闪烁。
function readCachedProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    return null
  }
}

export const session = reactive({
  token: localStorage.getItem(TOKEN_KEY) || '',
  // 个人中心聚合数据（GET /passenger/profile 的 data）
  profile: readCachedProfile()
})

// 当前令牌，未登录返回空串。
export function getToken() {
  return session.token
}

// 是否已登录（仅判断本地是否有令牌，有效性由后端 401 兜底）。
export function isLoggedIn() {
  return Boolean(session.token)
}

// 登录成功后写入令牌与乘客摘要。
export function setSession(token, profile) {
  session.token = token || ''
  localStorage.setItem(TOKEN_KEY, session.token)
  if (profile) {
    session.profile = profile
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  }
}

// 更新个人中心缓存（不发请求，仅同步内存与本地）。
export function setProfile(profile) {
  session.profile = profile || null
  if (profile) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  } else {
    localStorage.removeItem(PROFILE_KEY)
  }
}

// 设备编号：登录审计用（后端 passenger_auth_records.device_id），首次生成后复用。
export function getDeviceId() {
  const KEY = 'ride_device_id'
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = `h5-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem(KEY, id)
  }
  return id
}

// 退出登录 / 令牌失效时清理。
export function clearSession() {
  session.token = ''
  session.profile = null
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(PROFILE_KEY)
}
