export const OPERATION_DISPATCH_ROUTE_NAME = 'Module3OperationManagement'
const LEGACY_ROUTE_NAME = 'OperationDispatch'
const OPERATION_DISPATCH_COMPONENT = () => import('../view/module3/operationManagement.vue')

// 保留后台菜单的路由标识，只统一绑定模块 3 页面组件。
export function createOperationDispatchRoute(menuRoute = {}) {
  const route = { ...menuRoute }
  delete route.children
  delete route.redirect

  return {
    ...route,
    path: route.path || 'module3OperationManagement',
    name: route.name || OPERATION_DISPATCH_ROUTE_NAME,
    component: OPERATION_DISPATCH_COMPONENT,
    meta: {
      ...route.meta,
      title: '运营调度管理',
      path: '/src/view/module3/operationManagement.vue'
    },
    children: []
  }
}

export function isOperationDispatchMenu(route) {
  const path = String(route?.path || '').replace(/^\/+/, '')
  const title = route?.meta?.title
  return (
    route?.name === OPERATION_DISPATCH_ROUTE_NAME ||
    route?.name === LEGACY_ROUTE_NAME ||
    path === 'operationDispatch' ||
    path === 'module3OperationManagement' ||
    title === '运营调度管理'
  )
}
