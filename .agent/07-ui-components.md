# 07｜UI 与组件规范（Web）

> 归属总纲：[AGENT.MD](../AGENT.MD)
> 覆盖：Element Plus 用法、GVA 列表页骨架、UnoCSS、按钮权限、反馈、响应式与样式

---

## 1. 组件库与复用

| 场景 | 统一用法 | 禁止 |
|------|----------|------|
| 表格 | `el-table` + `el-table-column`（`row-key="ID"`） | 手写 table、第三方表格库 |
| 分页 | `el-pagination`（`gva-pagination` 容器） | 自研分页器 |
| 表单 | `el-form` + `rules` | 手写校验逻辑、只在提交时 if 判断 |
| 弹窗 | `el-dialog` / `el-drawer`（GVA 列表页常用 drawer） | 用 div 模拟弹层 |
| 提示 | `ElMessage` / `ElMessageBox` / `ElNotification` | `alert`、裸 console |
| 上传 | `el-upload` 或 `@/components/upload/*`（image/common/cropper/QR-code） | 直连对象存储、暴露 AK/SK |
| 图标 | `@element-plus/icons-vue`、`@iconify/vue`、自动 SVG（`src/assets/icons/`） | 引入第二套图标库 |
| 日期 | `el-date-picker` | 手写日期输入 |
| 富文本 | `@wangeditor/editor-for-vue`（`@/components/richtext`） | 引入第二套编辑器 |
| 图表 | `echarts` + `vue-echarts`（`@/components/charts`） | 引入第二套图表库 |

- **复用优先**：先查 `src/components/`（`warningBar`、`selectImage`、`selectFile`、`exportExcel`、`importExcel`、`richtext`、`charts`、`customPic`、`svgIcon`、`office`）是否已有同类组件；新增公共组件属 Ask。
- 业务私有组件放 `src/view/<模块>/components/`，禁止污染全局 `src/components/`。

---

## 2. 页面布局标准结构（沿用仓库骨架）

```
<div>                              # 页面容器
├─ warningBar（需要提示时）           # @/components/warningBar
├─ div.gva-table-box               # 表格区容器（复用既有样式）
│  ├─ div.gva-btn-list             # 操作区：新增、批量（左）；刷新、导出（右）
│  ├─ el-table                     # border、tooltip-effect="dark"、空态描述
│  └─ div.gva-pagination           # 分页区：el-pagination
└─ el-drawer / el-dialog           # 新增/编辑表单
```

- 分页统一：`:page-sizes="[10, 30, 50, 100]"`、`layout="total, sizes, prev, pager, next, jumper"`。
- 表格列过多时设置 `min-width` 与 `show-overflow-tooltip`，保证 1280 宽度不破版。
- 长文本与时间列统一用 `@/utils/format`（`formatDate`、`formatBoolean`、`filterDict`），禁止各页重复实现。

---

## 3. 表单规范

1. 新增/编辑共用同一份表单数据，通过 `type`（create/update）或有无 `ID` 区分，禁止复制两套表单。
2. `rules` 覆盖后端必填项，前端提示文案与后端一致；提交按钮加 `loading` 防重复提交。
3. 提交成功关闭弹窗并刷新列表（调 `getTableData()`）。
4. 枚举项优先取字典（`getDict`/`filterDict`）；确需写死时集中在一处常量并注明来源。
5. `ID`、`CreatedAt`、`UpdatedAt` 等后端生成字段**不得出现在表单**中。
6. 数字/金额用 `el-input-number` 或带格式化的输入并校验，禁止纯文本随意输入。

---

## 4. 权限与按钮

- 页面/菜单权限：后端菜单管理下发动态路由，前端不改生成逻辑。
- 按钮权限用指令 **`v-auth`**（`src/directive/auth.js`，按 `userInfo.authorityId` 不匹配即移除 DOM）或 `useBtnAuth()`（`route.meta.btns`）；**禁止前端写死"谁能看"**。
- 危险操作（删除、停用、批量）必须 `ElMessageBox.confirm` 二次确认并提示影响范围。
- 新增页面必须在交付说明中给出菜单路径与按钮权限标识。

---

## 5. 反馈与异常

| 场景 | 处理 |
|------|------|
| 加载中 | 全局 loading 由 `request.js` 拦截器统一（>400ms 显示 `ElLoading`）；轮询/静默请求加 `donNotShowLoading: true` |
| 空数据 | `el-empty` 或表格 `empty-text`，禁止空白区域 |
| 请求失败 | 拦截器统一 `ElMessage.error(msg)`，页面补"重试"入口 |
| 成功 | `ElMessage({ type: 'success', message: '操作成功' })`，文案与后端 msg 一致 |
| 无权限 | 提示无权限并隐藏入口 |
| 超时/异步 | 提示处理中，提供刷新/轮询，禁止假装成功 |

---

## 6. 响应式与兼容性

- 主流分辨率 1280×720、1440×900、1920×1080 布局正常；表格允许横向滚动。
- 搜索区/表单区用 `el-row/el-col` 响应式栅格或 UnoCSS（`flex`、`grid`）换行，禁止横向溢出。
- 目标浏览器默认为 Chrome 最新版，不兼容 IE。
- 弹窗高度用 `max-height + 内部滚动`，避免内容溢出屏幕。

---

## 7. 样式规范

- 组件样式一律 `<style scoped>`；布局/间距优先复用既有 `gva-*` 类或 **UnoCSS 原子类**（`uno.config.js`）。
- 全局样式改动（`src/style/`）属 Ask；颜色沿用 Element Plus 主题变量（`--el-color-primary*`），禁止硬编码新色值。
- 格式化按 `.prettierrc`：printWidth 80、2 空格、单引号、无分号、LF。
- 类名语义化，禁止 `div1`、`aaa` 等无意义命名；禁止 `!important` 覆盖框架样式（确有需要需注明并评审）。

---

## 8. 国际化与文案

- 文案统一、简洁，与后端提示一致（如"创建成功"、"删除成功"）。
- 未启用多语言则保持中文，禁止中英混排；若启用多语言，新增文案必须补齐语言包。
- 错误提示不暴露堆栈、SQL、内部错误码等实现细节。

---

## 9. 性能与体验

- 大数据量列表：分页请求，禁止一次渲染上千行；必要时虚拟滚动（Ask 后引入）。
- 搜索输入防抖（300ms 左右），按钮防重复点击，禁止重复请求风暴。
- 图片/附件走后端上传接口，列表展示缩略图，禁止前端直接引用外部图床。
- 非关键组件按需加载；新增重型依赖（图表、编辑器）属 Ask（echarts/wangeditor 已有，直接复用）。

---

## 10. UI 红线

1. 禁止引入第二套 UI 库/图标库/原子化方案；禁止引入与需求无关的重型依赖。
2. 禁止把业务逻辑写进组件（组件只负责展示与交互回调）。
3. 禁止 `console.log` 残留、注释掉的大段代码、无编号 TODO。
4. 禁止硬编码色值、接口地址、密钥、权限、枚举含义。
5. 禁止在页面展示未脱敏的手机号、身份证、token 等敏感信息。
6. 禁止"看起来能跑"的假实现（mock 数据未清理、按钮无实际功能）。
