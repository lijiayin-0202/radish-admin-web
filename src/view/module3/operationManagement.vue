<template>
  <div class="gva-table-box operation-management">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="运营区域" name="areas">
        <ServiceAreaPanel />
      </el-tab-pane>
      <el-tab-pane label="站点管理" name="stations">
        <StationPanel />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import ServiceAreaPanel from './components/serviceAreaPanel.vue'
  import StationPanel from './components/stationPanel.vue'

  defineOptions({ name: 'Module3OperationManagement' })

  const activeTab = ref('areas')
</script>

<style scoped>
  .operation-management :deep(.el-tabs__header) {
    margin-bottom: 20px;
  }
</style>
