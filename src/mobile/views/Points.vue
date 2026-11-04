<template>
  <div class="m-page m-page--gradient points">
    <MHeader title="积分中心" />

    <div class="points__hero">
      <div class="points__balance-label">我的积分</div>
      <div class="points__balance">{{ balance }}</div>
      <button
        class="points__sign"
        type="button"
        :disabled="signedToday || signing"
        @click="handleSignIn"
      >
        {{ signedToday ? '今日已签到' : signing ? '签到中…' : '签到领积分' }}
      </button>
      <div class="points__hint">
        已连续签到 {{ continuousDays }} 天{{ signedToday ? '，明天记得继续' : '，签到可获得积分奖励' }}
      </div>
    </div>

    <div class="m-section-title">积分明细</div>

    <div class="m-body">
      <div class="points__panel">
        <div v-if="loading" class="m-loading">加载中…</div>
        <MEmpty v-else-if="!transactions.length" text="暂无积分明细" />
        <template v-else>
          <div v-for="item in transactions" :key="item.id" class="points__row">
            <div class="points__row-main">
              <div class="points__row-title">{{ sourceLabel(item.source_type) }}</div>
              <div class="points__row-desc">{{ item.remark || '—' }}</div>
              <div class="points__row-time">{{ friendlyTime(item.created_at) }}</div>
            </div>
            <div class="points__row-amount" :class="{ 'is-minus': Number(item.change_amount) < 0 }">
              {{ Number(item.change_amount) > 0 ? '+' : '' }}{{ item.change_amount }}
              <span class="points__row-after">余 {{ item.balance_after }}</span>
            </div>
          </div>
          <button v-if="hasMore" class="m-btn m-btn--text points__more" type="button" @click="loadMore">
            加载更多
          </button>
        </template>
      </div>
    </div>

    <!-- 签到成功弹层（对应设计稿的星级奖章弹窗） -->
    <MPopup v-model="showSignDialog" position="center" :mask-closable="true">
      <div class="sign-result">
        <svg class="sign-result__medal" viewBox="0 0 120 120" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="medalBg" x1="20" y1="10" x2="100" y2="110">
              <stop offset="0%" stop-color="#ffe9a8" />
              <stop offset="55%" stop-color="#ffce55" />
              <stop offset="100%" stop-color="#f6a92c" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="52" fill="#fff6dd" />
          <circle cx="60" cy="60" r="42" fill="url(#medalBg)" />
          <circle cx="60" cy="60" r="33" fill="#fff8e6" />
          <path
            d="M60 36l7.2 14.6 16.1 2.3-11.7 11.4 2.8 16-14.4-7.6-14.4 7.6 2.8-16-11.7-11.4 16.1-2.3L60 36z"
            fill="url(#medalBg)"
          />
          <path d="M22 96l10-16 8 6-10 16-8-6z" fill="#ffd977" />
          <path d="M98 96l-10-16-8 6 10 16 8-6z" fill="#ffd977" />
        </svg>
        <div class="sign-result__title">签到成功</div>
        <div class="sign-result__reward">
          <span class="sign-result__plus">+</span>{{ signResult.reward_points || 0 }}
          <span class="sign-result__unit">积分</span>
        </div>
        <div class="sign-result__desc">
          已连续签到 {{ signResult.continuous_days || 0 }} 天，再连续签到 7 天有惊喜！
        </div>
        <button class="sign-result__close" type="button" aria-label="关闭" @click="showSignDialog = false">
          <MIcon name="close" :size="18" :stroke-width="2" />
        </button>
      </div>
    </MPopup>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import MHeader from '@/mobile/components/MHeader.vue'
import MEmpty from '@/mobile/components/MEmpty.vue'
import MIcon from '@/mobile/components/MIcon.vue'
import MPopup from '@/mobile/components/MPopup.vue'
import { getPoints, getProfile, signIn } from '@/mobile/api/passenger'
import { session, setProfile } from '@/mobile/store/session'
import { friendlyTime, showToast } from '@/mobile/utils/ui'

// 积分来源：1 完成行程 / 2 每日签到 / 3 兑换消耗 / 4 人工调整
const SOURCE_LABEL = { 1: '完成行程', 2: '每日签到', 3: '积分兑换', 4: '人工调整' }
const PAGE_SIZE = 20

const loading = ref(true)
const signing = ref(false)
const showSignDialog = ref(false)
const balance = ref(0)
const total = ref(0)
const page = ref(1)
const transactions = ref([])
const signResult = reactive({ reward_points: 0, continuous_days: 0 })

// 首屏优先使用个人中心缓存，避免界面从 0 跳变
const cached = computed(() => session.profile?.passenger || {})
const signedToday = ref(Boolean(session.profile?.signed_in_today))
const continuousDays = ref(Number(session.profile?.continuous_sign_in_days || 0))

const hasMore = computed(() => transactions.value.length < total.value)

