<template>
  <div class="m-page addresses">
    <MHeader title="常用地址" theme="solid">
      <template #right>
        <button class="m-inline-btn" type="button" @click="openCreate">新增</button>
      </template>
    </MHeader>

    <div class="m-chips">
      <button
        v-for="item in typeFilters"
        :key="item.key"
        class="m-chip"
        :class="{ 'm-chip--active': activeType === item.key }"
        type="button"
        @click="switchType(item.key)"
      >
        {{ item.label }}
      </button>
    </div>

    <div class="m-body">
      <div v-if="loading" class="m-loading">加载中…</div>
      <MEmpty
        v-else-if="!addresses.length"
        text="暂无常用地址"
        hint="添加家、公司或常用站点，下单时可一键选择"
      />

      <div v-else class="addresses__list">
        <div v-for="item in addresses" :key="item.id" class="addresses__card">
          <div class="addresses__icon">
            <MIcon :name="iconOf(item.address_type)" :size="18" />
          </div>
          <div class="addresses__main" @click="openEdit(item)">
            <div class="addresses__name">
              <span class="m-ellipsis">{{ item.address_name }}</span>
              <span v-if="item.is_default" class="m-tag">默认</span>
            </div>
            <div class="addresses__detail m-ellipsis-2">{{ item.address }}</div>
            <div class="addresses__meta">{{ typeLabel(item.address_type) }}</div>
          </div>
          <div class="addresses__actions">
            <button type="button" aria-label="编辑" @click="openEdit(item)">
              <MIcon name="edit" :size="17" />
            </button>
            <button type="button" aria-label="删除" @click="remove(item)">
              <MIcon name="trash" :size="17" />
            </button>
          </div>
        </div>

        <button v-if="hasMore" class="m-btn m-btn--ghost addresses__more" type="button" @click="loadMore">
          加载更多
        </button>
      </div>
    </div>

    <MPopup v-model="showForm" :title="form.id ? '编辑地址' : '新增地址'" position="bottom">
      <div class="addresses__form">
        <div class="addresses__form-row">
          <span class="addresses__form-label">地址类型</span>
          <div class="addresses__types">
            <button
              v-for="item in typeOptions"
              :key="item.value"
              class="m-chip"
              :class="{ 'm-chip--active': form.address_type === item.value }"
              type="button"
              @click="form.address_type = item.value"
            >
              {{ item.label }}
            </button>
          </div>
        </div>

        <div class="m-field">
          <span class="m-field__label">名称</span>
          <input
            v-model="form.address_name"
            class="m-field__input"
            type="text"
            maxlength="60"
            placeholder="如：家、公司、望京站"
          />
        </div>

        <div class="m-field addresses__field-area">
          <span class="m-field__label">详细地址</span>
          <textarea
            v-model="form.address"
            class="m-field__input addresses__textarea"
            rows="2"
            maxlength="255"
            placeholder="请输入详细地址"
          />
        </div>

        <div class="m-field">
          <span class="m-field__label">经度</span>
          <input v-model="form.longitude" class="m-field__input" type="text" inputmode="decimal" placeholder="选填，如 116.404" />
        </div>

        <div class="m-field">
          <span class="m-field__label">纬度</span>
          <input v-model="form.latitude" class="m-field__input" type="text" inputmode="decimal" placeholder="选填，如 39.915" />
        </div>

        <div class="m-field">
          <span class="m-field__label">设为默认</span>
          <span class="m-field__input addresses__switch-label">下单时优先使用该地址</span>
          <button
            class="m-switch"
            :class="{ 'm-switch--on': form.is_default }"
            type="button"
            :aria-pressed="form.is_default"
            @click="form.is_default = !form.is_default"
          />
        </div>

        <p class="m-form-tip">经纬度选填；不填写时按 0 处理，不影响保存。</p>

        <div class="addresses__form-actions">
          <button class="m-btn" type="button" :disabled="saving" @click="save">
            {{ saving ? '保存中…' : '保存' }}
          </button>
        </div>
      </div>
    </MPopup>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import MHeader from '@/mobile/components/MHeader.vue'
import MEmpty from '@/mobile/components/MEmpty.vue'
import MIcon from '@/mobile/components/MIcon.vue'
import MPopup from '@/mobile/components/MPopup.vue'
import { createAddress, deleteAddress, listAddresses, updateAddress } from '@/mobile/api/passenger'
import { mConfirm, showToast } from '@/mobile/utils/ui'

const PAGE_SIZE = 20

const typeOptions = [
  { value: 1, label: '家' },
  { value: 2, label: '公司' },
  { value: 3, label: '常用站点' }
]

const typeFilters = [{ key: 0, label: '全部' }, ...typeOptions.map((item) => ({ key: item.value, label: item.label }))]

const loading = ref(true)
const saving = ref(false)
const showForm = ref(false)
const activeType = ref(0)
const addresses = ref([])
const total = ref(0)
const page = ref(1)

const form = reactive({
  id: 0,
  address_type: 1,
  address_name: '',
  address: '',
  longitude: '',
  latitude: '',
  is_default: false
})

const hasMore = computed(() => addresses.value.length < total.value)

