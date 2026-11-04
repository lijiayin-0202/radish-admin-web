<template>
  <div v-loading="loading" class="dashboard">
    <!-- 筛选栏：城市 + 区域联动 + 时间(单日/范围) + 查询/重置 + 演示Mock + 实时状态 -->
    <div class="filter-bar">
      <!-- 城市下拉：挂载时从后端拉取 -->
      <el-select
        v-model="cityCode"
        placeholder="全部城市"
        clearable
        filterable
        class="filter-item"
        :loading="cityLoading"
        @visible-change="onCityVisible"
      >
        <el-option v-for="c in cityOptions" :key="c.cityCode" :label="c.cityName" :value="c.cityCode" />
        <template #empty>
          <span v-if="cityLoadError" class="load-err">城市加载失败，请刷新</span>
          <span v-else>暂无城市</span>
        </template>
      </el-select>

      <!-- 区域下拉：依赖城市，无城市时禁用 -->
      <el-select
        v-model="areaId"
        placeholder="全部区域"
        clearable
        filterable
        class="filter-item"
        :disabled="!cityCode"
        :loading="areaLoading"
      >
        <el-option v-for="a in areaOptions" :key="a.id" :label="a.areaName" :value="a.id" />
        <template #empty><span>该城市暂无区域</span></template>
      </el-select>

      <!-- 时间筛选：单日 / 范围 两种模式 -->
      <el-radio-group v-model="dateMode" class="filter-item">
        <el-radio-button label="range">范围</el-radio-button>
        <el-radio-button label="day">单日</el-radio-button>
      </el-radio-group>
      <el-date-picker
        v-if="dateMode === 'day'"
        v-model="singleDay"
        type="date"
        value-format="YYYY-MM-DD"
        placeholder="选择日期"
        class="filter-item"
      />
      <el-date-picker
        v-else
        v-model="dateRange"
        type="daterange"
        value-format="YYYY-MM-DD"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        class="filter-item"
      />

      <el-button :loading="loading" @click="fetchData">手动刷新</el-button>
      <el-switch
        v-model="realtime"
        active-text="实时刷新中"
        inactive-text="静态模式"
        class="realtime-switch"
        @change="onRealtimeChange"
      />
      <el-button type="primary" :loading="loading" @click="manualRefresh">查询</el-button>
      <el-button @click="resetData">重置</el-button>

      <el-switch
        v-model="useMock"
        active-text="演示Mock"
        inactive-text="真实接口"
        class="mock-switch"
      />
      <span class="live-tag" :class="{ active: realtime }">
        <i class="dot" />
        <template v-if="lastUpdate">最近更新 {{ lastUpdate }}</template>
        <template v-else>尚未刷新</template>
      </span>
    </div>

    <!-- 指标卡片：轮询后自动更新 -->
    <el-row :gutter="16" class="card-row">
      <el-col :span="4" v-for="c in cards" :key="c.label">
        <div class="metric-card">
          <div class="metric-label">{{ c.label }}</div>
          <div class="metric-value" :style="{ color: c.color }">{{ c.value }}<span class="metric-unit">{{ c.unit }}</span></div>
        </div>
      </el-col>
    </el-row>

    <!-- 下单量趋势：前端维护时序数组，轮询追加，保留最近 MAX_POINTS 条 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :span="24">
        <div class="chart-box">
          <div class="chart-title">下单量趋势（实时）</div>
          <div v-if="trendSeries.length === 0" class="chart-empty">暂无数据</div>
          <div v-show="trendSeries.length > 0" ref="trendRef" class="chart" />
        </div>
      </el-col>
    </el-row>

    <!-- 站点上下客流量 Top 15：空数据兜底 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :span="24">
        <div class="chart-box">
          <div class="chart-title">站点上下客流量 Top 15</div>
          <el-table :data="stationFlow" border stripe max-height="360">
            <el-table-column label="站点" prop="stationName" min-width="200" />
            <el-table-column label="上车人次" prop="boardCount" width="140" />
            <el-table-column label="下车人次" prop="alightCount" width="140" />
            <template #empty>
              <span>暂无站点客流数据</span>
            </template>
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
/*
 * 数据大屏页面
 * 改造点：
 *  1. 实时刷新开关(realtime)：默认关闭 = 静态模式（数据冻结，适合答辩讲解）；开启后用 setInterval
 *     定时轮询 fetchData 刷新 KPI/趋势图/站点流量，并展示“最近更新”时间；关闭时 clearInterval 停止轮询，
 *     数据保持当前状态不变。开启时做重复定时器保护；onUnmounted 强制清除定时器，避免内存泄漏。
 *  2. 下单趋势折线：前端维护 trendSeries 时序数组，每轮轮询追加 {time,value}，超过 MAX_POINTS 丢弃最旧点。
 *  3. 保留优化：图表懒加载(首次有数据才 init)、接口缓存(overviewCache TTL)、并发锁(fetching 锁)、loading、空数据兜底。
 *  4. 时间筛选：支持【单日 / 日期范围】两种模式，点击查询或轮询均携带当前时间条件。
 *  5. 城市/区域级联：城市下拉挂载加载；选中城市后联动加载区域；清空城市则区域清空并禁用。
 *     所有查询（指标、趋势、站点流量）均携带 city/area 参数，由后端按维度过滤。
 *  6. 演示 Mock 开关：useMock=true 时不走真实接口，前端动态自增生成指标（忽略筛选条件，仅用于现场演示刷新效果）。
 * 请求封装沿用 GVA 的 @/utils/request；图表沿用 echarts.init。
 */
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getDashboardOverview, getStationFlow, getDashboardCities, getDashboardAreas } from '@/api/platform/platform'

