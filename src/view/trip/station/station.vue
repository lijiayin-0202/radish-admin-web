<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="searchInfo">
        <el-form-item label="关键词">
          <el-input v-model="searchInfo.keyword" placeholder="站点名称/地址" clearable @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item>
          <city-area-time-filter :key="filterKey" :show-city="true" :show-area="true" :show-time="true" @change="onCatChange" />
          <el-button type="primary" @click="getTableData">搜索</el-button>
          <el-button @click="openDialog()">新增站点</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="gva-table-box">
      <el-table :data="tableData" border stripe>
        <el-table-column label="ID" prop="ID" width="70" />
        <el-table-column label="站点编号" prop="stationNo" width="130" />
        <el-table-column label="站点名称" prop="stationName" min-width="150" />
        <el-table-column label="地址" prop="address" min-width="180" show-overflow-tooltip />
        <el-table-column label="类型" prop="stationType" width="100" />
        <el-table-column label="状态" width="90">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">{{ scope.row.status === 1 ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="openDialog(scope.row)">编辑</el-button>
            <el-button link type="danger" @click="onDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination v-model:current-page="searchInfo.page" v-model:page-size="searchInfo.pageSize" :total="total"
        :page-sizes="[10, 30, 50]" layout="total, sizes, prev, pager, next, jumper" @size-change="getTableData"
        @current-change="getTableData" />
    </div>
    <el-drawer v-model="dialogVisible" :title="form.ID ? '编辑站点' : '新增站点'" :size="appStore.drawerSize">
      <el-form :model="form" label-width="90px">
        <el-form-item label="站点编号" required><el-input v-model="form.stationNo" /></el-form-item>
        <el-form-item label="站点名称" required><el-input v-model="form.stationName" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="form.address" /></el-form-item>
        <el-form-item label="站点类型"><el-input v-model="form.stationType" placeholder="如 常规站/枢纽站" /></el-form-item>
        <el-form-item label="经度"><el-input-number v-model="form.longitude" :precision="6" style="width: 100%" /></el-form-item>
        <el-form-item label="纬度"><el-input-number v-model="form.latitude" :precision="6" style="width: 100%" /></el-form-item>
        <el-form-item label="上车指引"><el-input v-model="form.boardGuide" /></el-form-item>
        <el-form-item label="下车指引"><el-input v-model="form.alightGuide" /></el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
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
import { ElMessage, ElMessageBox } from 'element-plus'
  import { useAppStore } from '@/pinia'
const appStore = useAppStore()
import { getStationList, createStation, updateStation, deleteStation } from '@/api/trip/trip'
import CityAreaTimeFilter from '@/components/filters/CityAreaTimeFilter.vue'

const tableData = ref([])
const total = ref(0)
const searchInfo = ref({ page: 1, pageSize: 10, keyword: '' })
const catFilters = ref({ city: '', area: '', startTime: '', endTime: '' })
const filterKey = ref(0)
const onCatChange = (f) => { catFilters.value = f; getTableData() }
const dialogVisible = ref(false)
const form = ref({})

const getTableData = async () => {
  const res = await getStationList({ ...searchInfo.value, ...catFilters.value })
  if (res.code === 0) { tableData.value = res.data.list; total.value = res.data.total }
}
const openDialog = (row) => { form.value = row ? { ...row } : { status: 1 }; dialogVisible.value = true }
const submit = async () => {
  const res = form.value.ID ? await updateStation(form.value) : await createStation(form.value)
  if (res.code === 0) { ElMessage.success('操作成功'); dialogVisible.value = false; getTableData() }
}
const onDelete = async (row) => {
  try { await ElMessageBox.confirm(`确定删除站点「${row.stationName}」吗？`, '提示', { type: 'warning' }) } catch (e) { return }
  const res = await deleteStation(row.ID)
  if (res.code === 0) { ElMessage.success('删除成功'); getTableData() }
}
getTableData()
</script>
