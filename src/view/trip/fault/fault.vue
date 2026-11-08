<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="searchInfo">
        <el-form-item label="关键词">
          <el-input v-model="searchInfo.keyword" placeholder="故障编号/类型" clearable @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item>
          <city-area-time-filter :key="filterKey" :show-city="true" :show-area="true" :show-time="true" @change="onCatChange" />
          <el-button type="primary" @click="getTableData">搜索</el-button>
          <el-button @click="openDialog()">登记故障</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="gva-table-box">
      <el-table :data="tableData" border stripe>
        <el-table-column label="ID" prop="ID" width="70" />
        <el-table-column label="故障编号" prop="faultNo" width="180" />
        <el-table-column label="车辆ID" prop="vehicleId" width="90" />
        <el-table-column label="等级" prop="faultLevel" width="90">
          <template #default="scope">
            <el-tag :type="levelTag(scope.row.faultLevel)">{{ scope.row.faultLevel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="故障类型" prop="faultType" min-width="130" />
        <el-table-column label="状态" prop="faultStatus" width="100">
          <template #default="scope">
            <el-tag :type="statusTag(scope.row.faultStatus)">{{ scope.row.faultStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="处理人" prop="handledBy" width="110" />
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
    <el-drawer v-model="dialogVisible" :title="form.ID ? '处理故障' : '登记故障'" :size="appStore.drawerSize">
      <el-form :model="form" label-width="90px">
        <el-form-item label="故障编号" required><el-input v-model="form.faultNo" :disabled="!!form.ID" /></el-form-item>
        <el-form-item label="车辆ID" required><el-input-number v-model="form.vehicleId" :min="1" style="width: 100%" /></el-form-item>
        <el-form-item label="故障等级">
          <el-select v-model="form.faultLevel" style="width: 100%">
            <el-option label="轻微" value="轻微" />
            <el-option label="一般" value="一般" />
            <el-option label="严重" value="严重" />
            <el-option label="紧急" value="紧急" />
          </el-select>
        </el-form-item>
        <el-form-item label="故障类型"><el-input v-model="form.faultType" /></el-form-item>
        <el-form-item label="故障描述"><el-input v-model="form.description" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.faultStatus" style="width: 100%">
            <el-option label="待处理" value="待处理" />
            <el-option label="处理中" value="处理中" />
            <el-option label="已解决" value="已解决" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理人"><el-input v-model="form.handledBy" /></el-form-item>
        <el-form-item label="处理结果"><el-input v-model="form.resolution" /></el-form-item>
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
import { getFaultList, createFault, updateFault } from '@/api/trip/trip'
import CityAreaTimeFilter from '@/components/filters/CityAreaTimeFilter.vue'

const tableData = ref([])
const total = ref(0)
const searchInfo = ref({ page: 1, pageSize: 10, keyword: '' })
const catFilters = ref({ city: '', area: '', startTime: '', endTime: '' })
const filterKey = ref(0)
const onCatChange = (f) => { catFilters.value = f; getTableData() }
const dialogVisible = ref(false)
const form = ref({})

const levelTag = (v) => ({ 紧急: 'danger', 严重: 'danger', 一般: 'warning' }[v] || 'info')
const statusTag = (v) => ({ 已解决: 'success', 处理中: 'primary' }[v] || 'info')

const getTableData = async () => {
  const res = await getFaultList({ ...searchInfo.value, ...catFilters.value })
  if (res.code === 0) { tableData.value = res.data.list; total.value = res.data.total }
}
const openDialog = (row) => { form.value = row ? { ...row } : {}; dialogVisible.value = true }
const submit = async () => {
  const res = form.value.ID ? await updateFault(form.value) : await createFault(form.value)
  if (res.code === 0) { ElMessage.success('操作成功'); dialogVisible.value = false; getTableData() }
}
getTableData()
</script>
