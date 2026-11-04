<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="searchInfo">
        <el-form-item label="调度编号">
          <el-input v-model="searchInfo.dispatchNo" placeholder="调度编号" clearable @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchInfo.status" placeholder="全部" clearable style="width:120px">
            <el-option v-for="o in statusOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="调度时间">
          <el-date-picker v-model="timeRange" type="datetimerange" range-separator="~"
            start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getTableData">搜索</el-button>
          <el-button @click="openDialog()">新增调度</el-button>
          <el-button type="danger" :disabled="!multipleSelection.length" @click="onDeleteByIds">批量删除</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="gva-table-box">
      <el-table :data="tableData" border stripe @selection-change="onSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column label="ID" prop="ID" width="70" />
        <el-table-column label="调度编号" prop="dispatchNo" min-width="130" />
        <el-table-column label="司机ID" prop="driverId" width="90" />
        <el-table-column label="车辆ID" prop="carId" width="90" />
        <el-table-column label="订单ID" prop="orderId" width="90" />
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="statusType(scope.row.status)">{{ statusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="调度时间" prop="dispatchTime" width="170">
          <template #default="scope">{{ fmtTime(scope.row.dispatchTime) }}</template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" min-width="160" show-overflow-tooltip />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="openDialog(scope.row)">编辑</el-button>
            <el-button link type="warning" :disabled="scope.row.status === 4" @click="onCancel(scope.row)">撤销派单</el-button>
            <el-button link type="danger" @click="onDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination v-model:current-page="searchInfo.page" v-model:page-size="searchInfo.pageSize" :total="total"
        :page-sizes="[10, 30, 50]" layout="total, sizes, prev, pager, next, jumper" @size-change="getTableData"
        @current-change="getTableData" />
    </div>
    <el-drawer v-model="dialogVisible" :title="form.ID ? '编辑调度' : '新增调度'" :size="appStore.drawerSize">
      <el-form :model="form" label-width="90px">
        <el-form-item label="调度编号" required><el-input v-model="form.dispatchNo" placeholder="如 DD20261102001" /></el-form-item>
        <el-form-item label="司机ID" required><el-input-number v-model="form.driverId" :min="0" style="width:100%" /></el-form-item>
        <el-form-item label="车辆ID" required><el-input-number v-model="form.carId" :min="0" style="width:100%" /></el-form-item>
        <el-form-item label="订单ID"><el-input-number v-model="form.orderId" :min="0" style="width:100%" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width:100%">
            <el-option v-for="o in statusOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="调度时间">
          <el-date-picker v-model="form.dispatchTime" type="datetime" placeholder="选择时间"
            value-format="YYYY-MM-DDTHH:mm:ssZ" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="3" /></el-form-item>
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
import {
  getOperationDispatchList,
  createOperationDispatch,
  updateOperationDispatch,
  deleteOperationDispatch,
  deleteOperationDispatchByIds,
  cancelOperationDispatch
} from '@/api/trip/operationDispatch'
const appStore = useAppStore()

const statusOptions = [
  { label: '待调度', value: 0 },
  { label: '调度中', value: 1 },
  { label: '已派单', value: 2 },
  { label: '已完成', value: 3 },
  { label: '已取消', value: 4 },
  { label: '异常', value: 5 }
]
const statusLabel = (s) => (statusOptions.find(o => o.value === s) || {}).label || s
const statusType = (s) => ({ 0: 'info', 1: 'warning', 2: '', 3: 'success', 4: 'info', 5: 'danger' }[s] || 'info')
const fmtTime = (v) => v ? String(v).replace('T', ' ').slice(0, 19) : '-'

const tableData = ref([])
const total = ref(0)
const searchInfo = ref({ page: 1, pageSize: 10, dispatchNo: '', status: undefined })
const timeRange = ref([])
const multipleSelection = ref([])
const onSelectionChange = (val) => { multipleSelection.value = val }
const dialogVisible = ref(false)
const form = ref({})

const getTableData = async () => {
  const params = { ...searchInfo.value }
  if (timeRange.value && timeRange.value.length === 2) {
    params.startTime = timeRange.value[0]
    params.endTime = timeRange.value[1]
  }
  const res = await getOperationDispatchList(params)
  if (res.code === 0) { tableData.value = res.data.list; total.value = res.data.total }
}
const openDialog = (row) => { form.value = row ? { ...row } : { status: 0 }; dialogVisible.value = true }
const submit = async () => {
  const res = form.value.ID ? await updateOperationDispatch(form.value) : await createOperationDispatch(form.value)
  if (res.code === 0) { ElMessage.success('操作成功'); dialogVisible.value = false; getTableData() }
}
const onDelete = async (row) => {
  try { await ElMessageBox.confirm(`确定删除调度「${row.dispatchNo}」吗？`, '提示', { type: 'warning' }) } catch (e) { return }
  const res = await deleteOperationDispatch({ id: row.ID })
  if (res.code === 0) { ElMessage.success('删除成功'); getTableData() }
}
const onDeleteByIds = async () => {
  try { await ElMessageBox.confirm(`确定删除选中的 ${multipleSelection.value.length} 条调度吗？`, '提示', { type: 'warning' }) } catch (e) { return }
  const ids = multipleSelection.value.map(i => i.ID)
  const res = await deleteOperationDispatchByIds({ ids })
  if (res.code === 0) { ElMessage.success('批量删除成功'); getTableData() }
}
const onCancel = async (row) => {
  try { await ElMessageBox.confirm(`确定撤销调度「${row.dispatchNo}」吗？撤销后状态将变为「已取消」。`, '提示', { type: 'warning' }) } catch (e) { return }
  const res = await cancelOperationDispatch({ id: row.ID })
  if (res.code === 0) { ElMessage.success('撤销派单成功'); getTableData() }
}
getTableData()
</script>
