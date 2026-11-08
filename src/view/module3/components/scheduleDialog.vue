<template>
  <el-dialog v-model="visible" :title="`${serviceArea.areaName || ''} · 运营时段`" width="900px" destroy-on-close @open="loadDetail">
    <div class="gva-btn-list">
      <el-button type="primary" plain @click="addWeekly">新增星期规则</el-button>
      <el-button type="primary" plain @click="addSpecialDate">新增特殊日期规则</el-button>
    </div>
    <el-alert title="特殊日期优先于同日星期规则；开始时间晚于结束时间表示跨午夜。清空全部规则后保存，区域默认不可运营。" type="info" :closable="false" show-icon />
    <el-table :data="schedules" class="schedule-table" border>
      <el-table-column label="规则类型" width="130">
        <template #default="{ row }"><el-tag :type="row.specialDate ? 'warning' : 'primary'">{{ row.specialDate ? '特殊日期' : '星期常规' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="星期 / 日期" min-width="170">
        <template #default="{ row }">
          <el-date-picker v-if="row.specialDate" v-model="row.specialDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" />
          <el-select v-else v-model="row.dayOfWeek" placeholder="选择星期">
            <el-option v-for="item in weekdays" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="开始时间" width="150"><template #default="{ row }"><el-time-picker v-model="row.startTime" format="HH:mm" value-format="HH:mm" /></template></el-table-column>
      <el-table-column label="结束时间" width="150"><template #default="{ row }"><el-time-picker v-model="row.endTime" format="HH:mm" value-format="HH:mm" /></template></el-table-column>
      <el-table-column label="启用" width="90"><template #default="{ row }"><el-switch v-model="row.isEnabled" /></template></el-table-column>
      <el-table-column label="公告" min-width="160"><template #default="{ row }"><el-input v-model="row.notice" maxlength="300" /></template></el-table-column>
      <el-table-column label="操作" width="80"><template #default="{ $index }"><el-button link type="danger" @click="remove($index)">删除</el-button></template></el-table-column>
    </el-table>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">保存时段</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import { ElMessage } from 'element-plus'
  import { getServiceArea, replaceServiceAreaSchedules } from '@/api/module3'

  const props = defineProps({ modelValue: Boolean, serviceArea: { type: Object, default: () => ({}) } })
  const emit = defineEmits(['update:modelValue', 'saved'])
  const schedules = ref([])
  const saving = ref(false)
  const weekdays = [
    { value: 1, label: '星期一' }, { value: 2, label: '星期二' }, { value: 3, label: '星期三' },
    { value: 4, label: '星期四' }, { value: 5, label: '星期五' }, { value: 6, label: '星期六' }, { value: 7, label: '星期日' }
  ]
  const visible = computed({ get: () => props.modelValue, set: (value) => emit('update:modelValue', value) })

  const minuteToTime = (minute) => `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
  const timeToMinute = (value) => {
    const [hour, minute] = value.split(':').map(Number)
    return hour * 60 + minute
  }

  async function loadDetail() {
    if (!props.serviceArea.id) return
    const result = await getServiceArea({ id: props.serviceArea.id })
    if (result.code !== 0) return
    schedules.value = (result.data.schedules || []).map(toFormSchedule)
  }

  function toFormSchedule(schedule) {
    return { dayOfWeek: schedule.specialDate ? 0 : schedule.dayOfWeek, specialDate: schedule.specialDate || '', startTime: minuteToTime(schedule.startMinute), endTime: minuteToTime(schedule.endMinute), isEnabled: schedule.isEnabled, notice: schedule.notice || '' }
  }

  function addWeekly() {
    schedules.value.push({ dayOfWeek: 1, specialDate: '', startTime: '09:00', endTime: '18:00', isEnabled: true, notice: '' })
  }

  function addSpecialDate() {
    schedules.value.push({ dayOfWeek: 0, specialDate: '', startTime: '09:00', endTime: '18:00', isEnabled: true, notice: '' })
  }

  function remove(index) {
    schedules.value.splice(index, 1)
  }

  function payloadSchedules() {
    return schedules.value.map((schedule) => {
      if ((!schedule.specialDate && (schedule.dayOfWeek < 1 || schedule.dayOfWeek > 7)) || !schedule.startTime || !schedule.endTime) throw new Error('请完善星期/日期和起止时间')
      if (schedule.startTime === schedule.endTime) throw new Error('起止时间不能相同')
      return { dayOfWeek: schedule.specialDate ? 0 : schedule.dayOfWeek, specialDate: schedule.specialDate, startMinute: timeToMinute(schedule.startTime), endMinute: timeToMinute(schedule.endTime), isEnabled: schedule.isEnabled, notice: schedule.notice }
    })
  }

  async function save() {
    let payload
    try { payload = payloadSchedules() } catch (error) { ElMessage.error(error.message); return }
    saving.value = true
    const result = await replaceServiceAreaSchedules({ id: props.serviceArea.id, schedules: payload })
    saving.value = false
    if (result.code !== 0) return
    ElMessage.success('运营时段已保存')
    visible.value = false
    emit('saved')
  }
</script>

<style scoped>
  .schedule-table { margin-top: 16px; }
</style>
