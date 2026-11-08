import assert from 'node:assert/strict'
import test from 'node:test'
import { createMemoryHistory, createRouter } from 'vue-router'

import {
  createOperationDispatchRoute,
  isOperationDispatchMenu
} from '../src/utils/module3Route.js'

test('运营调度管理默认路由解析到页面组件', () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/layout',
        name: 'layout',
        component: {},
        children: [createOperationDispatchRoute()]
      }
    ]
  })

  const resolved = router.resolve('/layout/module3OperationManagement')

  assert.equal(resolved.name, 'Module3OperationManagement')
  assert.equal(typeof resolved.matched.at(-1).components.default, 'function')
})

test('动态菜单中的运营调度入口不应重复注册', () => {
  assert.equal(isOperationDispatchMenu({ name: 'OperationDispatch' }), true)
  assert.equal(isOperationDispatchMenu({ path: 'operationDispatch' }), true)
  assert.equal(isOperationDispatchMenu({ name: 'Module3OperationManagement' }), true)
  assert.equal(isOperationDispatchMenu({ name: 'Command', path: 'command' }), false)
})

test('后台菜单使用原始标识时仍绑定运营调度页面组件', () => {
  const menuRoute = {
    path: 'module3OperationManagement',
    name: 'Module3OperationManagement',
    component: 'view/module3/operationManagement.vue',
    meta: { title: '运营调度管理' }
  }

  const route = createOperationDispatchRoute(menuRoute)

  assert.equal(isOperationDispatchMenu(menuRoute), true)
  assert.equal(route.name, 'Module3OperationManagement')
  assert.equal(route.path, 'module3OperationManagement')
  assert.equal(typeof route.component, 'function')
})

test('运营调度管理即使携带旧子菜单也必须注册为页面叶子路由', () => {
  const route = createOperationDispatchRoute({
    path: 'operationDispatch',
    name: 'OperationDispatch',
    redirect: '/layout/trip/operationDispatch/legacy',
    children: [{ path: 'legacy', name: 'LegacyOperationDispatch' }],
    meta: { title: '运营调度管理' }
  })

  assert.deepEqual(route.children, [])
  assert.equal('redirect' in route, false)
  assert.equal(typeof route.component, 'function')
})
