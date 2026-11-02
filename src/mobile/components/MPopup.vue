<template>
  <teleport to="body">
    <transition name="m-fade">
      <div v-if="modelValue" class="m-popup-mask" @click.self="handleMaskClick">
        <div class="m-popup" :class="`m-popup--${position}`">
          <div v-if="title || $slots.header" class="m-popup__header">
            <slot name="header">
              <span class="m-popup__title">{{ title }}</span>
            </slot>
            <button class="m-popup__close" type="button" aria-label="关闭" @click="close">
              <MIcon name="close" :size="18" :stroke-width="1.8" />
            </button>
          </div>
          <div class="m-popup__body">
            <slot />
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import MIcon from './MIcon.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  // bottom：底部抽屉；center：居中弹层
  position: { type: String, default: 'bottom' },
  maskClosable: { type: Boolean, default: true }
})

const emit = defineEmits(['update:modelValue'])

function close() {
  emit('update:modelValue', false)
}

function handleMaskClick() {
  if (props.maskClosable) close()
}
</script>

<style scoped>
.m-popup-mask {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  background: rgba(15, 23, 30, 0.42);
}

.m-popup {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  background: #fff;
}

.m-popup--bottom {
  margin-top: auto;
  max-height: 84vh;
  border-radius: 20px 20px 0 0;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  animation: m-slide-up 0.22s ease-out;
}

.m-popup--center {
  align-self: center;
  margin: 0 28px;
  max-height: 80vh;
  border-radius: 18px;
  animation: m-pop-in 0.2s ease-out;
}

.m-popup__header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 52px;
  flex: 0 0 auto;
}

.m-popup__title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2933;
}

.m-popup__close {
  position: absolute;
  top: 50%;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  color: #8a949e;
  background: transparent;
  border: 0;
  transform: translateY(-50%);
}

.m-popup__body {
  flex: 1;
  overflow-y: auto;
  padding: 0 0 20px;
}

@keyframes m-slide-up {
  from {
    transform: translateY(100%);
  }

  to {
    transform: translateY(0);
  }
}

@keyframes m-pop-in {
  from {
    opacity: 0;
    transform: scale(0.94);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
