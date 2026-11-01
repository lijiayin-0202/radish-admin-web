import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const redirectEntries = [
  '../trip/command/command.vue',
  '../trip/fault/fault.vue',
  '../trip/boarding/boarding.vue',
  '../trip/incident/incident.vue'
]

for (const entry of redirectEntries) {
  const source = await readFile(new URL(entry, import.meta.url), 'utf8')
  assert.match(source, /VehicleHmiPreview/, `${entry} 应跳转到车辆 HMI 页面`)
}

console.log('模块四动态菜单跳转入口校验通过')
