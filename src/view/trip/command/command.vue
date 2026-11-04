<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="searchInfo">
        <el-form-item label="关键词">
          <el-input v-model="searchInfo.keyword" placeholder="指令编号/类型" clearable @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item>
          <city-area-time-filter :key="filterKey" :show-city="true" :show-area="true" :show-time="true" @change="onCatChange" />
          <el-button type="primary" @click="getTableData">搜索</el-button>
          <el-button @click="openDialog()">下发指令</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="gva-table-box">
      <el-table :data="tableData" border stripe>
        <el-table-column label="ID" prop="ID" width="70" />
        <el-table-column label="指令编号" prop="commandNo" width="180" />
        <el-table-column label="车辆ID" prop="vehicleId" width="90" />
        <el-table-column label="订单ID" prop="orderId" width="90" />
        <el-table-column label="指令类型" prop="commandType" width="110" />
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="cmdTag(scope.row.commandStatus)">{{ scope.row.commandStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="执行结果" prop="resultMessage" min-width="160" show-overflow-tooltip />
        <el-table-column label="时间" prop="createdAt" width="170" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="openDialog(scope.row)">更新</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination v-model:current-page="searchInfo.page" v-model:page-size="searchInfo.pageSize" :total="total"
        :page-sizes="[10, 30, 50]" layout="total, sizes, prev, pager, next, jumper" @size-change="getTableData"
        @current-change="getTableData" />
    </div>
    <el-drawer v-model="dialogVisible" :title="form.ID ? '更新指令' : '下发指令'" :size="appStore.drawerSize">
      <el-form :model="form" label-width="90px">
        <el-form-item label="指令编号" required><el-input v-model="form.commandNo" :disabled="!!form.ID" /></el-form-item>
        <el-form-item label="车辆ID" required><el-input-number v-model="form.vehicleId" :min="1" style="width: 100%" /></el-form-item>
        <el-form-item label="订单ID"><el-input-number v-model="form.orderId" :min="0" style="width: 100%" /></el-form-item>
        <el-form-item label="指令类型">
          <el-select v-model="form.commandType" style="width: 100%">
            <el-option label="接驾" value="接驾" />
            <el-option label="开始行程" value="开始行程" />
            <el-option label="结束行程" value="结束行程" />
            <el-option label="靠边停车" value="靠边停车" />
            <el-option label="远程协助" value="远程协助" />
            <el-option label="配置同步" value="配置同步" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.commandStatus" style="width: 100%">
            <el-option label="已发送" value="已发送" />
            <el-option label="已确认" value="已确认" />
            <el-option label="成功" value="成功" />
            <el-option label="失败" value="失败" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行结果"><el-input v-model="form.resultMessage" /></el-form-item>
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
import { getCommandList, createCommand, updateCommand } from '@/api/trip/trip'
import CityAreaTimeFilter from '@/components/filters/CityAreaTimeFilter.vue'

const tableData = ref([])
const total = ref(0)
const searchInfo = ref({ page: 1, pageSize: 10, keyword: '' })
const catFilters = ref({ city: '', area: '', startTime: '', endTime: '' })
const filterKey = ref(0)
const onCatChange = (f) => { catFilters.value = f; getTableData() }
const dialogVisible = ref(false)
const form = ref({})

const cmdTag = (v) => ({ 成功: 'success', 失败: 'danger', 已确认: 'primary' }[v] || 'info')

const getTableData = async () => {
  const res = await getCommandList({ ...searchInfo.value, ...catFilters.value })
  if (res.code === 0) { tableData.value = res.data.list; total.value = res.data.total }
}
const openDialog = (row) => { form.value = row ? { ...row } : {}; dialogVisible.value = true }
const submit = async () => {
  const res = form.value.ID ? await updateCommand(form.value) : await createCommand(form.value)
  if (res.code === 0) { ElMessage.success('操作成功'); dialogVisible.value = false; getTableData() }
}
getTableData()
</script>
