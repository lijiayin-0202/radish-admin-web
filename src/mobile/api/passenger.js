// 乘客账号与个人中心接口（对齐 ride-hailing/api/ridehailing/v1/passenger_account.proto）。
// 路径前缀 /v1/passenger 由 axios baseURL（/ride-api）代理到后端 /api/v1/passenger。
import http from './http'

// 去掉空值参数，避免 optional 字段被序列化成空串触发后端参数校验失败。
function compact(params = {}) {
  return Object.keys(params).reduce((acc, key) => {
    const value = params[key]
    if (value !== undefined && value !== null && value !== '') acc[key] = value
    return acc
  }, {})
}

// ---------------------------- 登录认证 ----------------------------

// 发送登录验证码。scene 本页面固定 LOGIN。
export function sendLoginSmsCode(mobile) {
  return http.post('/v1/passenger/auth/sms-codes', { mobile, scene: 'LOGIN' })
}

// 手机号验证码登录/注册，新手机号自动注册。
export function mobileLogin({ mobile, smsCode, verificationId, deviceId }) {
  return http.post(
    '/v1/passenger/auth/mobile-login',
    compact({
      mobile,
      sms_code: smsCode,
      verification_id: verificationId,
      device_id: deviceId
    })
  )
}

// ---------------------------- 个人中心 ----------------------------

// 个人中心聚合查询：资料 + 钱包余额 + 券张数 + 未读消息 + 签到状态。
export function getProfile() {
  return http.get('/v1/passenger/profile')
}

// 修改用户名（昵称），2-20 个字符。
export function updateNickname(nickname) {
  return http.patch('/v1/passenger/profile', { nickname })
}

// 发送指定场景验证码：LOGIN / CHANGE_MOBILE_OLD（原号）/ CHANGE_MOBILE_NEW（新号）。
// 换绑场景需要登录态，后端按 token 校验手机号归属。
export function sendSmsCode({ mobile, scene }) {
  return http.post('/v1/passenger/auth/sms-codes', { mobile, scene })
}

// 更换绑定手机号：原号与新号各需一次验证码。
export function changeMobile({ newMobile, oldSmsCode, oldVerificationId, newSmsCode, newVerificationId }) {
  return http.post(
    '/v1/passenger/mobile-change',
    compact({
      new_mobile: newMobile,
      old_sms_code: oldSmsCode,
      old_verification_id: oldVerificationId,
      new_sms_code: newSmsCode,
      new_verification_id: newVerificationId
    })
  )
}

// 更新通知/隐私/分享偏好，只传需要变更的字段即可（PATCH 语义）。
export function updateSettings(preferences) {
  return http.patch('/v1/passenger/settings', { preferences: compact(preferences) })
}

// ---------------------------- 常用地址 ----------------------------

export function listAddresses({ page = 1, pageSize = 20, addressType } = {}) {
  return http.get('/v1/passenger/addresses', {
    params: compact({ page, page_size: pageSize, address_type: addressType })
  })
}

export function createAddress(payload) {
  return http.post('/v1/passenger/addresses', compact(payload))
}

export function updateAddress(id, payload) {
  return http.patch(`/v1/passenger/addresses/${id}`, compact(payload))
}

export function deleteAddress(id) {
  return http.delete(`/v1/passenger/addresses/${id}`)
}

// ---------------------------- 卡券 ----------------------------

// status：0 未使用 / 1 已锁定 / 2 已使用 / 3 已过期；不传表示全部。
export function listCoupons({ page = 1, pageSize = 50, status } = {}) {
  return http.get('/v1/passenger/coupons', {
    params: compact({ page, page_size: pageSize, status })
  })
}

// ---------------------------- 积分与签到 ----------------------------

export function getPoints({ page = 1, pageSize = 20 } = {}) {
  return http.get('/v1/passenger/points', {
    params: compact({ page, page_size: pageSize })
  })
}

// 每日签到；当天重复签到后端幂等返回已签到结果（already_signed=true）。
export function signIn() {
  return http.post('/v1/passenger/sign-ins', {})
}

// ---------------------------- 消息中心 ----------------------------

export function listNotifications({ page = 1, pageSize = 20, isRead } = {}) {
  return http.get('/v1/passenger/notifications', {
    params: compact({ page, page_size: pageSize, is_read: isRead })
  })
}

// ids 为空且 markAll 为真时全部已读。
export function markNotificationsRead({ ids = [], markAll = false } = {}) {
  return http.patch('/v1/passenger/notifications', { ids, mark_all: markAll })
}

// ---------------------------- 实名认证 ----------------------------

export function submitRealName({ realName, idCardNo }) {
  return http.post('/v1/passenger/real-name', compact({ real_name: realName, id_card_no: idCardNo }))
}

export function getRealName() {
  return http.get('/v1/passenger/real-name')
}

// ---------------------------- 登录设备与登录记录 ----------------------------

// 登录设备列表（账号管理页「登录设备」），按最近登录时间倒序。
export function listLoginDevices({ page = 1, pageSize = 20 } = {}) {
  return http.get('/v1/passenger/login-devices', {
    params: compact({ page, page_size: pageSize })
  })
}

// 登录记录列表（成功与失败都返回）；loginResult：0 失败 / 1 成功，不传表示全部。
export function listLoginRecords({ page = 1, pageSize = 20, loginResult } = {}) {
  return http.get('/v1/passenger/login-records', {
    params: compact({ page, page_size: pageSize, login_result: loginResult })
  })
}
