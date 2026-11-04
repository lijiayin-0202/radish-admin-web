# 00｜权限矩阵、常用命令与交付清单（Web）

> 归属总纲：[AGENT.MD](../AGENT.MD)
> 作用：文件修改权限（Always / Ask / Never）、本仓库**真实可用**的命令、AI 交付前 DoD 检查清单

---

## 1. 文件权限矩阵

| 类别 | 范围 | 权限 |
|------|------|------|
| Always | `src/view/<业务>/` 页面、`src/api/<业务域>.js`、业务内子组件、配套测试 | 直接修改 |
| Ask | 新增 npm 依赖、`src/utils/request.js`、`src/permission.js`、`src/view/layout/`、`src/core/`、全局公共组件（`src/components/**`）、`src/directive/`、`src/pinia/modules/`、构建与配置（`vite.config.js`、`uno.config.js`、`eslint.config.mjs`、`.env.*`、`vitePlugin/`） | 先询问确认 |
| Never | `src/core/` 底盘、`src/permission.js` 路由守卫核心、`src/pinia/modules/user.js` 与 `router.js`、生产环境变量与密钥 | 禁止修改 |

> 说明：`src/view/layout/` 是布局（`aside`/`header`/`tabs`/`setting`），改它等于改框架外观，走 Ask。

---

## 2. 常用命令（以 `package.json` 为准）

```bash
npm install              # 安装依赖（提交时同步 package-lock.json）
npm run dev              # 本地开发（8080，会先跑 openDocument.js 打开文档页）
npm run serve            # 同 dev
npm run build            # 生产构建（vite build --mode production，必须成功）
npm run preview          # 预览构建产物
npm run limit-build      # 内存不足时的构建兜底
npx eslint .             # 代码检查（仓库没有 lint 脚本，规则在 eslint.config.mjs）
```

- **不存在 `npm run lint` / `npm run format`**：不要写进文档或 PR 描述；格式化按 `.prettierrc`（printWidth 80、2 空格、单引号、无分号、LF）。
- 端口与环境：`.env.development` → `VITE_CLI_PORT=8080`、`VITE_SERVER_PORT=8888`、`VITE_BASE_API=/api`、`VITE_BASE_PATH=http://127.0.0.1`；`vite.config.js` 把 `/api` 代理到 `8888`。
- **`.env.*` 只放前端端口与 GVA 后台地址**：**禁止写入 Kratos 微服务地址、DB / Kafka / pgvector 地址、密钥**；请求封装 baseURL 只指向 GVA 后台（见 `.agent/01 §2`、`.agent/06 §7`）。

---

## 3. AI 交付前检查清单（DoD，逐条勾选后才能说"完成"）

- [ ] 未改动框架底盘（`src/core/`、`src/utils/request.js`、`src/permission.js`、`src/view/layout/`、`pinia/modules/{user,router}.js`）
- [ ] 骨架由代码生成器（autoCode / formCreate）产出，人工改动仅落在业务层
- [ ] 接口统一 `import service from '@/utils/request'`，url **不带 `/api` 前缀**，成功判定 `res.code === 0`
- [ ] 分页传 `page/pageSize`，取 `data.list/total/page/pageSize`，无前端硬编码枚举
- [ ] 页面写了 `defineOptions({ name: 'Xxx' })`，列表页沿用 `gva-table-box` 骨架
- [ ] 时间/布尔/字典分别用 `formatDate`、`formatBoolean`、`getDict/filterDict`，未自造格式化函数
- [ ] 按钮权限用 `v-auth` 或 `useBtnAuth()`，未写死权限
- [ ] 未新增无关依赖（`package.json` 与锁文件同步），未新增无关全局组件/工具
- [ ] 环节 1 本地：`npx eslint .`、`npm run build`、`npm run dev` 全通过
- [ ] 环节 2 接口：Apipost 接口核对通过（含异常与边界）
- [ ] 环节 3 页面：浏览器 Console/Network 无报错，功能闭环
- [ ] 环节 4 回归：回归测试通过
- [ ] 测试流已执行一轮：4 环节全绿、项目可正常启动、页面链路无报错（多轮回归按需自测，非阻断）
- [ ] 前端未直连 Kratos 微服务；代码、`.env.*`、请求封装中**无微服务 / DB / Kafka / pgvector 地址**，金额/时间/状态枚举取后端返回值
- [ ] 未编造接口/字段；菜单与权限配置已同步说明
- [ ] 变更文件清单已输出，commit 按 `[类型] [版本号] [编号] 描述` 拆分提交
- [ ] 业务代码均在非 `main` 分支，PR 描述齐全