// ============ 筛选状态 ============
const cityCode = ref('')           // 选中的城市编码（空=全部城市）
const areaId = ref('')             // 选中的区域ID（空=该城市全部区域）
const cityOptions = ref([])
const areaOptions = ref([])
const cityLoading = ref(false)
const areaLoading = ref(false)
const cityLoadError = ref(false)

const dateMode = ref('range')      // 'range' 范围 / 'day' 单日
const singleDay = ref('')
const dateRange = ref([])

// ============ 基础状态 ============
const overview = ref({})
const stationFlow = ref([])
const trendRef = ref()
const loading = ref(false)
const realtime = ref(false)   // 实时刷新开关：默认 false = 静态模式（数据冻结）
const lastUpdate = ref('')
const useMock = ref(false)
let chart = null

// ============ 轮询配置 ============
const POLL_INTERVAL = 5000
const MAX_POINTS = 20
let timer = null       // 实时刷新定时器（setInterval）
let fetching = false   // 单次请求并发锁，防止轮询与手动刷新重叠
const trendSeries = ref([])

// ============ 指标卡片（实时） ============
const cards = computed(() => [
  { label: '下单量', value: overview.value.orderTotal ?? 0, unit: '单', color: '#409EFF' },
  { label: '完单率', value: (overview.value.completionRate ?? 0).toFixed(1), unit: '%', color: '#67C23A' },
  { label: '取消率', value: (overview.value.cancelRate ?? 0).toFixed(1), unit: '%', color: '#F56C6C' },
  { label: '客单价', value: (overview.value.avgOrderAmount ?? 0).toFixed(2), unit: '元', color: '#E6A23C' },
  { label: '在线车辆', value: overview.value.vehicleOnline ?? 0, unit: '辆', color: '#67C23A' },
  { label: '车辆总数', value: overview.value.vehicleTotal ?? 0, unit: '辆', color: '#909399' },
  { label: '客服工单', value: overview.value.ticketTotal ?? 0, unit: '单', color: '#F56C6C' },
  { label: '客服会话', value: overview.value.sessionTotal ?? 0, unit: '次', color: '#409EFF' },
  { label: '审计日志', value: overview.value.auditLogTotal ?? 0, unit: '条', color: '#909399' }
])

// ============ 工具函数 ============
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const rand = (min, max) => Math.random() * (max - min) + min
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const pad = (n) => String(n).padStart(2, '0')
const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// ============ 接口缓存（TTL）：降低后端压力 ============
let overviewCache = { data: null, ts: 0 }
const CACHE_TTL = 3000

// ============ 组装查询参数（时间 + 城市/区域） ============
function buildParams() {
  const p = {}
  if (cityCode.value) p.city = cityCode.value
  if (areaId.value) p.area = areaId.value
  if (dateMode.value === 'day' && singleDay.value) {
    p.startTime = singleDay.value + ' 00:00:00'
    p.endTime = singleDay.value + ' 23:59:59'
  } else if (dateMode.value === 'range' && dateRange.value && dateRange.value.length === 2) {
    p.startTime = dateRange.value[0] + ' 00:00:00'
    p.endTime = dateRange.value[1] + ' 23:59:59'
  }
  return p
}