function typeLabel(type) {
  return typeOptions.find((item) => item.value === Number(type))?.label || '常用地址'
}

function iconOf(type) {
  if (Number(type) === 1) return 'home'
  if (Number(type) === 2) return 'company'
  return 'location'
}

function resetForm() {
  form.id = 0
  form.address_type = activeType.value || 1
  form.address_name = ''
  form.address = ''
  form.longitude = ''
  form.latitude = ''
  form.is_default = false
}

async function loadAddresses(targetPage = 1, append = false) {
  if (!append) loading.value = true
  try {
    const data = await listAddresses({
      page: targetPage,
      pageSize: PAGE_SIZE,
      addressType: activeType.value || undefined
    })
    total.value = Number(data.total || 0)
    page.value = Number(data.page || targetPage)
    const items = data.items || []
    addresses.value = append ? [...addresses.value, ...items] : items
  } catch (e) {
    if (!append) addresses.value = []
  } finally {
    loading.value = false
  }
}

function switchType(key) {
  if (activeType.value === key) return
  activeType.value = key
  loadAddresses(1)
}

function loadMore() {
  loadAddresses(page.value + 1, true)
}

function openCreate() {
  resetForm()
  showForm.value = true
}

function openEdit(item) {
  form.id = Number(item.id)
  form.address_type = Number(item.address_type)
  form.address_name = item.address_name || ''
  form.address = item.address || ''
  form.longitude = item.longitude ? String(item.longitude) : ''
  form.latitude = item.latitude ? String(item.latitude) : ''
  form.is_default = Boolean(item.is_default)
  showForm.value = true
}

function buildPayload() {
  const name = form.address_name.trim()
  const detail = form.address.trim()
  if (!name) {
    showToast('请输入地址名称')
    return null
  }
  if (name.length > 60) {
    showToast('地址名称不能超过 60 个字符')
    return null
  }
  if (!detail) {
    showToast('请输入详细地址')
    return null
  }
  if (detail.length > 255) {
    showToast('详细地址不能超过 255 个字符')
    return null
  }

  const payload = {
    address_type: form.address_type,
    address_name: name,
    address: detail,
    is_default: form.is_default
  }
  // 经纬度为空时不提交，交给后端保持默认值
  if (form.longitude !== '') payload.longitude = Number(form.longitude)
  if (form.latitude !== '') payload.latitude = Number(form.latitude)
  if (payload.longitude !== undefined && (Number.isNaN(payload.longitude) || Math.abs(payload.longitude) > 180)) {
    showToast('经度需在 -180 ~ 180 之间')
    return null
  }
  if (payload.latitude !== undefined && (Number.isNaN(payload.latitude) || Math.abs(payload.latitude) > 90)) {
    showToast('纬度需在 -90 ~ 90 之间')
    return null
  }
  return payload
}

async function save() {
  const payload = buildPayload()
  if (!payload || saving.value) return
  saving.value = true
  try {
    if (form.id) {
      await updateAddress(form.id, payload)
      showToast('地址已更新')
    } else {
      await createAddress(payload)
      showToast('地址已添加')
    }
    showForm.value = false
    loadAddresses(1)
  } catch (e) {
    // 提示已由拦截器下发
  } finally {
    saving.value = false
  }
}

async function remove(item) {
  const ok = await mConfirm({
    title: '删除地址',
    message: `确定删除「${item.address_name}」吗？`,
    okText: '删除'
  })
  if (!ok) return
  try {
    await deleteAddress(Number(item.id))
    showToast('已删除')
    loadAddresses(1)
  } catch (e) {
    // 提示已由拦截器下发
  }
}

onMounted(() => loadAddresses(1))
</script>

<style scoped>
.addresses {
  background: #f5f7fa;
}

.addresses__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.addresses__card {
  display: flex;
  gap: 12px;
  padding: 14px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 14px rgba(31, 41, 51, 0.05);
}

.addresses__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  color: #0ea882;
  background: #e7f9f3;
  border-radius: 12px;
}

.addresses__main {
  flex: 1;
  min-width: 0;
}

.addresses__name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 500;
}

.addresses__detail {
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.5;
  color: #6f7d87;
}

.addresses__meta {
  margin-top: 6px;
  font-size: 11px;
  color: #b6c0ca;
}

.addresses__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
}

.addresses__actions button {
  display: flex;
  padding: 6px;
  color: #93a1ab;
  background: transparent;
  border: 0;
}

.addresses__more {
  margin-top: 4px;
}

.addresses__form {
  padding: 0 0 8px;
}

.addresses__form-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
}

.addresses__form-label {
  width: 76px;
  flex: 0 0 auto;
  font-size: 15px;
}

.addresses__types {
  display: flex;
  gap: 8px;
  overflow-x: auto;
}

.addresses__field-area {
  align-items: flex-start;
  padding-top: 12px;
}

.addresses__textarea {
  height: 56px;
  padding: 4px 0;
  line-height: 1.5;
  resize: none;
}

.addresses__switch-label {
  font-size: 13px;
  color: #93a1ab;
}

.addresses__form-actions {
  padding: 18px 16px 4px;
}
</style>
