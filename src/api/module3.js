import service from '@/utils/request'

// 运营区域接口由后台 BFF 转发，浏览器不会直接访问微服务。
export const listServiceAreas = (data) =>
  service({ url: '/module3/service-area/list', method: 'post', data })

export const getServiceArea = (data) =>
  service({ url: '/module3/service-area/detail', method: 'post', data })

export const createServiceArea = (data) =>
  service({ url: '/module3/service-area/create', method: 'post', data })

export const updateServiceArea = (data) =>
  service({ url: '/module3/service-area/update', method: 'post', data })

export const changeServiceAreaStatus = (data) =>
  service({ url: '/module3/service-area/change-status', method: 'post', data })

export const replaceServiceAreaSchedules = (data) =>
  service({ url: '/module3/service-area/schedules', method: 'post', data })

export const listStations = (data) =>
  service({ url: '/module3/station/list', method: 'post', data })

export const createStation = (data) =>
  service({ url: '/module3/station/create', method: 'post', data })

export const updateStation = (data) =>
  service({ url: '/module3/station/update', method: 'post', data })

export const changeStationStatus = (data) =>
  service({ url: '/module3/station/change-status', method: 'post', data })
