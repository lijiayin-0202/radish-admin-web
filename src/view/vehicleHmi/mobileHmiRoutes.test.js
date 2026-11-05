import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const routerSource = await readFile(new URL('../../router/index.js', import.meta.url), 'utf8')

test('车辆 HMI 提供独立故障上报路由', () => {
  assert.match(routerSource, /path:\s*'\/vehicle-hmi-preview\/fault-report'/)
  assert.match(routerSource, /name:\s*'VehicleHmiFaultReport'/)
  assert.match(routerSource, /vehicleHmi\/FaultReport\.vue/)
})

test('原控制台四个业务模块都有对应手机路由', () => {
  const expectedRoutes = [
    ['trip', 'VehicleHmiTrip'],
    ['boarding', 'VehicleHmiBoarding'],
    ['vehicle', 'VehicleHmiVehicle'],
    ['safety', 'VehicleHmiSafety']
  ]

  for (const [path, name] of expectedRoutes) {
    assert.match(routerSource, new RegExp(`path:\\s*'\\/vehicle-hmi-preview\\/${path}'`))
    assert.match(routerSource, new RegExp(`name:\\s*'${name}'`))
  }
})
