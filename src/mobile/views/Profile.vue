<template>
  <div class="m-page m-page--gradient profile">
    <div class="profile__hero">
      <div class="profile__user" @click="go('/m/account')">
        <img v-if="passenger.avatar_url" class="profile__avatar" :src="passenger.avatar_url" alt="头像" />
        <span v-else class="profile__avatar profile__avatar--text">{{ avatarText }}</span>
        <div class="profile__ident">
          <div class="profile__mobile">{{ passenger.mobile || '未登录' }}</div>
          <div class="profile__meta">
            <span class="m-tag" :class="realNameTag.cls">{{ realNameTag.text }}</span>
            <span v-if="passenger.nickname" class="profile__nickname">{{ passenger.nickname }}</span>
          </div>
        </div>
        <MIcon name="chevron-right" :size="18" class="profile__arrow" />
      </div>

      <div v-if="loading" class="profile__skeleton">正在加载账户信息…</div>

      <div v-else class="profile__wallet">
        <button class="profile__wallet-item" type="button" @click="go('/m/coupons')">
          <span class="profile__wallet-value">{{ data.available_coupon_count || 0 }}</span>
          <span class="profile__wallet-label">我的卡券</span>
        </button>
        <i class="profile__wallet-split" />
        <button class="profile__wallet-item" type="button" @click="go('/m/wallet')">
          <span class="profile__wallet-value">{{ formatMoney(data.wallet_balance) }}</span>
          <span class="profile__wallet-label">现金奖励</span>
        </button>
        <i class="profile__wallet-split" />
        <button class="profile__wallet-item" type="button" @click="go('/m/points')">
          <span class="profile__wallet-flag" v-if="!data.signed_in_today">可签到</span>
          <span class="profile__wallet-value">{{ passenger.point_balance || 0 }}</span>
          <span class="profile__wallet-label">积分中心</span>
        </button>
      </div>
    </div>

    <div class="profile__menu">
      <button
        v-for="item in menus"
        :key="item.key"
        class="profile__menu-item"
        type="button"
        @click="onMenu(item)"
      >
        <MIcon :name="item.icon" :size="20" />
        <span class="profile__menu-label">{{ item.label }}</span>
        <span v-if="item.key === 'notifications' && data.unread_notification_count" class="m-badge">
          {{ data.unread_notification_count > 99 ? '99+' : data.unread_notification_count }}
        </span>
        <span v-else-if="item.value" class="profile__menu-value">{{ item.value }}</span>
      </button>
    </div>

    <div class="profile__brand">
      <span class="profile__brand-dot" />
      萝卜快跑
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import MIcon from '@/mobile/components/MIcon.vue'
import { getProfile } from '@/mobile/api/passenger'
import { session, setProfile } from '@/mobile/store/session'
import { formatMoney, showToast } from '@/mobile/utils/ui'

const REAL_NAME_TEXT = { 0: '未实名', 1: '认证中', 2: '已认证', 3: '认证驳回' }

const router = useRouter()
const loading = ref(true)

// 聚合数据：GET /passenger/profile 的 data（字段为后端 proto snake_case）
const data = reactive({
  passenger: null,
  wallet_balance: 0,
  available_coupon_count: 0,
  unread_notification_count: 0,
  signed_in_today: false,
  continuous_sign_in_days: 0
})

const passenger = computed(() => data.passenger || {})

const avatarText = computed(() => {
  const source = passenger.value.nickname || passenger.value.mobile || '萝'
  return String(source).slice(-2)
})

const realNameTag = computed(() => {
  const status = Number(passenger.value.real_name_status || 0)
  const cls = status === 2 ? '' : status === 1 ? 'm-tag--warn' : 'm-tag--grey'
  return { text: REAL_NAME_TEXT[status] || '未实名', cls }
})

