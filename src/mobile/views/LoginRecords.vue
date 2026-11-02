<template>
  <div class="m-page records">
    <MHeader title="登录记录" theme="solid" />

    <div class="records__tabs">
      <button
        v-for="item in filters"
        :key="item.key"
        class="m-tab"
        :class="{ 'm-tab--active': activeFilter === item.key }"
        type="button"
        @click="switchFilter(item.key)"
      >
        {{ item.label }}
      </button>
    </div>

    <div class="m-body">
      <div v-if="loading" class="m-loading">加载中…</div>
      <MEmpty v-else-if="!records.length" text="暂无登录记录" />

      <div v-else class="m-list">
        <div v-for="item in records" :key="item.id" class="records__item">
          <div class="records__line">
            <span class="records__device m-ellipsis">{{ item.device_name || '未知设备' }}</span>
            <span class="records__result" :class="item.login_result === 1 ? 'is-success' : 'is-failed'">
              {{ resultText(item) }}
            </span>
          </div>
          <div class="records__meta">{{ friendlyTime(item.login_at) }}</div>
          <div class="records__meta m-ellipsis">
            <MIcon name="location" :size="12" />
            {{ locationText(item) }}
          </div>
          <div v-if="item.login_result !== 1 && item.failure_reason" class="records__reason">
            失败原因：{{ item.failure_reason }}
          </div>
        </div>

        <button v-if="hasMore" class="m-btn m-btn--text records__more" type="button" @click="loadMore">
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
import { listLoginRecords } from '@/mobile/api/passenger'
import { friendlyTime } from '@/mobile/utils/ui'

const PAGE_SIZE = 20

// 登录结果：0 失败 / 1 成功；不传表示全部（后端 optional login_result）。
const filters = [
  { key: 'all', label: '全部', value: undefined },
  { key: 'success', label: '成功', value: 1 },
  { key: 'failed', label: '失败', value: 0 }
]

const activeFilter = ref('all')
const loading = ref(true)
const records = ref([])
const total = ref(0)

const hasMore = computed(() => records.value.length < total.value)

function currentFilterValue() {
  return filters.find((item) => item.key === activeFilter.value)?.value
}

function locationText(item) {
  const location = item.login_location || '未知归属地'
  return item.login_ip ? `${location} · ${item.login_ip}` : location
}

// auth_type：1 手机号验证码登录 / 2 更换绑定手机号（沿用登录审计表记录）
function resultText(item) {
  const action = Number(item.auth_type) === 2 ? '换绑手机号' : '登录'
  return `${action}${item.login_result === 1 ? '成功' : '失败'}`
}

async function loadRecords(targetPage = 1, append = false) {
  if (!append) loading.value = true
  try {
    const data = await listLoginRecords({
      page: targetPage,
      pageSize: PAGE_SIZE,
      loginResult: currentFilterValue()
    })
    const items = data?.items || []
    records.value = append ? records.value.concat(items) : items
    total.value = Number(data?.total || 0)
  } catch (e) {
    if (!append) records.value = []
  } finally {
    loading.value = false
  }
}

function switchFilter(key) {
  if (activeFilter.value === key) return
  activeFilter.value = key
  records.value = []
  total.value = 0
  loadRecords(1)
}

function loadMore() {
  const nextPage = Math.floor(records.value.length / PAGE_SIZE) + 1
  loadRecords(nextPage, true)
}

onMounted(() => loadRecords(1))
</script>

<style scoped>
.records {
  background: #f5f7fa;
}

.records__tabs {
  display: flex;
  gap: 8px;
  padding: 0 16px 12px;
  background: #fff;
}

.records__item {
  padding: 14px 16px;
  margin-bottom: 10px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 6px 16px rgba(23, 43, 77, 0.06);
}

.records__line {
  display: flex;
  align-items: center;
  gap: 10px;
}

.records__device {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  font-weight: 600;
  color: #2f3b52;
}

.records__result {
  flex: 0 0 auto;
  padding: 2px 8px;
  font-size: 11px;
  border-radius: 9px;
}

.records__result.is-success {
  color: #1f9d55;
  background: #e8f8ef;
}

.records__result.is-failed {
  color: #d64545;
  background: #fdecec;
}

.records__meta {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  font-size: 12px;
  color: #8a94a6;
}

.records__reason {
  margin-top: 6px;
  font-size: 12px;
  color: #d64545;
}

.records__more {
  display: block;
  width: 100%;
  margin: 4px 0 12px;
}
</style>
