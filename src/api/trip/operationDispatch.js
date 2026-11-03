import service from '@/utils/request'

// 运营调度管理（对应后端 /operationDispatch/* 路由）
export const getOperationDispatchList = (params) => service({ url: '/operationDispatch/list', method: 'get', params })
export const findOperationDispatch = (params) => service({ url: '/operationDispatch/find', method: 'get', params })
export const createOperationDispatch = (data) => service({ url: '/operationDispatch/create', method: 'post', data })
export const updateOperationDispatch = (data) => service({ url: '/operationDispatch/update', method: 'put', data })
export const deleteOperationDispatch = (data) => service({ url: '/operationDispatch/delete', method: 'delete', data })
export const deleteOperationDispatchByIds = (data) => service({ url: '/operationDispatch/deleteByIds', method: 'delete', data })
export const cancelOperationDispatch = (data) => service({ url: '/operationDispatch/cancel', method: 'post', data })