// ============ 城市 / 区域下拉 ============
function onCityVisible(visible) {
  // 首次展开且未加载过才拉取，避免重复请求
  if (visible && cityOptions.value.length === 0 && !cityLoadError.value && !cityLoading.value) {
    loadCities()
  }
}
async function loadCities() {
  cityLoading.value = true
  cityLoadError.value = false
  try {
    const res = await getDashboardCities()
    if (res.code === 0) cityOptions.value = res.data
    else cityLoadError.value = true
  } catch (e) {
    cityLoadError.value = true
  } finally {
    cityLoading.value = false
  }
}
async function loadAreas(city) {
  areaOptions.value = []
  areaLoading.value = true
  try {
    const res = await getDashboardAreas({ city })
    if (res.code === 0) areaOptions.value = res.data
  } finally {
    areaLoading.value = false
  }
}
// 城市变更：清空已选区域；有城市才加载区域，无城市清空区域下拉
watch(cityCode, (v) => {
  areaId.value = ''
  if (v) loadAreas(v)
  else areaOptions.value = []
})

// ============ 演示 Mock 动态数据分支（忽略筛选，仅现场演示用） ============
const mockState = reactive({
  orderTotal: 1280,
  completionRate: 92.5,
  cancelRate: 3.2,
  avgOrderAmount: 18.6,
  vehicleOnline: 42,
  vehicleTotal: 60,
  ticketTotal: 36,
  sessionTotal: 88,
  auditLogTotal: 512
})
const mockStations = ['亦庄文化园站', '亦庄创意生活广场站', '中关村软件园站', '海淀黄庄站', '顺义安泰大街站', '西二旗站', '望京站', '国贸站', '金融街站', '五道口站', '上地站', '清河站', '北苑站', '回龙观站', '天通苑站']
function mockTick() {
  // 演示数据：随机游走（波动式）。各指标围绕基准上下浮动并被夹在合理区间内，
  // 因此趋势图与卡片既会“变多”也会“变少”，更贴近实时波动效果（而非只增不减）。
  mockState.orderTotal = clamp(mockState.orderTotal + randInt(-60, 60), 800, 2000)
  mockState.completionRate = clamp(+(mockState.completionRate + rand(-0.3, 0.3)).toFixed(1), 80, 99)
  mockState.cancelRate = clamp(+(mockState.cancelRate + rand(-0.2, 0.2)).toFixed(1), 1, 10)
  mockState.avgOrderAmount = clamp(+(mockState.avgOrderAmount + rand(-0.4, 0.4)).toFixed(2), 10, 30)
  mockState.vehicleOnline = clamp(mockState.vehicleOnline + randInt(-3, 3), 0, mockState.vehicleTotal)
  mockState.ticketTotal = clamp(mockState.ticketTotal + randInt(-3, 3), 100, 9999)
  mockState.sessionTotal = clamp(mockState.sessionTotal + randInt(-5, 5), 50, 9999)
  mockState.auditLogTotal = clamp(mockState.auditLogTotal + randInt(-8, 8), 200, 99999)
  return { ...mockState }
}
function genMockStationFlow() {
  return mockStations.map((name) => ({ stationName: name, boardCount: randInt(20, 300), alightCount: randInt(20, 300) }))
}

// ============ 单次数据获取（查询 / 手动刷新 / 定时轮询 共用同一入口） ============
async function fetchData() {
  if (fetching) return            // 已有请求在途则跳过本次，避免接口堆积/重叠
  fetching = true
  loading.value = true
  try {
    let ov = null
    let flow = null
    if (useMock.value) {
      // 演示分支：不调用真实接口，前端动态波动（随机游走，忽略筛选条件，仅现场演示刷新效果）
      ov = mockTick()
      flow = genMockStationFlow()
    } else {
      const params = buildParams()
      // 命中接口缓存则直接复用，减少后端压力
      const now = Date.now()
      if (overviewCache.data && now - overviewCache.ts < CACHE_TTL) {
        ov = overviewCache.data
      } else {
        const [ovRes, flowRes] = await Promise.all([
          getDashboardOverview(params),
          getStationFlow(params)
        ])
        if (ovRes.code === 0) { ov = ovRes.data; overviewCache = { data: ov, ts: Date.now() } }
        if (flowRes.code === 0) flow = flowRes.data
      }
    }
    if (ov) {
      overview.value = ov
      if (Array.isArray(ov.orderTrend) && ov.orderTrend.length > 0) {
        // 真实数据：后端已按小时/天聚合，一次返回多个趋势点
        trendSeries.value = ov.orderTrend.map((p) => ({ time: p.date, value: p.value }))
        renderTrend()
      } else {
        // Mock 或后端无趋势数据：追加单点
        appendTrend(ov.orderTotal ?? 0)
      }
    }
    if (flow) {
      stationFlow.value = (flow || [])
        .sort((a, b) => (b.boardCount + b.alightCount) - (a.boardCount + a.alightCount))
        .slice(0, 15)
    }
    lastUpdate.value = `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}:${pad(new Date().getSeconds())}`
  } catch (e) {
    console.error('[dashboard] fetch failed:', e)
  } finally {
    loading.value = false
    fetching = false
  }
}

