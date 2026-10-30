// 移动端 HTTP 客户端。
// 后端契约（ride-hailing 模块1）：统一返回体 { code, message, requestId, data }，
// code 为字符串 "0" 表示成功，其余为 pkg/errcode 中的业务码；HTTP 状态码同步取自业务错误。
// 鉴权：Authorization: Bearer <access_token>（后端 service 层从该头解析乘客身份）。
import axios from 'axios'
import router from '@/router'
import { getToken, clearSession } from '@/mobile/store/session'
import { showToast } from '@/mobile/utils/ui'

// 开发环境经 Vite 代理转发到 ride-hailing（:8000），避免跨域；
// 生产可用 VITE_RIDE_API_BASE 指向网关地址。
const BASE_URL = import.meta.env.VITE_RIDE_API_BASE || '/ride-api'

export const SUCCESS_CODE = '0'

// 业务错误对象，页面可据 code 做差异化处理（如 RESOURCE_NOT_FOUND 静默）。
export class ApiError extends Error {
  constructor(code, message, status) {
    super(message || '请求失败')
    this.name = 'ApiError'
    this.code = code || 'UNKNOWN'
    this.status = status || 0
  }
}

// 生成请求追踪 ID，后端统一响应体会回写 X-Request-Id，便于排查。
function genRequestId() {
  const rand = () => Math.random().toString(16).slice(2, 10)
  return `${Date.now().toString(16)}-${rand()}`
}

const http = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (!config.headers['X-Request-Id']) {
    config.headers['X-Request-Id'] = genRequestId()
  }
  return config
})

// 未登录/令牌过期：清理本地态并回到移动端登录页（不跳后台登录页）。
function redirectToLogin() {
  clearSession()
  const current = router.currentRoute.value
  if (current.path === '/m/login') return
  router.replace({
    path: '/m/login',
    query: { redirect: current.fullPath }
  })
}

http.interceptors.response.use(
  (response) => {
    const body = response.data
    // 非统一返回体（如网关错误页）原样返回，交由调用方处理
    if (!body || typeof body !== 'object' || !('code' in body)) {
      return body
    }
    if (String(body.code) === SUCCESS_CODE) {
      return body.data
    }
    const error = new ApiError(body.code, body.message, response.status)
    if (!response.config.silent) showToast(body.message)
    return Promise.reject(error)
  },
  (error) => {
    const status = error.response?.status || 0
    const body = error.response?.data
    const code = body?.code || (status === 401 ? 'UNAUTHORIZED' : 'NETWORK_ERROR')
    const message =
      body?.message ||
      (status === 401
        ? '登录已过期，请重新登录'
        : error.code === 'ECONNABORTED'
          ? '请求超时，请稍后重试'
          : '网络异常，请检查后端服务是否已启动')

    if (status === 401) {
      redirectToLogin()
    }
    const silent = error.config?.silent
    if (!silent) showToast(message)
    return Promise.reject(new ApiError(code, message, status))
  }
)

export default http
