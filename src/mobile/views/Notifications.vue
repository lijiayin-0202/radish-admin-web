<template>
  <div class="m-page notices">
    <MHeader title="消息中心" theme="solid">
      <template #right>
        <button v-if="unreadCount > 0" class="m-inline-btn" type="button" @click="markAll">
          全部已读
        </button>
      </template>
    </MHeader>

    <div class="notices__tabs">
      <button
        v-for="item in filters"
        :key="item.key"
        class="m-tab"
        :class="{ 'm-tab--active': activeFilter === item.key }"
        type="button"
        @click="switchFilter(item.key)"
      >
        {{ item.label }}
        <span v-if="item.key === 'unread' && unreadCount" class="notices__count">{{ unreadCount }}</span>
      </button>
    </div>

    <div class="m-body">
      <div v-if="loading" class="m-loading">加载中…</div>
      <MEmpty v-else-if="!notices.length" :text="activeFilter === 'unread' ? '暂无未读消息' : '暂无消息'" />

      <div v-else class="m-list">
        <button
          v-for="item in notices"
          :key="item.id"
          class="m-list-item notices__item"
          type="button"
          @click="readOne(item)"
        >
          <span class="notices__dot" :class="{ 'is-read': item.is_read }" />
          <div class="m-list-item__main">
            <div class="m-list-item__title">
              <span class="m-ellipsis">{{ item.title }}</span>
              <span class="m-tag m-tag--grey">{{ typeLabel(item.notification_type) }}</span>
            </div>
            <div class="m-list-item__desc m-ellipsis-2">{{ item.content }}</div>
            <div class="m-list-item__meta">{{ friendlyTime(item.created_at) }}</div>
          </div>
        </button>
        <button v-if="hasMore" class="m-btn m-btn--text notices__more" type="button" @click="loadMore">
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
import { listNotifications, markNotificationsRead } from '@/mobile/api/passenger'
import { friendlyTime, showToast } from '@/mobile/utils/ui'

// 消息类型：1 订单 / 2 支付 / 3 活动 / 4 安全 / 5 系统
const TYPE_LABEL = { 1: '订单', 2: '支付', 3: '活动', 4: '安全', 5: '系统' }
const PAGE_SIZE = 20

const filters = [
  { key: 'all', label: '全部' },
  { key: 'unread', label: '未读' }
]

const activeFilter = ref('all')
const loading = ref(true)
const notices = ref([])
const total = ref(0)
const page = ref(1)
const unreadCount = ref(0)

const hasMore = computed(() => notices.value.length < total.value)

function typeLabel(type) {
  return TYPE_LABEL[Number(type)] || '通知'
}

async function loadNotices(targetPage = 1, append = false) {
  if (!append) loading.value = true
  try {
    const data = await listNotifications({
      page: targetPage,
      pageSize: PAGE_SIZE,
      // 筛选「未读」时传 is_read=false；后端为 optional bool
      isRead: activeFilter.value === 'unread' ? false : undefined
    })
    total.value = Number(data.total || 0)
    page.value = Number(data.page || targetPage)
    unreadCount.value = Number(data.unread_count || 0)
    const items = data.items || []
    notices.value = append ? [...notices.value, ...items] : items
  } catch (e) {
    if (!append) notices.value = []
  } finally {
    loading.value = false
  }
}

function switchFilter(key) {
  if (activeFilter.value === key) return
  activeFilter.value = key
  loadNotices(1)
}

function loadMore() {
  loadNotices(page.value + 1, true)
}

async function readOne(item) {
  if (item.is_read) return
  try {
    const data = await markNotificationsRead({ ids: [item.id] })
    item.is_read = true
    unreadCount.value = Number(data.unread_count || 0)
    if (activeFilter.value === 'unread') {
      notices.value = notices.value.filter((n) => n.id !== item.id)
    }
  } catch (e) {
    // 提示已由拦截器下发
  }
}

async function markAll() {
  try {
    const data = await markNotificationsRead({ ids: [], markAll: true })
    unreadCount.value = Number(data.unread_count || 0)
    showToast(`已标记 ${data.updated_count || 0} 条为已读`)
    loadNotices(1)
  } catch (e) {
    // 提示已由拦截器下发
  }
}

onMounted(() => loadNotices(1))
</script>

<style scoped>
.notices {
  background: #f5f7fa;
}

.notices__tabs {
  display: flex;
  gap: 26px;
  padding: 2px 16px 0;
  background: #fff;
  border-bottom: 1px solid #f0f3f5;
}

.notices__count {
  margin-left: 4px;
  font-size: 11px;
  color: #f4755b;
}

.notices__item {
  width: 100%;
  text-align: left;
  background: transparent;
  border: 0;
}

.notices__dot {
  width: 7px;
  height: 7px;
  flex: 0 0 auto;
  margin-top: 8px;
  background: #f4755b;
  border-radius: 50%;
}

.notices__dot.is-read {
  background: transparent;
}

.notices__more {
  padding: 14px 0;
}
</style>
