# AGENT.md
萝卜快跑后台管理前端项目规范

## 技术栈
- Vue3 + Vite
- Element Plus
- Pinia
- Axios
- TypeScript

## 分支规范
- main：稳定上线分支，禁止直接提交业务代码
- feature/xxx：新功能分支
- fix/xxx：bug修复分支
- release：发布准备分支

## Commit 提交规范
- feat: 新增功能
- fix: 修复bug
- docs: 修改文档、注释
- style: 仅调整样式、格式，无逻辑改动
- refactor: 代码重构
- chore: 构建、依赖、配置改动

## 开发约定
1. 接口统一放在 api 目录，按模块拆分
2. 页面组件放 views，公共组件放 components
3. 环境变量使用 .env.development / .env.production
4. 提交前 eslint 校验，不要提交console残留代码
5. 请求统一封装，页面不直接写原始 axios 请求
6. 路由统一管理，权限路由由后端菜单动态生成
7. 静态资源放到 assets，常量枚举抽离到 constants
8. 组件命名大驼峰，文件夹使用短横线命名（user-info）

## 权限约定
1. Token 统一存在 Pinia，请求自动携带，过期跳转登录页
2. 页面路由权限、按钮权限，都由后端返回权限标识控制

## 构建命令
- 本地开发：npm run dev
- 生产打包：npm run build
- 打包预览：npm run preview
