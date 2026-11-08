<template>
  <div class="module-placeholder">
    <el-card shadow="never" class="placeholder-card">
      <el-empty :description="`${title} 正在开发中`">
        <div class="placeholder-desc">{{ description }}</div>
      </el-empty>
    </el-card>
  </div>
</template>

<script setup>
  defineProps({
    title: {
      type: String,
      default: '该模块'
    },
    description: {
      type: String,
      default: '页面尚未实现，暂无数据可展示。'
    }
  })
</script>

<style lang="scss" scoped>
  .module-placeholder {
    .placeholder-card {
      min-height: calc(100vh - 200px);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .placeholder-desc {
      max-width: 420px;
      font-size: 13px;
      line-height: 1.8;
      color: var(--el-text-color-secondary);
    }
  }
</style>
