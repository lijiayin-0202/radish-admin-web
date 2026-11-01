export const parseJsonObject = (value, fieldName) => {
  if (!value.trim()) return {}
  const result = JSON.parse(value)
  if (!result || Array.isArray(result) || typeof result !== 'object') {
    throw new Error(`${fieldName}必须是 JSON 对象`)
  }
  return result
}

export const toIsoString = (value) => {
  return value ? new Date(value).toISOString() : undefined
}

export const hashCredential = async (value) => {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export const errorMessage = (error) => {
  return error.response?.data?.message || error.response?.data?.reason || error.message || '请求失败'
}

const phaseByOrderStatus = {
  1: 'waiting',
  2: 'arrived',
  3: 'riding',
  4: 'completed'
}

// 将后端订单状态转换成乘客端页面阶段。
export const resolveTripPhase = (orderStatus) => {
  return phaseByOrderStatus[orderStatus] || 'waiting'
}

// 仅合并有效数值，避免异常遥测让页面显示 NaN。
export const mergePreviewTelemetry = (current, incoming) => {
  return Object.entries(incoming).reduce((result, [key, value]) => {
    if (typeof value !== 'number' || Number.isFinite(value)) result[key] = value
    return result
  }, { ...current })
}
