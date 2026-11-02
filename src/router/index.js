import { createRouter, createWebHashHistory } from 'vue-router'
import mobileRoutes, { installMobileGuard } from '@/mobile/router'

const routes = [
  {
    // 站点入口即萝卜快跑登录页；后台管理登录仍保留在 /login
    path: '/',
    redirect: '/m/login'
  },
  {
    path: '/init',
    name: 'Init',
    component: () => import('@/view/init/index.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/view/login/index.vue')
  },
  {
    path: '/scanUpload',
    name: 'ScanUpload',
    meta: {
      title: '扫码上传',
      client: true
    },
    component: () => import('@/view/example/upload/scanUpload.vue')
  },
  // 移动端 H5（/m/**）：独立于后台管理菜单，静态注册、不依赖动态路由
  ...mobileRoutes,
  {
    path: '/:catchAll(.*)',
    meta: {
      closeTab: true
    },
    component: () => import('@/view/error/index.vue')
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 乘客端登录态守卫需在后台管理守卫之前生效，故在实例创建后立即注册
installMobileGuard(router)

export default router
