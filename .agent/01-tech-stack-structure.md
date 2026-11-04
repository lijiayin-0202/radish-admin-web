# 01｜技术栈与工程结构（Web）

> 归属总纲：[AGENT.MD](../AGENT.MD)
> 适用范围：`radish-admin-web`（gin-vue-admin 2.9.2 前端）及其对接的后端体系

---

## 1. 前端技术栈（唯一口径，版本以 `package.json` 为准）

| 维度 | 选型 | 说明 | 禁止事项 |
|------|------|------|----------|
| 框架 | **Vue 3.5 + Vite 8** | `<script setup>` 组合式 API；项目为 JavaScript（`jsconfig.json`，无 TS 依赖） | 禁止擅自改造为 TS/其他框架；禁止新页面混用 Options API |
| UI 库 | **Element Plus 2.13** | 唯一组件库（表格、表单、弹窗、消息、上传） | 禁止引入第二套 UI 库；禁止手写与 Element 重复的组件 |
| 原子化样式 | **UnoCSS**（`uno.config.js`） | 与 scoped 样式并存，用于间距/布局类 | 禁止引入 Tailwind 等第二套原子化方案 |
| 状态 | **Pinia 2** | `src/pinia/modules/`：`app`、`user`、`router`、`dictionary`、`params` | 禁止 localStorage 存业务状态；禁止跨模块直接改写他人 store |
| 路由 | **Vue Router 4** | 静态路由 + 后端菜单下发动态路由（守卫在 `src/permission.js`） | 禁止前端写死业务权限路由 |
| 请求 | **`src/utils/request.js`**（axios 1.8.2 单例，默认导出 `service`） | 统一 baseURL、x-token/x-user-id、loading、错误提示、401 跳转 | 禁止各自 `axios.create`；禁止页面里裸 fetch |
| 图标 | `@element-plus/icons-vue`、`@iconify/vue` + 自动 SVG（`src/assets/icons/`、`src/plugin/`） | 列表按钮常用 `icon="plus"` 字符串写法 | 禁止引入第二套图标库 |
| 富文本/图表 | `@wangeditor/editor-for-vue`、`echarts 5` + `vue-echarts` | 已有依赖，直接复用 | 禁止新增同类重型依赖（Ask） |
| 规范 | ESLint（`eslint.config.mjs`）+ Prettier（`.prettierrc`） | 提交前 `npx eslint .` 通过 | 禁止大面积 `--fix` 污染无关文件 |

---

## 2. 后端全景（前端只消费，不实现）

| 层 | 选型 | 前端如何对接 |
|----|------|--------------|
| 管理后台 | **gin-vue-admin（GVA）** | 业务接口，返回 `{ code, data, msg }`，成功 `code === 0` |
| 微服务 | **Kratos** | 订单/行程/司机等明细由后台转发，**前端禁止直连微服务地址** |
| 数据库 | **PostgreSQL** | 前端不直连；时间、金额、枚举以后端返回为准 |
| 向量库 | **PostgreSQL + pgvector** | AI/相似检索结果由后端返回 `score`，前端只做展示与排序 |
| 消息队列 | **Kafka** | 异步任务（导出、向量化、通知）为最终一致，前端需状态轮询/刷新入口 |

**关键约束**
1. 前端只与 GVA 后台接口交互；**Kratos 微服务地址、DB、Kafka、pgvector 地址禁止出现在前端代码、环境配置（`.env.*`）与请求封装（`src/utils/request.js`）中**——出现即阻断（回退整改）。
2. 异步链路（Kafka）不能假设"提交即完成"：提交后展示处理中，提供刷新/轮询入口。
3. 金额、时间、状态枚举一律展示后端返回值，禁止前端二次计算或自造字典。

---

## 3. 前端工程结构（真实目录）

