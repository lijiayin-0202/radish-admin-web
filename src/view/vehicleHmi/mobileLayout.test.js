import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const modulePage = await readFile(new URL('./ModulePage.vue', import.meta.url), 'utf8')
const overviewPanel = await readFile(new URL('./components/OverviewPanel.vue', import.meta.url), 'utf8')
const previewPanel = await readFile(new URL('./components/PassengerPreview.vue', import.meta.url), 'utf8')
const vehiclePanel = await readFile(new URL('./components/VehicleDataPanel.vue', import.meta.url), 'utf8')

test('模块手机壳具有受限高度和独立纵向滚动', () => {
  assert.match(modulePage, /height:\s*min\(844px, calc\(100dvh - 36px\)\)/)
  assert.match(modulePage, /min-height:\s*0/)
  assert.match(modulePage, /overflow-y:\s*auto/)
})

test('行程与指令使用手机卡片而非桌面表格', () => {
  assert.doesNotMatch(overviewPanel, /<el-table/)
  assert.match(overviewPanel, /command-card/)
})

test('安全与媒体的单个活动面板铺满手机内容区', () => {
  assert.match(modulePage, /:deep\(\.panel-grid\) \{ grid-template-columns: 1fr/)
})

test('主 HMI 保留未接入的联系客服占位入口', () => {
  assert.match(previewPanel, /pending-action/)
  assert.match(previewPanel, /联系客服/)
})

test('车辆状态在手机端使用数字输入而非压缩滑块', () => {
  assert.doesNotMatch(vehiclePanel, /<el-slider/)
})
