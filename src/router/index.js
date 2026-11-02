import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/login'
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
  ...(import.meta.env.DEV ? [
    {
      path: '/vehicle-hmi-preview',
      name: 'VehicleHmiPreview',
      meta: {
        title: '车辆 HMI',
        client: true
      },
      component: () => import('@/view/vehicleHmi/index.vue')
    },
    {
      path: '/vehicle-hmi-preview/fault-report',
      name: 'VehicleHmiFaultReport',
      meta: {
        title: '车辆故障上报',
        client: true
      },
      component: () => import('@/view/vehicleHmi/FaultReport.vue')
    },
    {
      path: '/vehicle-hmi-preview/trip',
      name: 'VehicleHmiTrip',
      meta: { title: '行程与指令', client: true },
      component: () => import('@/view/vehicleHmi/ModulePage.vue'),
      props: { module: 'trip' }
    },
    {
      path: '/vehicle-hmi-preview/boarding',
      name: 'VehicleHmiBoarding',
      meta: { title: '上车核验', client: true },
      component: () => import('@/view/vehicleHmi/ModulePage.vue'),
      props: { module: 'boarding' }
    },
    {
      path: '/vehicle-hmi-preview/vehicle',
      name: 'VehicleHmiVehicle',
      meta: { title: '车辆状态', client: true },
      component: () => import('@/view/vehicleHmi/ModulePage.vue'),
      props: { module: 'vehicle' }
    },
    {
      path: '/vehicle-hmi-preview/safety',
      name: 'VehicleHmiSafety',
      meta: { title: '安全与媒体', client: true },
      component: () => import('@/view/vehicleHmi/ModulePage.vue'),
      props: { module: 'safety' }
    }
  ] : []),
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

export default router
