import test from 'node:test'
import assert from 'node:assert/strict'

import { hmiPhaseOptions, mergePreviewTelemetry, resolveTripPhase } from './helpers.js'

test('HMI 提供四个可手动切换的行程阶段', () => {
  assert.deepEqual(hmiPhaseOptions.map((item) => item.value), ['waiting', 'arrived', 'riding', 'completed'])
})

test('订单状态映射为乘客端行程阶段', () => {
  assert.equal(resolveTripPhase(1), 'waiting')
  assert.equal(resolveTripPhase(2), 'arrived')
  assert.equal(resolveTripPhase(3), 'riding')
  assert.equal(resolveTripPhase(4), 'completed')
})

test('未知订单状态保持等待接驾', () => {
  assert.equal(resolveTripPhase(undefined), 'waiting')
  assert.equal(resolveTripPhase(99), 'waiting')
})

test('遥测合并时保留已有值并忽略无效数字', () => {
  const current = { speedKmh: 18, batteryPercent: 80, remainingDistanceKm: 4.2 }
  const next = mergePreviewTelemetry(current, {
    speedKmh: 32,
    batteryPercent: Number.NaN,
    routeProgressPercent: 48
  })

  assert.deepEqual(next, {
    speedKmh: 32,
    batteryPercent: 80,
    remainingDistanceKm: 4.2,
    routeProgressPercent: 48
  })
})
