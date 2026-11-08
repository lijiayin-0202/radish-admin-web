<template>
  <!-- 城市/区域级联下拉 + 日期范围选择器（统一列表页地址/时间筛选控件） -->
  <div class="cat-filter">
    <el-select
      v-if="showCity"
      v-model="cityCode"
      placeholder="全部城市"
      clearable
      filterable
      class="cat-item"
      :loading="cityLoading"
      @visible-change="onCityVisible"
      @change="onCityChange"
    >
      <el-option v-for="c in cityOptions" :key="c.cityCode" :label="c.cityName" :value="c.cityCode" />
      <template #empty>
        <span v-if="cityLoadError" class="load-err">城市加载失败，请刷新</span>
        <span v-else>暂无城市</span>
      </template>
    </el-select>

    <el-select
      v-if="showArea"
      v-model="areaId"
      placeholder="全部区域"
      clearable
      filterable
      class="cat-item"
      :disabled="!cityCode"
      :loading="areaLoading"
    >
      <el-option v-for="a in areaOptions" :key="a.id" :label="a.areaName" :value="a.id" />
      <template #empty><span>该城市暂无区域</span></template>
    </el-select>

    <el-date-picker
      v-if="showTime"
      v-model="timeRange"
      type="daterange"
      value-format="YYYY-MM-DD"
      start-placeholder="开始日期"
      end-placeholder="结束日期"
      class="cat-item"
    />
  </div>
</template>

<script setup>
/*
 * CityAreaTimeFilter 通用筛选控件（城市/区域/时间）
 * - 城市下拉：挂载后首次展开时从后端拉取（复用 dashboard 的城市/区域接口）
 * - 区域下拉：依赖城市，无城市时禁用；切换城市自动清空并重新加载区域
 * - 时间：点击弹出日期范围选择器（单页只需时间时可隐藏城市/区域）
 * 通过 @change 把 {city, area, startTime, endTime} 抛给父页面，父页面合并进列表查询参数。
 */
import { ref, watch } from 'vue'
import { getDashboardCities, getDashboardAreas } from '@/api/platform/platform'

const props = defineProps({
  showCity: { type: Boolean, default: true },
  showArea: { type: Boolean, default: true },
  showTime: { type: Boolean, default: true }
})
const emit = defineEmits(['change'])

const cityCode = ref('')
const areaId = ref('')
const timeRange = ref([])
const cityOptions = ref([])
const areaOptions = ref([])
const cityLoading = ref(false)
const areaLoading = ref(false)
const cityLoadError = ref(false)

function emitChange() {
  emit('change', {
    city: cityCode.value,
    area: areaId.value,
    startTime: timeRange.value && timeRange.value.length === 2 ? timeRange.value[0] + ' 00:00:00' : '',
    endTime: timeRange.value && timeRange.value.length === 2 ? timeRange.value[1] + ' 23:59:59' : ''
  })
}

// 任意筛选变化都通知父页面重新查询
watch([cityCode, areaId, timeRange], () => emitChange(), { deep: true })

function onCityVisible(v) {
  if (v && !cityOptions.value.length && !cityLoadError.value && !cityLoading.value) loadCities()
}
function loadCities() {
  cityLoading.value = true
  cityLoadError.value = false
  getDashboardCities().then((r) => {
    if (r.code === 0) cityOptions.value = r.data
    else cityLoadError.value = true
  }).catch(() => { cityLoadError.value = true }).finally(() => { cityLoading.value = false })
}
// 切换/清空城市：清空已选区域并联动加载
function onCityChange() {
  areaId.value = ''
  areaOptions.value = []
  if (cityCode.value) loadAreas(cityCode.value)
}
function loadAreas(city) {
  areaLoading.value = true
  getDashboardAreas({ city }).then((r) => {
    if (r.code === 0) areaOptions.value = r.data
  }).finally(() => { areaLoading.value = false })
}
</script>

<style scoped>
.cat-filter { display: inline-flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.cat-item { min-width: 160px; }
.load-err { color: #f56c6c; }
</style>
