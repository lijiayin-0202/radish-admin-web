<template>
  <div class="m-page coupons">
    <MHeader title="我的卡券" theme="solid" />

    <div class="coupons__tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="m-tab"
        :class="{ 'm-tab--active': activeTab === tab.key }"
        type="button"
        @click="switchTab(tab)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="coupons__chips">
      <button
        v-for="item in filters"
        :key="item.key"
        class="m-chip"
        :class="{ 'm-chip--active': activeFilter === item.key }"
        type="button"
        @click="activeFilter = item.key"
      >
        {{ item.label }}
      </button>
    </div>

    <div class="m-body">
      <div v-if="loading" class="m-loading">加载中…</div>

      <template v-else>
        <div v-if="visibleCoupons.length" class="coupons__list">
          <div
            v-for="coupon in visibleCoupons"
            :key="coupon.id"
            class="coupons__card"
            :class="{ 'is-expired': isExpired(coupon) }"
          >
            <div class="coupons__face">
              <span class="coupons__face-main">{{ faceOf(coupon).main }}</span>
              <span class="coupons__face-unit">{{ faceOf(coupon).unit }}</span>
              <span class="coupons__face-cond">{{ conditionOf(coupon) }}</span>
            </div>
            <div class="coupons__info">
              <div class="coupons__name">{{ coupon.coupon_name || '乘车优惠券' }}</div>
              <div class="coupons__valid">有效期 {{ shortDate(coupon.valid_from) }} - {{ shortDate(coupon.valid_to) }}</div>
              <div class="coupons__footer">
                <span class="m-tag" :class="isExpired(coupon) ? 'm-tag--grey' : ''">{{ statusText(coupon) }}</span>
                <button v-if="!isExpired(coupon)" class="m-btn m-btn--sm" type="button" @click="useCoupon(coupon)">
                  去使用
                </button>
              </div>
            </div>
          </div>
        </div>

        <MEmpty
          v-else
          :text="emptyText"
          :hint="activeTab === 'coupon' ? '' : '当前分类暂未开放在线领取'"
        />
      </template>
    </div>

    <div class="coupons__bottom">
      <button type="button" @click="tip('省钱套餐暂未开放')">省钱套餐</button>
      <i />
      <button type="button" @click="tip('卡券兑换暂未开放')">卡券兑换</button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import MHeader from '@/mobile/components/MHeader.vue'
import MEmpty from '@/mobile/components/MEmpty.vue'
import { listCoupons } from '@/mobile/api/passenger'
import { formatMoney, showToast } from '@/mobile/utils/ui'

// 券类型：1 立减 / 2 满减 / 3 折扣；用户券状态：0 未使用 / 1 已锁定 / 2 已使用 / 3 已过期
const STATUS_TEXT = { 0: '未使用', 1: '使用中', 2: '已使用', 3: '已过期' }

const tabs = [
  { key: 'coupon', label: '优惠券', enabled: true },
  { key: 'travel', label: '畅游卡', enabled: false },
  { key: 'benefit', label: '权益', enabled: false },
  { key: 'partner', label: '合作商家', enabled: false }
]

const filters = [
  { key: 'usable', label: '可使用' },
  { key: 'invalid', label: '已失效' }
]

const activeTab = ref('coupon')
const activeFilter = ref('usable')
const loading = ref(true)
const coupons = ref([])

// 可用于乘车的券：未使用或锁定中
function isExpired(coupon) {
  const status = Number(coupon.status)
  return status === 2 || status === 3
}

const visibleCoupons = computed(() => {
  if (activeTab.value !== 'coupon') return []
  return coupons.value.filter((item) => (activeFilter.value === 'usable' ? !isExpired(item) : isExpired(item)))
})

const emptyText = computed(() => {
  if (activeTab.value !== 'coupon') return '暂无可用卡券'
  return activeFilter.value === 'usable' ? '暂无可用卡券' : '暂无失效卡券'
})

function tip(message) {
  showToast(message)
}

// 券面额：折扣券展示折数，其余展示金额
function faceOf(coupon) {
  if (Number(coupon.coupon_type) === 3) {
    const raw = Number(coupon.discount_rate || 0)
    const rate = raw > 1 ? raw / 100 : raw
    return { main: rate > 0 ? (rate * 10).toFixed(1).replace(/\.0$/, '') : '折扣', unit: '折' }
  }
  return { main: formatMoney(coupon.discount_amount), unit: '元' }
}

function conditionOf(coupon) {
  const min = Number(coupon.minimum_order_amount || 0)
  return min > 0 ? `满 ${formatMoney(min)} 元可用` : '无门槛'
}

function statusText(coupon) {
  return STATUS_TEXT[Number(coupon.status)] || '未使用'
}

// 后端返回 ISO 8601（含 +08:00），只展示到日
function shortDate(value) {
  if (!value) return '长期有效'
  return String(value).slice(0, 10).replace(/-/g, '.')
}

function useCoupon(coupon) {
  showToast(`「${coupon.coupon_name || '优惠券'}」将在打车下单时自动抵扣`)
}

function switchTab(tab) {
  activeTab.value = tab.key
  if (!tab.enabled) showToast(`${tab.label}暂未开放`)
}

async function loadCoupons() {
  loading.value = true
  try {
    // 一次取够一页，可用/失效在前端按状态拆分，避免两次请求
    const data = await listCoupons({ page: 1, pageSize: 50 })
    coupons.value = data.items || []
  } catch (e) {
    coupons.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadCoupons)
</script>

<style scoped>
.coupons {
  background: #f5f7fa;
}

.coupons__tabs {
  display: flex;
  gap: 22px;
  padding: 2px 16px 0;
  background: #fff;
}

.coupons__chips {
  display: flex;
  gap: 10px;
  padding: 12px 16px 4px;
}

.coupons__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.coupons__card {
  display: flex;
  overflow: hidden;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 4px 14px rgba(31, 41, 51, 0.05);
}

.coupons__card.is-expired {
  filter: grayscale(1);
  opacity: 0.62;
}

.coupons__face {
  display: flex;
  width: 104px;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 4px;
  color: #16c79a;
  background: linear-gradient(160deg, #e6fbf4, #d3f7ec);
  border-right: 1px dashed rgba(22, 199, 154, 0.32);
}

.coupons__face-main {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.1;
}

.coupons__face-unit {
  margin-top: 2px;
  font-size: 12px;
}

.coupons__face-cond {
  margin-top: 6px;
  font-size: 11px;
  color: #6fbfa7;
}

.coupons__info {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  padding: 14px;
}

.coupons__name {
  font-size: 15px;
  font-weight: 500;
}

.coupons__valid {
  margin-top: 6px;
  font-size: 12px;
  color: #93a1ab;
}

.coupons__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 10px;
}

.coupons__bottom {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28px;
  margin: auto 16px 20px;
  padding: 14px 0;
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 6px 16px rgba(31, 41, 51, 0.06);
}

.coupons__bottom button {
  font-size: 14px;
  color: #37424c;
  background: transparent;
  border: 0;
}

.coupons__bottom i {
  width: 1px;
  height: 14px;
  background: #e6ebef;
}
</style>
