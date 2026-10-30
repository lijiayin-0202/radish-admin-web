<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="searchInfo">
        <el-form-item label="关键词">
          <el-input v-model="searchInfo.keyword" placeholder="区域/城市" clearable @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item>
          <city-area-time-filter :key="filterKey" :show-city="true" :show-area="false" :show-time="true" @change="onCatChange" />
          <el-button type="primary" @click="getTableData">搜索</el-button>
          <el-button @click="openDialog()">新增区域</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="gva-table-box">
      <el-table :data="tableData" border stripe>
        <el-table-column label="ID" prop="ID" width="70" />
        <el-table-column label="城市编码" prop="cityCode" width="110" />
        <el-table-column label="城市" prop="cityName" width="120" />
        <el-table-column label="区域名称" prop="areaName" min-width="150" />
        <el-table-column label="状态" width="110">
          <template #default="scope">
            <el-tag :type="areaTag(scope.row.status)">{{ areaText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createdAt" width="170" />
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
    <el-drawer v-model="dialogVisible" :title="form.ID ? '编辑区域' : '新增区域'" :size="appStore.drawerSize">
      <el-form :model="form" label-width="90px">
        <el-form-item label="城市编码" required><el-input v-model="form.cityCode" placeholder="如 010" /></el-form-item>
        <el-form-item label="城市名称" required><el-input v-model="form.cityName" /></el-form-item>
        <el-form-item label="区域名称" required><el-input v-model="form.areaName" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="运营中" :value="1" />
            <el-option label="停运" :value="0" />
            <el-option label="临时关闭" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="边界GeoJSON"><el-input v-model="form.polygonGeojson" type="textarea" :rows="3" /></el-form-item>
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
import { getAreaList, createArea, updateArea, deleteArea } from '@/api/trip/trip'
import CityAreaTimeFilter from '@/components/filters/CityAreaTimeFilter.vue'

const tableData = ref([])
const total = ref(0)
const searchInfo = ref({ page: 1, pageSize: 10, keyword: '' })
const catFilters = ref({ city: '', area: '', startTime: '', endTime: '' })
const filterKey = ref(0)
const onCatChange = (f) => { catFilters.value = f; getTableData() }
const dialogVisible = ref(false)
const form = ref({})

const areaText = (v) => ({ 1: '运营中', 0: '停运', 2: '临时关闭' }[v] || v)
const areaTag = (v) => ({ 1: 'success', 0: 'info', 2: 'warning' }[v] || 'info')

const getTableData = async () => {
  const res = await getAreaList({ ...searchInfo.value, ...catFilters.value })
  if (res.code === 0) { tableData.value = res.data.list; total.value = res.data.total }
}
const openDialog = (row) => { form.value = row ? { ...row } : { status: 1 }; dialogVisible.value = true }
const submit = async () => {
  const res = form.value.ID ? await updateArea(form.value) : await createArea(form.value)
  if (res.code === 0) { ElMessage.success('操作成功'); dialogVisible.value = false; getTableData() }
}
const onDelete = async (row) => {
  try { await ElMessageBox.confirm(`确定删除区域「${row.areaName}」吗？`, '提示', { type: 'warning' }) } catch (e) { return }
  const res = await deleteArea(row.ID)
  if (res.code === 0) { ElMessage.success('删除成功'); getTableData() }
}
getTableData()
</script>
