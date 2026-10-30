<template>
  <div class="m-page devices">
    <MHeader title="登录设备" theme="solid" />

    <div class="m-body">
      <div class="devices__tip">
        <MIcon name="shield" :size="14" />
        <span>以下为最近登录过本账号的设备；发现陌生设备请及时修改登录方式并联系客服。</span>
      </div>

      <div v-if="loading" class="m-loading">加载中…</div>
      <MEmpty v-else-if="!devices.length" text="暂无登录设备" />

      <div v-else class="m-list">
        <div v-for="item in devices" :key="item.device_id" class="devices__card">
          <div class="devices__head">
            <MIcon name="phone" :size="18" />
            <span class="devices__name m-ellipsis">{{ item.device_name || '未知设备' }}</span>
            <span v-if="item.device_id === currentDeviceId" class="devices__tag">本机</span>
          </div>

          <div class="devices__row">
            <span class="devices__label">设备型号</span>
            <span class="devices__value m-ellipsis">{{ item.device_model || '—' }}</span>
          </div>
          <div class="devices__row">
            <span class="devices__label">系统版本</span>
            <span class="devices__value m-ellipsis">{{ osText(item) }}</span>
          </div>
          <div class="devices__row">
            <span class="devices__label">登录地址</span>
            <span class="devices__value m-ellipsis">{{ locationText(item) }}</span>
          </div>
          <div class="devices__row">
            <span class="devices__label">最近登录</span>
            <span class="devices__value">{{ friendlyTime(item.last_login_at) }}</span>
          </div>
          <div class="devices__row">
            <span class="devices__label">登录次数</span>
            <span class="devices__value">{{ item.login_count || 1 }} 次</span>
          </div>
        </div>

        <button v-if="hasMore" class="m-btn m-btn--text devices__more" type="button" @click="loadMore">
          加载更多
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import MHeader from '@/mobile/components/MHeader.vue'
import MEmpty from '@/mobile/components/MEmpty.vue'
import MIcon from '@/mobile/components/MIcon.vue'
import { listLoginDevices } from '@/mobile/api/passenger'
import { getDeviceId } from '@/mobile/store/session'
import { friendlyTime } from '@/mobile/utils/ui'

const PAGE_SIZE = 20

const loading = ref(true)
const devices = ref([])
const total = ref(0)

// 本机设备编号（与登录时上报的 device_id 一致），用于打「本机」标记。
const currentDeviceId = ref(getDeviceId())

const hasMore = computed(() => devices.value.length < total.value)

// 系统版本展示：Android 13 / iOS 17.0；缺失时显示占位符。
function osText(item) {
  const name = item.os_name || ''
  const version = item.os_version || ''
  if (!name && !version) return '—'
  return `${name} ${version}`.trim()
}

// 登录地址展示：归属地 + 脱敏 IP（IP 由后端脱敏）。
function locationText(item) {
  const location = item.last_login_location || '未知归属地'
  return item.last_login_ip ? `${location} · ${item.last_login_ip}` : location
}

async function loadDevices(targetPage = 1, append = false) {
  if (!append) loading.value = true
  try {
    const data = await listLoginDevices({ page: targetPage, pageSize: PAGE_SIZE })
    const items = data?.items || []
    devices.value = append ? devices.value.concat(items) : items
    total.value = Number(data?.total || 0)
  } catch (e) {
    if (!append) devices.value = []
  } finally {
    loading.value = false
  }
}

function loadMore() {
  const nextPage = Math.floor(devices.value.length / PAGE_SIZE) + 1
  loadDevices(nextPage, true)
}

onMounted(() => loadDevices(1))
</script>

<style scoped>
.devices {
  background: #f5f7fa;
}

.devices__tip {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 12px;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.6;
  color: #7a8699;
  background: #eef4ff;
  border-radius: 10px;
}

.devices__card {
  padding: 14px 16px;
  margin-bottom: 12px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 6px 16px rgba(23, 43, 77, 0.06);
}

.devices__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 10px;
  margin-bottom: 6px;
  border-bottom: 1px solid #f0f2f5;
  color: #2f3b52;
}

.devices__name {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  font-weight: 600;
}

.devices__tag {
  flex: 0 0 auto;
  padding: 2px 8px;
  font-size: 11px;
  color: #3f7bf0;
  background: #eef4ff;
  border-radius: 9px;
}

.devices__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 5px 0;
  font-size: 13px;
}

.devices__label {
  flex: 0 0 auto;
  color: #8a94a6;
}

.devices__value {
  flex: 1;
  min-width: 0;
  text-align: right;
  color: #2f3b52;
}

.devices__more {
  display: block;
  width: 100%;
  margin: 4px 0 12px;
}
</style>
