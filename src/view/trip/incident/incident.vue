<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="searchInfo">
        <el-form-item label="关键词">
          <el-input v-model="searchInfo.keyword" placeholder="事件编号/类型" clearable @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item>
          <city-area-time-filter :key="filterKey" :show-city="false" :show-area="false" :show-time="true" @change="onCatChange" />
          <el-button type="primary" @click="getTableData">搜索</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="gva-table-box">
      <el-table :data="tableData" border stripe>
        <el-table-column label="ID" prop="ID" width="70" />
        <el-table-column label="事件编号" prop="incidentNo" width="180" />
        <el-table-column label="订单ID" prop="orderId" width="90" />
        <el-table-column label="事件类型" prop="incidentType" min-width="120" />
        <el-table-column label="状态" prop="status" width="100">
          <template #default="scope">
            <el-tag :type="statusTag(scope.row.status)">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="处理人" prop="handledBy" width="110" />
        <el-table-column label="处理结果" prop="resolution" min-width="150" show-overflow-tooltip />
        <el-table-column label="时间" prop="createdAt" width="170" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="openDialog(scope.row)">处理</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination v-model:current-page="searchInfo.page" v-model:page-size="searchInfo.pageSize" :total="total"
        :page-sizes="[10, 30, 50]" layout="total, sizes, prev, pager, next, jumper" @size-change="getTableData"
        @current-change="getTableData" />
    </div>
    <el-drawer v-model="dialogVisible" title="处理安全事件" :size="appStore.drawerSize">
      <el-form :model="form" label-width="90px">
        <el-form-item label="事件编号"><el-input v-model="form.incidentNo" disabled /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="待处理" value="待处理" />
            <el-option label="处理中" value="处理中" />
            <el-option label="已办结" value="已办结" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理人"><el-input v-model="form.handledBy" /></el-form-item>
        <el-form-item label="处理结果"><el-input v-model="form.resolution" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
  import { useAppStore } from '@/pinia'
const appStore = useAppStore()
import { getIncidentList, updateIncident } from '@/api/trip/trip'
import CityAreaTimeFilter from '@/components/filters/CityAreaTimeFilter.vue'

const tableData = ref([])
const total = ref(0)
const searchInfo = ref({ page: 1, pageSize: 10, keyword: '' })
const catFilters = ref({ city: '', area: '', startTime: '', endTime: '' })
const filterKey = ref(0)
const onCatChange = (f) => { catFilters.value = f; getTableData() }
const dialogVisible = ref(false)
const form = ref({})

const statusTag = (v) => ({ 已办结: 'success', 处理中: 'primary' }[v] || 'danger')

const getTableData = async () => {
  const res = await getIncidentList({ ...searchInfo.value, ...catFilters.value })
  if (res.code === 0) { tableData.value = res.data.list; total.value = res.data.total }
}
const openDialog = (row) => { form.value = { ...row }; dialogVisible.value = true }
const submit = async () => {
  const res = await updateIncident(form.value)
  if (res.code === 0) { ElMessage.success('更新成功'); dialogVisible.value = false; getTableData() }
}
getTableData()
</script>
