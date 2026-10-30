<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="searchInfo">
        <el-form-item label="关键词">
          <el-input v-model="searchInfo.keyword" placeholder="角色名/编码" clearable @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchInfo.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getTableData">搜索</el-button>
          <el-button @click="openDialog()">新建角色</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="gva-table-box">
      <el-table :data="tableData" border stripe>
        <el-table-column label="ID" prop="ID" width="70" />
        <el-table-column label="角色名称" prop="roleName" min-width="140" />
        <el-table-column label="角色编码" prop="roleCode" width="140" />
        <el-table-column label="描述" prop="description" min-width="180" show-overflow-tooltip />
        <el-table-column label="状态" width="90">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">{{ scope.row.status === 1 ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="openDialog(scope.row)">编辑</el-button>
            <el-button link type="success" @click="openPerm(scope.row)">分配权限</el-button>
            <el-button link type="danger" @click="onDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="searchInfo.page"
        v-model:page-size="searchInfo.pageSize"
        :total="total"
        :page-sizes="[10, 30, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="getTableData"
        @current-change="getTableData"
      />
    </div>

    <el-drawer v-model="dialogVisible" :title="form.ID ? '编辑角色' : '新建角色'" :size="appStore.drawerSize">
      <el-form :model="form" label-width="90px">
        <el-form-item label="角色名称" required>
          <el-input v-model="form.roleName" />
        </el-form-item>
        <el-form-item label="角色编码">
          <el-input v-model="form.roleCode" placeholder="如 admin" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </template>
    </el-drawer>

    <el-drawer v-model="permVisible" :title="`分配权限 - ${currentRole.roleName || ''}`" :size="appStore.drawerSize">
      <el-tree
        ref="treeRef"
        :data="permTree"
        show-checkbox
        node-key="id"
        :props="{ label: 'permissionName', children: 'children' }"
        default-expand-all
      />
      <template #footer>
        <el-button @click="permVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPerm">保存</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
  import { useAppStore } from '@/pinia'
const appStore = useAppStore()
import { getRoleList, getRolePermissions, getPermissionTree, createRole, updateRole, deleteRole, assignRolePermissions } from '@/api/platform/platform'

const tableData = ref([])
const total = ref(0)
const searchInfo = ref({ page: 1, pageSize: 10, keyword: '', status: null })
const dialogVisible = ref(false)
const form = ref({})
const permVisible = ref(false)
const permTree = ref([])
const currentRole = ref({})
const treeRef = ref()

const getTableData = async () => {
  const res = await getRoleList(searchInfo.value)
  if (res.code === 0) {
    tableData.value = res.data.list
    total.value = res.data.total
  }
}

const openDialog = (row) => {
  form.value = row ? { ...row } : { status: 1 }
  dialogVisible.value = true
}

const submit = async () => {
  const res = form.value.ID ? await updateRole(form.value) : await createRole(form.value)
  if (res.code === 0) {
    ElMessage.success('操作成功')
    dialogVisible.value = false
    getTableData()
  }
}

const openPerm = async (row) => {
  currentRole.value = row
  permVisible.value = true
  const [treeRes, roleRes] = await Promise.all([getPermissionTree(), getRolePermissions(row.ID)])
  if (treeRes.code === 0) {
    permTree.value = treeRes.data
  }
  if (roleRes.code === 0) {
    nextTick(() => {
      treeRef.value && treeRef.value.setCheckedKeys(roleRes.data.permissionIds || [])
    })
  }
}

const submitPerm = async () => {
  const permissionIds = treeRef.value ? [...treeRef.value.getCheckedKeys(), ...treeRef.value.getHalfCheckedKeys()] : []
  const res = await assignRolePermissions({ roleId: currentRole.value.ID, permissionIds })
  if (res.code === 0) {
    ElMessage.success('分配成功')
    permVisible.value = false
  }
}

const onDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除角色「${row.roleName}」吗？`, '提示', { type: 'warning' })
  } catch (e) {
    return
  }
  const res = await deleteRole(row.ID)
  if (res.code === 0) {
    ElMessage.success('删除成功')
    getTableData()
  }
}

getTableData()
</script>
