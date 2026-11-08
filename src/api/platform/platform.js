import service from '@/utils/request'

// ============ 协议 ============
export const getAgreementList = (params) => service({ url: '/platform/agreement/list', method: 'get', params })
export const getAgreementById = (id) => service({ url: `/platform/agreement/${id}`, method: 'get' })
export const createAgreement = (data) => service({ url: '/platform/agreement', method: 'post', data })
export const updateAgreement = (data) => service({ url: '/platform/agreement', method: 'put', data })
export const deleteAgreement = (id) => service({ url: `/platform/agreement/${id}`, method: 'delete' })
export const deleteAgreementsByIds = (ids) => service({ url: '/platform/agreements', method: 'delete', params: { ids } })

// ============ 公告 ============
export const getAnnouncementList = (params) => service({ url: '/platform/announcement/list', method: 'get', params })
export const createAnnouncement = (data) => service({ url: '/platform/announcement', method: 'post', data })
export const updateAnnouncement = (data) => service({ url: '/platform/announcement', method: 'put', data })
export const deleteAnnouncement = (id) => service({ url: `/platform/announcement/${id}`, method: 'delete' })
export const deleteAnnouncementsByIds = (ids) => service({ url: '/platform/announcements', method: 'delete', params: { ids } })

// ============ 平台参数 ============
export const getSettingList = (params) => service({ url: '/platform/setting/list', method: 'get', params })
export const createSetting = (data) => service({ url: '/platform/setting', method: 'post', data })
export const updateSetting = (data) => service({ url: '/platform/setting', method: 'put', data })
export const deleteSetting = (id) => service({ url: `/platform/setting/${id}`, method: 'delete' })
export const deleteSettingsByIds = (ids) => service({ url: '/platform/settings', method: 'delete', params: { ids } })

// ============ 角色 ============
export const getRoleList = (params) => service({ url: '/platform/role/list', method: 'get', params })
export const getRolePermissions = (id) => service({ url: `/platform/role/${id}/permissions`, method: 'get' })
export const createRole = (data) => service({ url: '/platform/role', method: 'post', data })
export const updateRole = (data) => service({ url: '/platform/role', method: 'put', data })
export const deleteRole = (id) => service({ url: `/platform/role/${id}`, method: 'delete' })
export const assignRolePermissions = (data) => service({ url: '/platform/role/permissions', method: 'post', data })

// ============ 权限点 ============
export const getPermissionList = (params) => service({ url: '/platform/permission/list', method: 'get', params })
export const getPermissionTree = () => service({ url: '/platform/permission/tree', method: 'get' })
export const createPermission = (data) => service({ url: '/platform/permission', method: 'post', data })
export const updatePermission = (data) => service({ url: '/platform/permission', method: 'put', data })
export const deletePermission = (id) => service({ url: `/platform/permission/${id}`, method: 'delete' })

// ============ 后台账号 ============
export const getOperatorList = (params) => service({ url: '/platform/operator/list', method: 'get', params })
export const getOperatorRoles = (id) => service({ url: `/platform/operator/${id}/roles`, method: 'get' })
export const createOperator = (data) => service({ url: '/platform/operator', method: 'post', data })
export const updateOperator = (data) => service({ url: '/platform/operator', method: 'put', data })
export const deleteOperator = (id) => service({ url: `/platform/operator/${id}`, method: 'delete' })
export const assignOperatorRoles = (data) => service({ url: '/platform/operator/roles', method: 'post', data })

// ============ 审计日志 ============
export const getAuditLogList = (params) => service({ url: '/platform/auditLog/list', method: 'get', params })

// ============ 计价规则 ============
export const getPricingRuleList = (params) => service({ url: '/platform/pricingRule/list', method: 'get', params })
export const createPricingRule = (data) => service({ url: '/platform/pricingRule', method: 'post', data })
export const updatePricingRule = (data) => service({ url: '/platform/pricingRule', method: 'put', data })
export const deletePricingRule = (id) => service({ url: `/platform/pricingRule/${id}`, method: 'delete' })
export const deletePricingRulesByIds = (ids) => service({ url: '/platform/pricingRules', method: 'delete', params: { ids } })

// ============ 地图版本 ============
export const getMapVersionList = (params) => service({ url: '/platform/mapVersion/list', method: 'get', params })
export const createMapVersion = (data) => service({ url: '/platform/mapVersion', method: 'post', data })
export const updateMapVersion = (data) => service({ url: '/platform/mapVersion', method: 'put', data })
export const deleteMapVersion = (id) => service({ url: `/platform/mapVersion/${id}`, method: 'delete' })
export const activateMapVersion = (id) => service({ url: `/platform/mapVersion/${id}/activate`, method: 'post' })

// ============ 消息推送模板 ============
export const getPushTemplateList = (params) => service({ url: '/platform/pushTemplate/list', method: 'get', params })
export const createPushTemplate = (data) => service({ url: '/platform/pushTemplate', method: 'post', data })
export const updatePushTemplate = (data) => service({ url: '/platform/pushTemplate', method: 'put', data })
export const deletePushTemplate = (id) => service({ url: `/platform/pushTemplate/${id}`, method: 'delete' })
export const deletePushTemplatesByIds = (ids) => service({ url: '/platform/pushTemplates', method: 'delete', params: { ids } })

// ============ 统计大屏 ============
export const getDashboardOverview = (params) => service({ url: '/platform/dashboard/overview', method: 'get', params })
export const getVehicleHeatmap = () => service({ url: '/platform/dashboard/vehicle-heatmap', method: 'get' })
export const getStationFlow = (params) => service({ url: '/platform/dashboard/station-flow', method: 'get', params })
// 城市/区域级联下拉选项
export const getDashboardCities = () => service({ url: '/platform/dashboard/cities', method: 'get' })
export const getDashboardAreas = (params) => service({ url: '/platform/dashboard/areas', method: 'get', params })
