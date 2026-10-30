// 移动端移动 H5 路由表。
// 约定：
//   1. 全部挂在 /m 前缀下，meta.client = true 让后台路由守卫直接放行（见 src/permission.js）；
//   2. 登录态校验由 installMobileGuard 统一处理，页面内不再重复判断；
//   3. 页面按需懒加载，首屏只加载登录/个人中心所需代码。
import { session } from '@/mobile/store/session'

const mobileRoutes = [
  {
    path: '/m',
    redirect: '/m/profile'
  },
  {
    path: '/m/login',
    name: 'MobileLogin',
    component: () => import('@/mobile/views/Login.vue'),
    meta: { title: '登录', client: true }
  },
  {
    path: '/m/profile',
    name: 'MobileProfile',
    component: () => import('@/mobile/views/Profile.vue'),
    meta: { title: '个人中心', client: true }
  },
  {
    path: '/m/coupons',
    name: 'MobileCoupons',
    component: () => import('@/mobile/views/Coupons.vue'),
    meta: { title: '我的卡券', client: true }
  },
  {
    path: '/m/points',
    name: 'MobilePoints',
    component: () => import('@/mobile/views/Points.vue'),
    meta: { title: '积分中心', client: true }
  },
  {
    path: '/m/wallet',
    name: 'MobileWallet',
    component: () => import('@/mobile/views/Wallet.vue'),
    meta: { title: '现金奖励', client: true }
  },
  {
    path: '/m/addresses',
    name: 'MobileAddresses',
    component: () => import('@/mobile/views/Addresses.vue'),
    meta: { title: '常用地址', client: true }
  },
  {
    path: '/m/real-name',
    name: 'MobileRealName',
    component: () => import('@/mobile/views/RealName.vue'),
    meta: { title: '实名认证', client: true }
  },
  {
    path: '/m/notifications',
    name: 'MobileNotifications',
    component: () => import('@/mobile/views/Notifications.vue'),
    meta: { title: '消息中心', client: true }
  },
  {
    path: '/m/preferences',
    name: 'MobilePreferences',
    component: () => import('@/mobile/views/Preferences.vue'),
    meta: { title: '账号保护', client: true }
  },
  {
    path: '/m/account',
    name: 'MobileAccount',
    component: () => import('@/mobile/views/Account.vue'),
    meta: { title: '账号管理', client: true }
  },
  {
    path: '/m/mobile-change',
    name: 'MobileChange',
    component: () => import('@/mobile/views/ChangeMobile.vue'),
    meta: { title: '更换绑定手机号', client: true }
  },
  {
    path: '/m/login-devices',
    name: 'MobileLoginDevices',
    component: () => import('@/mobile/views/LoginDevices.vue'),
    meta: { title: '登录设备', client: true }
  },
  {
    path: '/m/login-records',
    name: 'MobileLoginRecords',
    component: () => import('@/mobile/views/LoginRecords.vue'),
    meta: { title: '登录记录', client: true }
  },
  {
    path: '/m/settings',
    name: 'MobileSettings',
    component: () => import('@/mobile/views/Settings.vue'),
    meta: { title: '设置', client: true }
  }
]

// 移动端登录守卫：只拦截 /m/*，不影响后台管理路由。
export function installMobileGuard(router) {
  router.beforeEach((to) => {
    if (!to.path.startsWith('/m')) return true

    if (to.path === '/m/login') {
      // 已登录再访问登录页时回到个人中心
      return session.token ? { path: '/m/profile' } : true
    }
    if (!session.token) {
      return { path: '/m/login', query: { redirect: to.fullPath } }
    }
    return true
  })

  // 站点标题统一为 App 名，避免浏览器标签露出后台框架名
  router.afterEach((to) => {
    if (!to.path.startsWith('/m')) return
    const title = to.meta?.title
    document.title = title ? `${title} - 萝卜快跑` : '萝卜快跑'
  })
}

export default mobileRoutes