```
radish-admin-web/
├─ src/
│  ├─ api/            # 接口：一个业务域一个文件（customer.js、cs.js…）
│  ├─ assets/         # 图片与 icons（svg 由 vite-auto-import-svg 自动注册）
│  ├─ components/     # 公共组件：warningBar、selectImage、upload、exportExcel、richtext、charts…
│  ├─ config/         # external-links.js 等常量配置
│  ├─ core/           # 框架底盘（config.js、global.js、gin-vue-admin.js、error-handel.js）— Never
│  ├─ directive/      # auth.js（v-auth 按钮权限）、clickOutSide.js
│  ├─ hooks/          # charts.js、responsive.js、use-windows-resize.js
│  ├─ pinia/modules/  # app、user、router、dictionary、params
│  ├─ plugin/         # 插件（announcement、auto、email），各自 api/form/view
│  ├─ router/         # index.js（静态路由）
│  ├─ style/          # main.scss、reset.scss、element 主题
│  ├─ utils/          # request.js、format.js、date.js、dictionary.js、btnAuth.js、image.js…
│  ├─ view/           # 页面：about、dashboard、error、example、init、layout、login、
│  │                  #      person、superAdmin、system、systemTools
│  ├─ App.vue / main.js
│  ├─ permission.js   # 路由守卫（Never）
│  └─ pathInfo.json   # 组件名映射（vitePlugin/componentName 自动生成）
├─ public/            # 静态资源
├─ vitePlugin/        # componentName、secret
├─ vite.config.js     # 别名 @ → src、/api 代理、UnoCSS、svg、Banner
├─ uno.config.js      # UnoCSS 配置
├─ eslint.config.mjs  # ESLint flat config
├─ .prettierrc        # 格式化规则
├─ .env.development / .env.production
└─ package.json
```

**别名**：`@` → `src`（`vite.config.js` 中定义），一律用 `@/api/xxx`、`@/utils/request`，禁止深层相对路径 `../../../`。

---

## 4. 环境变量与代理

`.env.development`（真实值）：

```dotenv
ENV = 'development'
VITE_CLI_PORT = 8080          # 前端端口
VITE_SERVER_PORT = 8888       # 后端端口
VITE_BASE_API = /api          # 请求 baseURL + 代理前缀
VITE_FILE_API = /api          # 文件/上传接口前缀
VITE_BASE_PATH = http://127.0.0.1
```

- `src/utils/request.js` 中 `config.baseURL = import.meta.env.VITE_BASE_API`，因此 **api 文件的 url 不带 `/api`**（例：`url: '/cs/ticket/list'`）。
- `vite.config.js` 把 `/api` 代理到 `VITE_BASE_PATH:VITE_SERVER_PORT`，并 rewrite 掉前缀；`/plugin` 代理到插件市场。
- 变量必须 `VITE_` 前缀，禁止硬编码域名/密钥；改环境变量与代理属 **Ask**。

---

## 5. 模块落位示例（以客服模块为例）

```
src/api/cs.js                       # getCsTicketList / createCsTicket …
src/view/cs/ticket.vue              # 工单列表（生成器产物风格：列表 + 抽屉表单同页）
src/view/cs/session.vue
src/view/cs/faq.vue
```

- 生成器（autoCode）产物为 `src/view/<模块>/<资源>.vue` 单文件（列表 + `el-drawer` 表单）；需拆分时用 `index.vue` + `form.vue`。
- 菜单在后端**系统管理 → 菜单管理**配置，`component` 指向页面路径；前端不改动态路由生成逻辑。

---

## 6. 依赖管理

- 新增 npm 依赖属 **Ask**：优先复用既有依赖（axios、element-plus、pinia、vue-router、echarts、@vueuse/core、wangeditor、form-create、vform3-builds、vue-echarts…）。
- 禁止引入与选型冲突的库（第二套 UI 库、第二套状态库、另一套 HTTP 客户端、Tailwind）。
- 版本与锁文件：`package.json` 与 `package-lock.json` 必须同时提交，禁止只改其一。

---

## 7. 工程结构红线

1. 新业务模块只新增目录/文件，**不得重排既有目录结构**。
2. 底盘（`src/core/`、`src/utils/request.js`、`src/permission.js`、`src/view/layout/`）只在框架类分支修改，且单独 PR。
3. 业务模块之间不得互相引用对方页面私有组件；可复用部分上升到 `src/components/` 评审后再下沉。
4. 禁止在 `src/` 根目录堆砌业务文件；所有页面必须落在 `src/view/<模块>/` 下。
5. 与后端同名的字段、枚举、状态必须保持一致，任何不一致先找后端确认，禁止前端"先兼容一下"。
