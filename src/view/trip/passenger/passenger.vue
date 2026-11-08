<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="searchInfo">
        <el-form-item label="关键词">
          <el-input v-model="searchInfo.keyword" placeholder="手机号/昵称" clearable @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item>
          <city-area-time-filter :key="filterKey" :show-city="false" :show-area="false" :show-time="true" @change="onCatChange" />
          <el-button type="primary" @click="getTableData">搜索</el-button>
          <el-button @click="openDialog()">新增乘客</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="gva-table-box">
      <el-table :data="tableData" border stripe>
        <el-table-column label="ID" prop="ID" width="70" />
        <el-table-column label="用户ID" prop="userId" width="90" />
        <el-table-column label="手机号" prop="mobile" width="140" />
        <el-table-column label="昵称" prop="nickname" min-width="140" />
        <el-table-column label="状态" width="90">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">{{ scope.row.status === 1 ? '正常' : '冻结' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" prop="createdAt" width="180" />
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
    <el-drawer v-model="dialogVisible" :title="form.ID ? '编辑乘客' : '新增乘客'" :size="appStore.drawerSize">
      <el-form :model="form" label-width="80px">
        <el-form-item label="手机号" required><el-input v-model="form.mobile" /></el-form-item>
        <el-form-item label="昵称"><el-input v-model="form.nickname" /></el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="正常" inactive-text="冻结" />
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
import { getPassengerList, createPassenger, updatePassenger, deletePassenger } from '@/api/trip/trip'
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
  const res = await getPassengerList({ ...searchInfo.value, ...catFilters.value })
  if (res.code === 0) { tableData.value = res.data.list; total.value = res.data.total }
}
const openDialog = (row) => { form.value = row ? { ...row } : { status: 1 }; dialogVisible.value = true }
const submit = async () => {
  const res = form.value.ID ? await updatePassenger(form.value) : await createPassenger(form.value)
  if (res.code === 0) { ElMessage.success('操作成功'); dialogVisible.value = false; getTableData() }
}
const onDelete = async (row) => {
  try { await ElMessageBox.confirm(`确定删除乘客「${row.nickname || row.mobile}」吗？`, '提示', { type: 'warning' }) } catch (e) { return }
  const res = await deletePassenger(row.ID)
  if (res.code === 0) { ElMessage.success('删除成功'); getTableData() }
}
getTableData()
</script>
