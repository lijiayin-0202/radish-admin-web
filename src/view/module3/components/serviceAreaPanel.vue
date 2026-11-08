<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="query" @submit.prevent>
        <el-form-item label="城市编码">
          <el-input v-model="query.cityCode" clearable placeholder="如：330100" @keyup.enter="search" />
        </el-form-item>
        <el-form-item label="运营状态">
          <el-select v-model="query.status" clearable placeholder="全部" class="filter-select">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="gva-btn-list">
      <el-button type="primary" @click="openCreateDialog">新增运营区域</el-button>
    </div>

    <el-table :data="tableData" border row-key="id">
      <el-table-column label="区域编码" prop="areaCode" min-width="120" />
      <el-table-column label="区域名称" prop="areaName" min-width="140" />
      <el-table-column label="城市" min-width="140">
        <template #default="{ row }">{{ row.cityName }}（{{ row.cityCode }}）</template>
      </el-table-column>
      <el-table-column label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="服务公告" prop="serviceNotice" min-width="180" show-overflow-tooltip />
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
          <el-button link type="primary" @click="openSchedule(row)">运营时段</el-button>
          <el-dropdown @command="(status) => confirmStatus(row, status)">
            <el-button link type="primary">状态管理</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :disabled="row.status === 1" :command="1">恢复运营</el-dropdown-item>
                <el-dropdown-item :disabled="row.status === 0" :command="0">临时关闭</el-dropdown-item>
                <el-dropdown-item :disabled="row.status === 2" :command="2">停运</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>

    <div class="gva-pagination">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="loadTable"
        @size-change="loadTable"
      />
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="680px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item v-if="dialogMode === 'create'" label="区域编码" prop="areaCode">
          <el-input v-model="form.areaCode" maxlength="64" />
        </el-form-item>
        <el-form-item label="区域名称" prop="areaName"><el-input v-model="form.areaName" maxlength="128" /></el-form-item>
        <el-form-item label="城市编码" prop="cityCode"><el-input v-model="form.cityCode" maxlength="64" /></el-form-item>
        <el-form-item label="城市名称" prop="cityName"><el-input v-model="form.cityName" maxlength="128" /></el-form-item>
        <el-form-item label="区域边界" prop="boundaryGeojson">
          <el-input v-model="form.boundaryGeojson" :rows="4" placeholder="请输入 GeoJSON" type="textarea" />
        </el-form-item>
        <el-form-item label="服务公告"><el-input v-model="form.serviceNotice" :rows="3" type="textarea" /></el-form-item>
        <el-form-item v-if="dialogMode === 'create'" label="初始状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio v-for="item in statusOptions" :key="item.value" :value="item.value">{{ item.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <ScheduleDialog v-model="scheduleVisible" :service-area="scheduleArea" @saved="loadTable" />
  </div>
</template>

<script setup>
  import { computed, onMounted, reactive, ref } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { changeServiceAreaStatus, createServiceArea, listServiceAreas, updateServiceArea } from '@/api/module3'
  import ScheduleDialog from './scheduleDialog.vue'

  const statusOptions = [
    { value: 0, label: '临时关闭' },
    { value: 1, label: '运营中' },
    { value: 2, label: '停运' }
  ]
  const query = reactive({ cityCode: '', status: undefined })
  const page = ref(1)
  const pageSize = ref(10)
  const total = ref(0)
  const tableData = ref([])
  const dialogVisible = ref(false)
  const dialogMode = ref('create')
  const submitting = ref(false)
  const formRef = ref()
  const scheduleVisible = ref(false)
  const scheduleArea = ref({})
  const form = reactive(defaultForm())
  const rules = {
    areaCode: [{ required: true, message: '请输入区域编码', trigger: 'blur' }],
    areaName: [{ required: true, message: '请输入区域名称', trigger: 'blur' }],
    cityCode: [{ required: true, message: '请输入城市编码', trigger: 'blur' }],
    cityName: [{ required: true, message: '请输入城市名称', trigger: 'blur' }],
    boundaryGeojson: [{ required: true, message: '请输入区域边界', trigger: 'blur' }]
  }
  const dialogTitle = computed(() => dialogMode.value === 'create' ? '新增运营区域' : '编辑运营区域')

  function defaultForm() {
    return { id: '', areaCode: '', areaName: '', cityCode: '', cityName: '', boundaryGeojson: '', serviceNotice: '', status: 1 }
  }

  function resetForm() {
    Object.assign(form, defaultForm())
    formRef.value?.clearValidate()
  }

  function statusText(status) {
    return statusOptions.find((item) => item.value === status)?.label || '未知状态'
  }

  function statusTagType(status) {
    return status === 1 ? 'success' : status === 0 ? 'warning' : 'info'
  }

  async function loadTable() {
    const request = { page: page.value, pageSize: pageSize.value }
    if (query.cityCode) request.cityCode = query.cityCode
    if (query.status !== undefined) request.status = query.status
    const result = await listServiceAreas(request)
    if (result.code !== 0) return
    tableData.value = result.data.list || []
    total.value = result.data.total || 0
    page.value = result.data.page
    pageSize.value = result.data.pageSize
  }

  function search() {
    page.value = 1
    loadTable()
  }

  function resetSearch() {
    query.cityCode = ''
    query.status = undefined
    search()
  }

  function openCreateDialog() {
    resetForm()
    dialogMode.value = 'create'
    dialogVisible.value = true
  }

  function openEditDialog(row) {
    resetForm()
    Object.assign(form, row)
    dialogMode.value = 'edit'
    dialogVisible.value = true
  }

  async function submitForm() {
    await formRef.value.validate()
    submitting.value = true
    const payload = dialogMode.value === 'create' ? { ...form } : editablePayload()
    const result = dialogMode.value === 'create' ? await createServiceArea(payload) : await updateServiceArea(payload)
    submitting.value = false
    if (result.code !== 0) return
    ElMessage.success(dialogMode.value === 'create' ? '新增成功' : '保存成功')
    dialogVisible.value = false
    loadTable()
  }

  function editablePayload() {
    const { id, areaName, cityCode, cityName, boundaryGeojson, serviceNotice } = form
    return { id, areaName, cityCode, cityName, boundaryGeojson, serviceNotice }
  }

  async function confirmStatus(row, status) {
    await ElMessageBox.confirm(`确认将“${row.areaName}”设为${statusText(status)}吗？`, '状态确认', { type: 'warning' })
    const result = await changeServiceAreaStatus({ id: row.id, status })
    if (result.code === 0) {
      ElMessage.success('状态已更新')
      loadTable()
    }
  }

  function openSchedule(row) {
    scheduleArea.value = row
    scheduleVisible.value = true
  }

  onMounted(loadTable)
</script>

<style scoped>
  .filter-select { width: 140px; }
</style>
