<template>
  <div class="m-page settings">
    <MHeader title="设置" theme="solid" />

    <div class="m-body">
      <div class="m-cell-group">
        <button class="m-cell" type="button" @click="go('/m/account')">
          <span class="m-cell__label">账号管理</span>
          <MIcon name="chevron-right" :size="16" class="m-cell__arrow" />
        </button>
        <button class="m-cell" type="button" @click="go('/m/real-name')">
          <span class="m-cell__label">实名认证</span>
          <span class="m-cell__value">{{ realNameText }}</span>
          <MIcon name="chevron-right" :size="16" class="m-cell__arrow" />
        </button>
      </div>

      <div class="m-cell-group">
        <div class="m-cell">
          <span class="m-cell__label">版本信息</span>
          <span class="m-cell__value">{{ APP_VERSION }}</span>
        </div>
        <button class="m-cell" type="button" @click="go('/m/notifications')">
          <span class="m-cell__label">消息管理</span>
          <span v-if="unreadCount" class="m-cell__value">{{ unreadCount }} 条未读</span>
          <MIcon name="chevron-right" :size="16" class="m-cell__arrow" />
        </button>
        <button class="m-cell" type="button" @click="go('/m/preferences')">
          <span class="m-cell__label">隐私设置</span>
          <MIcon name="chevron-right" :size="16" class="m-cell__arrow" />
        </button>
        <button class="m-cell" type="button" @click="tip('萝卜快跑 · 让每一次出行更简单')">
          <span class="m-cell__label">关于我们</span>
          <MIcon name="chevron-right" :size="16" class="m-cell__arrow" />
        </button>
      </div>

      <div class="m-cell-group">
        <button class="m-cell" type="button" @click="clearCache">
          <span class="m-cell__label">清理缓存</span>
          <span class="m-cell__value">{{ cacheSize }} MB</span>
          <MIcon name="chevron-right" :size="16" class="m-cell__arrow" />
        </button>
      </div>

      <div class="m-cell-group">
        <button class="m-cell" type="button" @click="tip('感谢支持，好评功能暂未开放')">
          <span class="m-cell__label">给萝卜一个好评，鼓励一下吧～</span>
          <MIcon name="chevron-right" :size="16" class="m-cell__arrow" />
        </button>
      </div>

      <button class="m-btn m-btn--ghost settings__logout" type="button" @click="logout">退出登录</button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import MHeader from '@/mobile/components/MHeader.vue'
import MIcon from '@/mobile/components/MIcon.vue'
import { getProfile } from '@/mobile/api/passenger'
import { clearSession, session, setProfile } from '@/mobile/store/session'
import { mConfirm, showToast } from '@/mobile/utils/ui'

// 移动端版本号：与线上 App 版本保持一致，便于问题定位
const APP_VERSION = '4.64.0'

const router = useRouter()
const profile = ref(session.profile || null)
const cacheSize = ref('0.00')

const REAL_NAME_TEXT = { 0: '未认证', 1: '认证中', 2: '已认证', 3: '认证驳回' }

const realNameText = computed(() => {
  const status = Number(profile.value?.passenger?.real_name_status || 0)
  return REAL_NAME_TEXT[status] || '未认证'
})

const unreadCount = computed(() => Number(profile.value?.unread_notification_count || 0))

function tip(message) {
  showToast(message)
}

function go(path) {
  router.push(path)
}

// 统计本地移动端缓存的体积（不含令牌本身）
function computeCacheSize() {
  let bytes = 0
  Object.keys(localStorage).forEach((key) => {
    if (!key.startsWith('ride_')) return
    bytes += (localStorage.getItem(key) || '').length
  })
  cacheSize.value = (bytes / 1024 / 1024).toFixed(2)
}

function clearCache() {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('ride_') && key !== 'ride_passenger_token' && key !== 'ride_device_id') {
      localStorage.removeItem(key)
    }
  })
  // 清空后重新拉取一次最新数据
  session.profile = null
  loadProfile()
  computeCacheSize()
  showToast('缓存已清理')
}

async function logout() {
  const ok = await mConfirm({ title: '退出登录', message: '退出后需要重新验证手机号才能登录', okText: '退出' })
  if (!ok) return
  clearSession()
  router.replace('/m/login')
}

async function loadProfile() {
  try {
    const data = await getProfile()
    profile.value = data
    setProfile(data)
  } catch (e) {
    // 未登录或无网络时保留缓存值
  }
}

onMounted(() => {
  computeCacheSize()
  loadProfile()
})
</script>

<style scoped>
.settings {
  background: #f5f7fa;
}

.settings__logout {
  margin-top: 24px;
}
</style>