// ============ 趋势图：前端维护时序数组 ============
function appendTrend(value) {
  const d = new Date()
  const label = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  trendSeries.value.push({ time: label, value })
  if (trendSeries.value.length > MAX_POINTS) trendSeries.value.shift()
  renderTrend()
}

function renderTrend() {
  nextTick(() => {
    if (!trendRef.value) return
    if (!chart) chart = echarts.init(trendRef.value)
    const list = trendSeries.value
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 30, top: 40, bottom: 40 },
      xAxis: { type: 'category', data: list.map((t) => t.time), boundaryGap: false },
      yAxis: { type: 'value', minInterval: 1 },
      series: [{
        name: '下单量', type: 'line', smooth: true, areaStyle: {}, showSymbol: list.length <= 1,
        data: list.map((t) => t.value)
      }]
    })
    chart.resize()
  })
}

// ============ 控件交互 ============
// 查询：应用当前筛选条件，清空趋势历史后立刻拉一次
const manualRefresh = () => { trendSeries.value = []; fetchData() }
// 重置：清空城市/区域，恢复默认全部城市 + 今日范围
const resetData = () => {
  cityCode.value = ''
  areaId.value = ''
  dateMode.value = 'range'
  singleDay.value = ''
  dateRange.value = [todayStr(), todayStr()]
  trendSeries.value = []
  fetchData()
}

// ============ 实时刷新开关控制 ============
// 开启：立即拉取一次并启动 setInterval 定时轮询；关闭：clearInterval 停止，数据保持当前状态不变。
// 重复定时器保护：timer !== null 时不再创建新的定时器，避免内存泄漏/重复请求。
const startRealtime = () => {
  if (timer !== null) return
  realtime.value = true
  fetchData()                                      // 立即刷新一次
  timer = setInterval(fetchData, POLL_INTERVAL)    // 之后按间隔轮询
}
const stopRealtime = () => {
  realtime.value = false
  if (timer !== null) {
    clearInterval(timer)
    timer = null
  }
}
const onRealtimeChange = (val) => {
  if (val) startRealtime()
  else stopRealtime()
}

// ============ 生命周期 ============
const onResize = () => { if (chart) chart.resize() }

onMounted(() => {
  window.addEventListener('resize', onResize)
  loadCities()                                   // 预加载城市下拉
  dateRange.value = [todayStr(), todayStr()]     // 默认今日范围
  fetchData()                                    // 默认静态模式：先拉一次作为初始快照（不启动轮询）
})
onUnmounted(() => {
  stopRealtime()                                 // 强制清除定时器，防止内存泄漏
  window.removeEventListener('resize', onResize)
  if (chart) { chart.dispose(); chart = null }
})
</script>

<style scoped>
.dashboard { padding: 8px; }
.filter-bar { margin-bottom: 16px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.filter-item { min-width: 140px; }
.mock-switch { margin-left: 4px; }
.live-tag { font-size: 13px; color: #909399; display: inline-flex; align-items: center; gap: 6px; }
.live-tag .dot { width: 8px; height: 8px; border-radius: 50%; background: #c0c4cc; display: inline-block; }
.live-tag.active { color: #67c23a; }
.live-tag.active .dot { background: #67c23a; box-shadow: 0 0 0 3px rgba(103,194,58,0.2); }
.load-err { color: #f56c6c; }
.card-row { margin-bottom: 16px; }
.metric-card {
  background: #fff; border-radius: 6px; padding: 18px 14px; text-align: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06); height: 100%;
}
.metric-label { font-size: 13px; color: #909399; margin-bottom: 10px; }
.metric-value { font-size: 26px; font-weight: 600; }
.metric-unit { font-size: 12px; color: #909399; margin-left: 4px; }
.chart-row { margin-bottom: 16px; }
.chart-box { background: #fff; border-radius: 6px; padding: 16px; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06); }
.chart-title { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
.chart { width: 100%; height: 320px; }
.chart-empty { height: 320px; display: flex; align-items: center; justify-content: center; color: #909399; }
</style>
