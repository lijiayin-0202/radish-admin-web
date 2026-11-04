import service from '@/utils/request'

// @Tags Order
// @Summary 分页获取订单列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query orderReq.OrderSearch true "分页获取订单列表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /order/order/getOrderList [get]
export const getOrderList = (params) => {
  return service({
    url: '/order/order/getOrderList',
    method: 'get',
    params
  })
}

// @Tags Order
// @Summary 获取订单详情
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query object true "获取订单详情"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /order/order/getOrderDetail [get]
export const getOrderDetail = (params) => {
  return service({
    url: '/order/order/getOrderDetail',
    method: 'get',
    params
  })
}

// @Tags Order
// @Summary 创建订单
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body object true "创建订单"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"创建成功"}"
// @Router /order/order/createOrder [post]
export const createOrder = (data) => {
  return service({
    url: '/order/order/createOrder',
    method: 'post',
    data
  })
}

// @Tags Order
// @Summary 编辑订单
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body object true "编辑订单"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"编辑成功"}"
// @Router /order/order/updateOrder [put]
export const updateOrder = (data) => {
  return service({
    url: '/order/order/updateOrder',
    method: 'put',
    data
  })
}

// @Tags Order
// @Summary 删除订单
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body object true "删除订单"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /order/order/deleteOrder [delete]
export const deleteOrder = (data) => {
  return service({
    url: '/order/order/deleteOrder',
    method: 'delete',
    data
  })
}

// @Tags Order
// @Summary 批量删除订单
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body object true "批量删除订单"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"批量删除成功"}"
// @Router /order/order/deleteOrderByIds [delete]
export const deleteOrderByIds = (data) => {
  return service({
    url: '/order/order/deleteOrderByIds',
    method: 'delete',
    data
  })
}

// @Tags Order
// @Summary 订单状态流转
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body object true "订单状态流转"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"流转成功"}"
// @Router /order/order/changeOrderStatus [post]
export const changeOrderStatus = (data) => {
  return service({
    url: '/order/order/changeOrderStatus',
    method: 'post',
    data
  })
}

// @Tags Order
// @Summary 发起改单
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body object true "发起改单"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"发起成功"}"
// @Router /order/order/createOrderChange [post]
export const createOrderChange = (data) => {
  return service({
    url: '/order/order/createOrderChange',
    method: 'post',
    data
  })
}

// @Tags Order
// @Summary 改单审核
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body object true "改单审核"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"审核成功"}"
// @Router /order/order/auditOrderChange [post]
export const auditOrderChange = (data) => {
  return service({
    url: '/order/order/auditOrderChange',
    method: 'post',
    data
  })
}

// @Tags Order
// @Summary 拦截退回
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body object true "拦截退回"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"拦截申请已提交"}"
// @Router /order/order/createOrderIntercept [post]
export const createOrderIntercept = (data) => {
  return service({
    url: '/order/order/createOrderIntercept',
    method: 'post',
    data
  })
}

// @Tags Order
// @Summary 创建异常工单
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body object true "创建异常工单"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"创建成功"}"
// @Router /order/order/createOrderExceptionTicket [post]
export const createOrderExceptionTicket = (data) => {
  return service({
    url: '/order/order/createOrderExceptionTicket',
    method: 'post',
    data
  })
}
