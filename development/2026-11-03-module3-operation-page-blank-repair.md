# 模块 3 运营调度页面空白修复记录

## 任务状态

| 阶段 | 状态 |
| --- | --- |
| 开发 | 开发完成 |
| 测试 | 测试通过（定向测试、ESLint） |
| 页面验收 | 待验收 |

## 现象

后台左侧“出行运营 → 运营调度管理”菜单和标签页可以显示，但右侧内容区为空白。

## 根因

菜单高亮但顶部标签仍停留在“首页”，说明菜单路由名没有匹配到可渲染页面。此前实现把页面固定为 `OperationDispatch / trip/operationDispatch`，而菜单登记契约使用 `Module3OperationManagement / module3OperationManagement`。名称或路径不一致时，菜单仍能显示，但点击无法定位页面组件。

## 修复

取消依赖写死标识的静态子路由。动态注册菜单时，识别“运营调度管理”后保留后台传入的路由名称和路径，只覆盖其页面组件：

- 路径：以后台菜单实际路径为准，例如 `module3OperationManagement`
- 路由名：以后台菜单实际名称为准，例如 `Module3OperationManagement`
- 组件：`view/module3/operationManagement.vue`
- 加载方式：Vue 懒加载

不涉及数据库、菜单表、角色权限、后端接口或微服务代码。

## 测试记录

1. 新增菜单契约回归测试，先验证 `Module3OperationManagement / module3OperationManagement` 未被识别，得到预期失败。
2. 实现后执行 `node test/module3Route.test.mjs`：3 项通过、0 项失败。
3. 执行 ESLint：路由入口、权限文件、路由工具与测试文件均无报错。
4. 通过 Vite 开发服务回读：动态菜单组件绑定与页面懒加载入口均已更新。
5. `npm run build` 在当前受限执行环境的 Vite 配置加载阶段被 `spawn EPERM` 阻止；该错误发生在路由代码编译前，未作为构建通过记录。

## 页面验收

待在浏览器重新载入后确认：页面出现“运营区域”“站点管理”两个标签页，且运营区域列表能加载。
