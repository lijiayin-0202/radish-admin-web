import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const backendEntries = [
  '../trip/command/command.vue',
  '../trip/fault/fault.vue',
  '../trip/boarding/boarding.vue',
  '../trip/incident/incident.vue'
]

for (const entry of backendEntries) {
  const source = await readFile(new URL(entry, import.meta.url), 'utf8')
  assert.doesNotMatch(source, /VehicleHmiPreview/, `${entry} 应保留后台业务页面`)
}

const routerSource = await readFile(new URL('../../router/index.js', import.meta.url), 'utf8')
assert.match(routerSource, /path: '\/vehicle-hmi-preview'/, '应保留独立的车辆 HMI 预览入口')

console.log('后台模块与车辆 HMI 独立入口校验通过')