function sourceLabel(type) {
  return SOURCE_LABEL[Number(type)] || '积分变动'
}

async function loadPoints(targetPage = 1, append = false) {
  if (!append) loading.value = true
  try {
    const data = await getPoints({ page: targetPage, pageSize: PAGE_SIZE })
    balance.value = Number(data.point_balance || 0)
    total.value = Number(data.total || 0)
    page.value = Number(data.page || targetPage)
    const items = data.items || []
    transactions.value = append ? [...transactions.value, ...items] : items
  } catch (e) {
    if (!append) transactions.value = []
  } finally {
    loading.value = false
  }
}

function loadMore() {
  loadPoints(page.value + 1, true)
}

async function handleSignIn() {
  if (signedToday.value || signing.value) return
  signing.value = true
  try {
    const data = await signIn()
    signResult.reward_points = Number(data.reward_points || 0)
    signResult.continuous_days = Number(data.continuous_days || 0)
    balance.value = Number(data.point_balance || 0)
    signedToday.value = true
    continuousDays.value = signResult.continuous_days
    showSignDialog.value = true

    // 同步个人中心缓存，返回「我的」页时积分与签到角标立即刷新
    if (session.profile) {
      const next = { ...session.profile, signed_in_today: true, continuous_sign_in_days: signResult.continuous_days }
      next.passenger = { ...(session.profile.passenger || {}), point_balance: balance.value }
      setProfile(next)
    }
    loadPoints(1)
  } catch (e) {
    // 当天已签到时后端返回业务冲突，这里以提示为准
  } finally {
    signing.value = false
  }
}

onMounted(async () => {
  balance.value = Number(cached.value.point_balance || 0)
  loadPoints(1)
  // 签到状态以服务端为准：首页缓存可能已过期（例如在其它设备签到过）
  try {
    const profile = await getProfile()
    setProfile(profile)
    signedToday.value = Boolean(profile.signed_in_today)
    continuousDays.value = Number(profile.continuous_sign_in_days || 0)
  } catch (e) {
    // 保持缓存值
  }
})
</script>

<style scoped>
.points__hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 6px 16px 0;
  padding: 26px 18px 22px;
  background: linear-gradient(150deg, #ffffff 0%, #eafaf4 100%);
  border-radius: 20px;
  box-shadow: 0 10px 24px rgba(22, 199, 154, 0.1);
}

.points__balance-label {
  font-size: 13px;
  color: #7d8b95;
}

.points__balance {
  margin-top: 6px;
  font-size: 44px;
  font-weight: 700;
  line-height: 1.1;
  color: #14543f;
}

.points__sign {
  margin-top: 16px;
  padding: 9px 30px;
  font-size: 14px;
  color: #fff;
  background: linear-gradient(135deg, #2ad3a6, #10b98d);
  border: 0;
  border-radius: 20px;
  box-shadow: 0 8px 16px rgba(22, 199, 154, 0.26);
}

.points__sign[disabled] {
  color: #9aa6b2;
  background: #eef2f4;
  box-shadow: none;
}

.points__hint {
  margin-top: 12px;
  font-size: 12px;
  color: #8a949e;
}

.points__panel {
  overflow: hidden;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 4px 16px rgba(31, 41, 51, 0.04);
}

.points__row {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
}

.points__row + .points__row {
  border-top: 1px solid #f0f3f5;
}

.points__row-main {
  flex: 1;
  min-width: 0;
}

.points__row-title {
  font-size: 15px;
  font-weight: 500;
}

.points__row-desc {
  margin-top: 3px;
  overflow: hidden;
  font-size: 12px;
  color: #93a1ab;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.points__row-time {
  margin-top: 4px;
  font-size: 11px;
  color: #b6c0ca;
}

.points__row-amount {
  flex: 0 0 auto;
  font-size: 16px;
  font-weight: 600;
  color: #16c79a;
  text-align: right;
}

.points__row-amount.is-minus {
  color: #f4755b;
}

.points__row-after {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  font-weight: 400;
  color: #b6c0ca;
}

.points__more {
  padding: 14px 0;
}

.sign-result {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 26px 22px 22px;
  text-align: center;
}

.sign-result__medal {
  width: 104px;
  height: 104px;
}

.sign-result__title {
  margin-top: 10px;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #2c2a24;
}

.sign-result__reward {
  margin-top: 10px;
  font-size: 26px;
  font-weight: 700;
  color: #f0713a;
}

.sign-result__plus {
  font-size: 20px;
  margin-right: 2px;
}

.sign-result__unit {
  margin-left: 4px;
  font-size: 13px;
  font-weight: 400;
  color: #b98b52;
}

.sign-result__desc {
  margin-top: 14px;
  font-size: 13px;
  line-height: 1.7;
  color: #8a949e;
}

.sign-result__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  margin-top: 18px;
  color: #93a1ab;
  background: #f4f7f9;
  border: 0;
  border-radius: 50%;
}
</style>