const menus = computed(() => [
  { key: 'real-name', label: '实名认证', icon: 'shield', path: '/m/real-name', value: realNameTag.value.text },
  { key: 'orders', label: '行程订单', icon: 'order', tip: '行程模块暂未开放' },
  { key: 'addresses', label: '常用站点', icon: 'location', path: '/m/addresses' },
  { key: 'service', label: '客服中心', icon: 'service', tip: '客服模块暂未开放' },
  { key: 'notifications', label: '消息中心', icon: 'bell', path: '/m/notifications' },
  { key: 'settings', label: '设置', icon: 'setting', path: '/m/settings' }
])

function go(path) {
  router.push(path)
}

function onMenu(item) {
  if (item.path) {
    go(item.path)
    return
  }
  showToast(item.tip || '暂未开放')
}

async function loadProfile(silent = false) {
  if (!silent) loading.value = true
  try {
    const result = await getProfile()
    Object.assign(data, result || {})
    setProfile(result)
  } catch (e) {
    // 401 已由拦截器跳转登录；其余错误提示已在拦截器下发，这里回填本地缓存避免白屏
    if (session.profile) Object.assign(data, session.profile)
  } finally {
    loading.value = false
  }
}

onMounted(() => loadProfile())
</script>

<style scoped>
.profile {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.profile__hero {
  padding: 28px 16px 0;
}

.profile__user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.profile__avatar {
  width: 54px;
  height: 54px;
  flex: 0 0 auto;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  background: #fff;
}

.profile__avatar--text {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: #0ea882;
  background: linear-gradient(140deg, #ffffff, #d9f6ec);
}

.profile__ident {
  flex: 1;
  min-width: 0;
}

.profile__mobile {
  font-size: 21px;
  font-weight: 600;
  letter-spacing: 1px;
  color: #17242d;
}

.profile__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.profile__nickname {
  overflow: hidden;
  font-size: 12px;
  color: #7d8b95;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile__arrow {
  color: #9fb0ba;
}

.profile__skeleton {
  margin-top: 18px;
  padding: 22px;
  font-size: 13px;
  color: #7d8b95;
  text-align: center;
  background: rgba(255, 255, 255, 0.72);
  border-radius: 18px;
}

.profile__wallet {
  position: relative;
  display: flex;
  align-items: center;
  margin-top: 18px;
  padding: 16px 4px;
  background: linear-gradient(100deg, #fff3cd 0%, #ffeeb0 55%, #ffe7a3 100%);
  border-radius: 18px;
  box-shadow: 0 10px 22px rgba(224, 178, 60, 0.18);
}

.profile__wallet-item {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: transparent;
  border: 0;
}

.profile__wallet-value {
  font-size: 20px;
  font-weight: 600;
  color: #33302a;
}

.profile__wallet-label {
  font-size: 12px;
  color: #8a7b52;
}

.profile__wallet-flag {
  position: absolute;
  top: -9px;
  right: 6px;
  padding: 1px 6px;
  font-size: 10px;
  color: #fff;
  background: #ff7a59;
  border-radius: 8px 8px 8px 2px;
}

.profile__wallet-split {
  width: 1px;
  height: 26px;
  background: rgba(180, 150, 80, 0.22);
}

.profile__menu {
  margin: 26px 16px 0;
  padding: 6px 0;
}

.profile__menu-item {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 15px 6px;
  font-size: 15px;
  color: #1f2933;
  text-align: left;
  background: transparent;
  border: 0;
}

.profile__menu-item:active {
  opacity: 0.6;
}

.profile__menu-label {
  flex: 1;
}

.profile__menu-value {
  font-size: 12px;
  color: #93a1ab;
}

.profile__brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 40px;
  padding-bottom: 26px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 2px;
  color: #16c79a;
  opacity: 0.85;
}

.profile__brand-dot {
  width: 14px;
  height: 14px;
  background: linear-gradient(135deg, #35e0b4, #0ea882);
  border-radius: 4px 10px 4px 10px;
}
</style>
