import service from '@/utils/request'

const rideRequest = (config) => {
  return service({
    baseURL: import.meta.env.VITE_RIDE_HAILING_API || '/ride-api',
    ...config
  }).then((response) => response.data ?? response)
}

export const getPendingCommands = (params) => rideRequest({
  url: '/api/v1/vehicle/commands/pending',
  method: 'get',
  params
})

export const acknowledgeCommand = (commandNo) => rideRequest({
  url: `/api/v1/vehicle/commands/${encodeURIComponent(commandNo)}/ack`,
  method: 'post',
  data: { commandNo }
})

export const reportCommandResult = (commandNo, data) => rideRequest({
  url: `/api/v1/vehicle/commands/${encodeURIComponent(commandNo)}/result`,
  method: 'post',
  data: { commandNo, ...data }
})

export const verifyBoarding = (orderId, data) => rideRequest({
  url: `/api/v1/vehicle/orders/${orderId}/boarding-verifications`,
  method: 'post',
  data: { orderId, ...data }
})

export const reportTelemetry = (data) => rideRequest({
  url: '/api/v1/vehicle/telemetry',
  method: 'post',
  data
})

export const reportFault = (data) => rideRequest({
  url: '/api/v1/vehicle/faults',
  method: 'post',
  data
})

export const getHmiView = (orderId) => rideRequest({
  url: `/api/v1/vehicle/orders/${orderId}/hmi-view`,
  method: 'get'
})

export const requestAssistance = (orderId, data) => rideRequest({
  url: `/api/v1/vehicle/orders/${orderId}/assistance`,
  method: 'post',
  data: { orderId, ...data }
})

export const reportMediaRecord = (data) => rideRequest({
  url: '/api/v1/vehicle/media-records',
  method: 'post',
  data
})
