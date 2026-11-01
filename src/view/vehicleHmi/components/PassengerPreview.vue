<template>
  <section class="preview-shell" aria-label="萝卜快跑乘客端行程预览">
    <div class="phone-frame">
      <header class="status-bar">
        <span>{{ currentTime }}</span>
        <span class="status-icons"><Connection /> 5G <Lightning /></span>
      </header>

      <div class="map-surface">
        <i class="park park-one" />
        <i class="park park-two" />
        <i class="water" />
        <i v-for="road in roads" :key="road" :class="['road', road]" />
        <span class="map-label campus">宿迁职业技术学院</span>
        <span class="map-label station">宿迁站</span>
        <span class="map-label plaza">宝龙广场</span>
        <svg class="route-path" viewBox="0 0 210 250" aria-hidden="true">
          <path d="M26 18 C 78 48, 36 112, 92 140 S 170 186, 184 232" />
        </svg>
        <div class="location-pin start-pin"><span>上车点</span></div>
        <div class="location-pin end-pin" />
        <div class="car-marker" :style="carPosition">
          <Van />
          <span>苏A·D0058</span>
        </div>
      </div>

      <div class="service-banner">
        <span class="live-dot" />
        <div><strong>全无人自动驾驶服务中</strong><small>车辆全程由自动驾驶系统控制</small></div>
        <ArrowRight />
      </div>

      <article class="trip-sheet">
        <div class="sheet-handle" />
        <div class="vehicle-row">
          <div class="vehicle-icon"><Van /></div>
          <div class="vehicle-copy">
            <strong>{{ phaseCopy.title }}</strong>
            <span>{{ phaseCopy.subtitle }}</span>
          </div>
          <div class="eta">
            <template v-if="phase !== 'completed'"><b>{{ etaMinutes }}</b><span>分钟</span></template>
            <Check v-else />
          </div>
        </div>

        <div class="progress"><span :style="{ width: progress + '%' }" /></div>
        <div class="steps">
          <span class="done">已接单</span>
          <span :class="{ done: phase !== 'waiting', active: phase === 'waiting' }">车辆前往</span>
          <span :class="{ done: ['riding', 'completed'].includes(phase), active: phase === 'arrived' }">身份核验</span>
          <span :class="{ done: phase === 'completed', active: phase === 'riding' }">行程中</span>
        </div>

        <button v-if="phase === 'arrived'" class="verify-card" type="button" @click="emit('action', 'boarding')">
          <span class="verify-icon"><Lock /></span>
          <span><b>车辆已到达，请输入上车码</b><small>手机尾号 8575 · 核验后自动解锁</small></span>
          <ArrowRight />
        </button>
        <div v-else-if="phase === 'riding'" class="ride-stats">
          <span><small>剩余里程</small><b>{{ remainingDistance }} km</b></span>
          <span><small>当前车速</small><b>{{ speedKmh }} km/h</b></span>
          <span><small>剩余电量</small><b>{{ batteryPercent }}%</b></span>
        </div>
        <div v-else-if="phase === 'completed'" class="completed-card">
          <Check /><span><b>本次行程已结束</b><small>请确认随身物品后从右侧车门下车</small></span>
        </div>
        <div v-else class="verify-tip">
          <Lock />
          <span>车辆到达后，请在车机输入手机尾号 <b>8575</b></span>
        </div>

        <div class="route-summary">
          <span><i class="point start" /><span><small>上车点</small>宿迁职业技术学院</span></span>
          <i class="route-divider" />
          <span><i class="point end" /><span><small>目的地</small>宿迁站（东广场）</span></span>
        </div>

        <div class="sheet-actions">
          <button type="button" @click="emit('action', 'support')"><Service />联系客服</button>
          <button type="button" @click="emit('action', 'safety')"><Warning />安全协助</button>
          <button type="button" @click="emit('action', 'vehicle')"><Odometer />车辆状态</button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import {
  ArrowRight,
  Check,
  Connection,
  Lightning,
  Lock,
  Odometer,
  Service,
  Van,
  Warning
} from '@element-plus/icons-vue'

const props = defineProps({
  phase: { type: String, default: 'waiting' },
  telemetry: { type: Object, default: () => ({}) }
})
const emit = defineEmits(['action'])

const roads = ['road-one', 'road-two', 'road-three', 'road-four', 'road-five', 'road-six']
const phaseCopies = {
  waiting: { title: '车辆正在前往上车点', subtitle: '萝卜快跑 · 白色极狐 · 苏A·D0058' },
  arrived: { title: '车辆已到达，请上车', subtitle: '请核对车牌，从后排上车' },
  riding: { title: '行程进行中', subtitle: '全无人驾驶 · 请全程系好安全带' },
  completed: { title: '已安全到达目的地', subtitle: '感谢乘坐萝卜快跑' }
}

const currentTime = ref(formatTime())
const timer = window.setInterval(() => { currentTime.value = formatTime() }, 30000)
onBeforeUnmount(() => window.clearInterval(timer))

function formatTime() {
  return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const phaseCopy = computed(() => phaseCopies[props.phase] || phaseCopies.waiting)
const progress = computed(() => ({ waiting: 42, arrived: 68, riding: props.telemetry.routeProgressPercent ?? 76, completed: 100 }[props.phase] ?? 42))
const etaMinutes = computed(() => ({ waiting: 8, arrived: 0, riding: 6 }[props.phase] ?? 8))
const remainingDistance = computed(() => Number(props.telemetry.remainingDistanceKm ?? 2.8).toFixed(1))
const batteryPercent = computed(() => Math.round(props.telemetry.batteryPercent ?? 86))
const speedKmh = computed(() => Math.round(props.telemetry.speedKmh ?? 28))
const carPosition = computed(() => ({
  waiting: { left: '116px', top: '220px' },
  arrived: { left: '82px', top: '174px' },
  riding: { left: '235px', top: '300px' },
  completed: { left: '286px', top: '384px' }
}[props.phase] || { left: '116px', top: '220px' }))
</script>

<style scoped src="../styles/passenger-preview.css" />
