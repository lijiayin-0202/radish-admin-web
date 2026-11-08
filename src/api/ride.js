import service from '@/utils/request'

// @Tags RideOrder
// @Summary 分页查询网约车订单
// @Security ApiKeyAuth
// @Produce application/json
// @Param page query int false "页码"
// @Param pageSize query int false "每页数量"
// @Param status query int false "订单状态 0-7"
// @Param keyword query string false "订单号或乘客ID"
// @Success 200 {string} json "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /trip/order/list [get]
export const getRideOrderList = (params) => {
  return service({
    url: '/ride/order/list',
    method: 'get',
    params
  })
}

// @Tags RideOrder
// @Summary 查询订单详情
// @Security ApiKeyAuth
// @Produce application/json
// @Param orderId query string true "订单ID"
// @Success 200 {string} json "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /trip/order/detail [get]
export const getRideOrderDetail = (params) => {
  return service({
    url: '/ride/order/detail',
    method: 'get',
    params
  })
}

// @Tags RideOrder
// @Summary 后台派车（派单 + 车辆确认）
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body object true "订单ID与可选车辆ID"
// @Success 200 {string} json "{"success":true,"data":{},"msg":"派车成功"}"
// @Router /trip/order/dispatch [post]
export const dispatchRideOrder = (data) => {
  return service({
    url: '/ride/order/dispatch',
    method: 'post',
    data
  })
}

// @Tags RideOrder
// @Summary 推进订单状态
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body object true "订单ID与命令类型"
// @Success 200 {string} json "{"success":true,"data":{},"msg":"操作成功"}"
// @Router /trip/order/advance [post]
export const advanceRideOrder = (data) => {
  return service({
    url: '/ride/order/advance',
    method: 'post',
    data
  })
}

// @Tags RidePassenger
// @Summary 分页查询乘客
// @Security ApiKeyAuth
// @Produce application/json
// @Param page query int false "页码"
// @Param pageSize query int false "每页数量"
// @Param keyword query string false "乘客号/手机号/昵称/乘客ID"
// @Param realNameStatus query int false "实名状态 0未提交 1审核中 2通过 3驳回"
// @Param accountStatus query int false "账号状态 0冻结 1正常 2注销"
// @Success 200 {string} json "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /trip/passenger/list [get]
export const getRidePassengerList = (params) => {
  return service({
    url: '/ride/passenger/list',
    method: 'get',
    params
  })
}

// @Tags RidePassenger
// @Summary 查询乘客详情
// @Security ApiKeyAuth
// @Produce application/json
// @Param passengerId query string true "乘客ID"
// @Success 200 {string} json "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /trip/passenger/detail [get]
export const getRidePassengerDetail = (params) => {
  return service({
    url: '/ride/passenger/detail',
    method: 'get',
    params
  })
}

// @Tags RideVehicle
// @Summary 分页查询车辆
// @Security ApiKeyAuth
// @Produce application/json
// @Param page query int false "页码"
// @Param pageSize query int false "每页数量"
// @Param keyword query string false "车牌/车辆编号/VIN/车型"
// @Param operationStatus query int false "运营状态 0停运 1空闲 2接驾中 3待上车 4行程中 5维护"
// @Param onlineStatus query int false "在线状态 0离线 1在线"
// @Success 200 {string} json "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /trip/vehicle/list [get]
export const getRideVehicleList = (params) => {
  return service({
    url: '/ride/vehicle/list',
    method: 'get',
    params
  })
}

// @Tags RideVehicle
// @Summary 查询车辆详情
// @Security ApiKeyAuth
// @Produce application/json
// @Param vehicleId query string true "车辆ID"
// @Success 200 {string} json "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /trip/vehicle/detail [get]
export const getRideVehicleDetail = (params) => {
  return service({
    url: '/ride/vehicle/detail',
    method: 'get',
    params
  })
}

// @Tags RideDispatch
// @Summary 分页查询派单记录
// @Security ApiKeyAuth
// @Produce application/json
// @Param page query int false "页码"
// @Param pageSize query int false "每页数量"
// @Param keyword query string false "派单号/订单号/车牌/订单ID"
// @Param status query int false "状态 0已创建 1已下发 2车辆确认 3失败 4超时"
// @Success 200 {string} json "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /trip/dispatch/list [get]
export const getRideDispatchList = (params) => {
  return service({
    url: '/ride/dispatch/list',
    method: 'get',
    params
  })
}
