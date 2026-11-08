export const commandStatusMap = {
  0: '待发送',
  1: '已发送',
  2: '已确认',
  3: '执行成功',
  4: '执行失败'
}

export const orderStatusMap = {
  0: '待派车',
  1: '等待接驾',
  2: '车辆已到达',
  3: '行程进行中',
  4: '行程已完成'
}

export const operationStatusOptions = [
  { label: '空闲', value: 0 },
  { label: '前往接驾', value: 1 },
  { label: '等待乘客', value: 2 },
  { label: '行程中', value: 3 },
  { label: '靠边停车', value: 4 },
  { label: '暂停服务', value: 5 }
]

export const faultLevelOptions = [
  { label: '提示', value: 1 },
  { label: '一般', value: 2 },
  { label: '严重', value: 3 },
  { label: '紧急', value: 4 }
]

export const assistanceTypeOptions = [
  { label: '靠边停车', value: 4 },
  { label: '远程协助', value: 5 }
]

export const mediaTypeOptions = [
  { label: '视频', value: 1 },
  { label: '音频', value: 2 },
  { label: '系统日志', value: 3 }
]
