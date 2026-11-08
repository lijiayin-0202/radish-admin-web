import service from '@/utils/request'

// ============ 乘客 ============
export const getPassengerList = (params) => service({ url: '/trip/passenger/list', method: 'get', params })
export const createPassenger = (data) => service({ url: '/trip/passenger', method: 'post', data })
export const updatePassenger = (data) => service({ url: '/trip/passenger', method: 'put', data })
export const deletePassenger = (id) => service({ url: `/trip/passenger/${id}`, method: 'delete' })

// ============ 订单 ============
export const getOrderList = (params) => service({ url: '/trip/order/list', method: 'get', params })
export const getOrderStatusLogs = (params) => service({ url: '/trip/order/statusLogs', method: 'get', params })

// ============ 运营区域 ============
export const getAreaList = (params) => service({ url: '/trip/area/list', method: 'get', params })
export const createArea = (data) => service({ url: '/trip/area', method: 'post', data })
export const updateArea = (data) => service({ url: '/trip/area', method: 'put', data })
export const deleteArea = (id) => service({ url: `/trip/area/${id}`, method: 'delete' })

// ============ 站点 ============
export const getStationList = (params) => service({ url: '/trip/station/list', method: 'get', params })
export const createStation = (data) => service({ url: '/trip/station', method: 'post', data })
export const updateStation = (data) => service({ url: '/trip/station', method: 'put', data })
export const deleteStation = (id) => service({ url: `/trip/station/${id}`, method: 'delete' })

// ============ 车辆 ============
export const getVehicleList = (params) => service({ url: '/trip/vehicle/list', method: 'get', params })
export const createVehicle = (data) => service({ url: '/trip/vehicle', method: 'post', data })
export const updateVehicle = (data) => service({ url: '/trip/vehicle', method: 'put', data })
export const deleteVehicle = (id) => service({ url: `/trip/vehicle/${id}`, method: 'delete' })

// ============ 派单记录 ============
export const getDispatchList = (params) => service({ url: '/trip/dispatch/list', method: 'get', params })

// ============ 车辆指令 ============
export const getCommandList = (params) => service({ url: '/trip/command/list', method: 'get', params })
export const createCommand = (data) => service({ url: '/trip/command', method: 'post', data })
export const updateCommand = (data) => service({ url: '/trip/command', method: 'put', data })

// ============ 车辆故障 ============
export const getFaultList = (params) => service({ url: '/trip/fault/list', method: 'get', params })
export const createFault = (data) => service({ url: '/trip/fault', method: 'post', data })
export const updateFault = (data) => service({ url: '/trip/fault', method: 'put', data })

// ============ 上车核验 ============
export const getBoardingList = (params) => service({ url: '/trip/boarding/list', method: 'get', params })

// ============ 安全事件 ============
export const getIncidentList = (params) => service({ url: '/trip/incident/list', method: 'get', params })
export const updateIncident = (data) => service({ url: '/trip/incident', method: 'put', data })
