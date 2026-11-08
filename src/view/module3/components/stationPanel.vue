<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" @submit.prevent>
        <el-form-item label="运营区域">
          <el-select v-model="selectedAreaId" filterable clearable placeholder="请先选择运营区域" class="area-select" @change="loadStations">
            <el-option v-for="area in areas" :key="area.id" :label="`${area.areaName}（${area.areaCode}）`" :value="area.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="站点名称"><el-input v-model="keyword" clearable placeholder="当前区域内筛选" @keyup.enter="search" /></el-form-item>
        <el-form-item><el-button type="primary" :disabled="!selectedAreaId" @click="search">查询</el-button><el-button @click="resetSearch">重置</el-button></el-form-item>
      </el-form>
    </div>

    <div class="gva-btn-list"><el-button type="primary" :disabled="!selectedAreaId" @click="openCreateDialog">新增站点</el-button></div>
    <el-alert v-if="!selectedAreaId" title="请先选择运营区域，再查询或维护站点。" type="info" :closable="false" show-icon />
    <el-table v-else :data="pagedStations" border row-key="id" class="station-table">
      <el-table-column label="站点编码" prop="stationCode" min-width="120" />
      <el-table-column label="站点名称" prop="stationName" min-width="140" />
      <el-table-column label="别名" prop="aliasName" min-width="110" />
      <el-table-column label="地址" prop="address" min-width="180" show-overflow-tooltip />
      <el-table-column label="坐标" min-width="170"><template #default="{ row }">{{ row.longitude }}, {{ row.latitude }}</template></el-table-column>
      <el-table-column label="状态" width="90"><template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag></template></el-table-column>
      <el-table-column label="操作" width="170" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
          <el-button link :type="row.status === 1 ? 'danger' : 'success'" @click="confirmStatus(row)">{{ row.status === 1 ? '停用' : '启用' }}</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div v-if="selectedAreaId" class="gva-pagination">
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]" :total="filteredStations.length" layout="total, sizes, prev, pager, next, jumper" @current-change="changePage" @size-change="changePage" />
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogMode === 'create' ? '新增站点' : '编辑站点'" width="680px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item v-if="dialogMode === 'create'" label="站点编码" prop="stationCode"><el-input v-model="form.stationCode" maxlength="64" /></el-form-item>
        <el-form-item label="站点名称" prop="stationName"><el-input v-model="form.stationName" maxlength="128" /></el-form-item>
        <el-form-item label="别名"><el-input v-model="form.aliasName" /></el-form-item>
        <el-form-item label="地址" prop="address"><el-input v-model="form.address" /></el-form-item>
        <el-form-item label="经度" prop="longitude"><el-input-number v-model="form.longitude" :precision="6" :step="0.000001" class="number-input" /></el-form-item>
        <el-form-item label="纬度" prop="latitude"><el-input-number v-model="form.latitude" :precision="6" :step="0.000001" class="number-input" /></el-form-item>
        <el-form-item label="站点类型"><el-input-number v-model="form.stationType" :min="0" :precision="0" /></el-form-item>
        <el-form-item label="服务方向"><el-input-number v-model="form.serviceDirection" :min="0" :precision="0" /></el-form-item>
        <el-form-item label="方向提示"><el-input v-model="form.directionHint" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" :loading="submitting" @click="submitForm">保存</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
  import { computed, onMounted, reactive, ref } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { changeStationStatus, createStation, listServiceAreas, listStations, updateStation } from '@/api/module3'

  const areas = ref([])
  const selectedAreaId = ref('')
  const keyword = ref('')
  const stations = ref([])
  const page = ref(1)
  const pageSize = ref(10)
  const dialogVisible = ref(false)
  const dialogMode = ref('create')
  const submitting = ref(false)
  const formRef = ref()
  const form = reactive(defaultForm())
  const rules = {
    stationCode: [{ required: true, message: '请输入站点编码', trigger: 'blur' }],
    stationName: [{ required: true, message: '请输入站点名称', trigger: 'blur' }],
    address: [{ required: true, message: '请输入站点地址', trigger: 'blur' }],
    longitude: [{ required: true, message: '请输入经度', trigger: 'change' }],
    latitude: [{ required: true, message: '请输入纬度', trigger: 'change' }]
  }
  const filteredStations = computed(() => {
    const text = keyword.value.trim().toLowerCase()
    return text ? stations.value.filter((item) => item.stationName.toLowerCase().includes(text)) : stations.value
  })
  const pagedStations = computed(() => filteredStations.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))

  function defaultForm() {
    return { id: '', serviceAreaId: '', stationCode: '', stationName: '', aliasName: '', address: '', longitude: undefined, latitude: undefined, stationType: 0, serviceDirection: 0, directionHint: '' }
  }

  async function loadAreas() {
    const result = await listServiceAreas({ page: 1, pageSize: 100 })
    if (result.code === 0) areas.value = result.data.list || []
  }

  async function loadStations() {
    stations.value = []
    page.value = 1
    if (!selectedAreaId.value) return
    const result = await listStations({ serviceAreaId: selectedAreaId.value })
    if (result.code === 0) stations.value = result.data.list || []
  }

  function search() { page.value = 1 }
  function resetSearch() { keyword.value = ''; search() }
  function changePage() {}

  function resetForm() {
    Object.assign(form, defaultForm())
    formRef.value?.clearValidate()
  }

  function openCreateDialog() {
    resetForm()
    form.serviceAreaId = selectedAreaId.value
    dialogMode.value = 'create'
    dialogVisible.value = true
  }

  function openEditDialog(row) {
    resetForm()
    Object.assign(form, row)
    dialogMode.value = 'edit'
    dialogVisible.value = true
  }

  function editablePayload() {
    const { id, stationName, aliasName, address, longitude, latitude, stationType, serviceDirection, directionHint } = form
    return { id, stationName, aliasName, address, longitude, latitude, stationType, serviceDirection, directionHint }
  }

  async function submitForm() {
    await formRef.value.validate()
    submitting.value = true
    const payload = dialogMode.value === 'create' ? { ...form } : editablePayload()
    const result = dialogMode.value === 'create' ? await createStation(payload) : await updateStation(payload)
    submitting.value = false
    if (result.code !== 0) return
    ElMessage.success(dialogMode.value === 'create' ? '新增成功' : '保存成功')
    dialogVisible.value = false
    loadStations()
  }

  async function confirmStatus(row) {
    const nextStatus = row.status === 1 ? 0 : 1
    const action = nextStatus === 1 ? '启用' : '停用'
    await ElMessageBox.confirm(`确认${action}站点“${row.stationName}”吗？`, '状态确认', { type: 'warning' })
    const result = await changeStationStatus({ id: row.id, status: nextStatus })
    if (result.code === 0) {
      ElMessage.success(`站点已${action}`)
      loadStations()
    }
  }

  onMounted(loadAreas)
</script>

<style scoped>
  .area-select { width: 280px; }
  .station-table { margin-top: 16px; }
  .number-input { width: 100%; }
</style>
