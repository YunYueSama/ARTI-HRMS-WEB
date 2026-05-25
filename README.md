# ATRI-HRMS — 前端

![Vue.js](https://img.shields.io/badge/Vue.js-3-4FC08D?style=flat&logo=vuedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite&logoColor=white)
![Element Plus](https://img.shields.io/badge/Element_Plus-2-409EFF?style=flat&logo=element&logoColor=white)
![Pinia](https://img.shields.io/badge/Pinia-2-FAD03C?style=flat&logo=vuedotjs&logoColor=white)
![ECharts](https://img.shields.io/badge/ECharts-5-AA344D?style=flat&logo=apacheecharts&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat&logo=axios&logoColor=white)

基于 **Vue 3 + Element Plus + ECharts** 的企业级人力资源管理系统前端，配合 [Python 后端][https://github.com/YunYueSama/ARTI-HRMS-Python] 使用。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3 (Composition API + `<script setup>`) |
| 构建 | Vite 5 |
| UI 库 | Element Plus |
| 状态管理 | Pinia |
| 路由 | Vue Router 4 |
| HTTP | Axios（自动 snake_case ↔ camelCase 转换） |
| 图表 | ECharts 5 (vue-echarts) |
| 样式 | Scoped CSS + CSS Variables |

## 功能页面

### 首页仪表盘

- 核心数据卡片（员工总数、部门数、今日考勤、待审批）
- 趋势图表（员工增长、考勤统计、薪资分布）
- 快捷操作入口

### 基础信息管理

- **员工管理**：列表 + 筛选（部门 / 状态）+ 分页 + CRUD 表单
- **部门管理**：树形结构展示 + 拖拽排序 + CRUD
- **职位管理**：关联部门 + CRUD

### 考勤管理

- 打卡记录列表 + 日期范围筛选
- 请假申请表单（类型 / 时间 / 事由）
- 请假审批工作流（多级审批链自动匹配）

### 薪酬管理

- 薪资记录列表 + 月份筛选
- 薪资配置（基本工资 / 绩效 / 补贴 / 扣款项）
- 审批流程（草稿 → 已提交 → 已审批 → 已发放）

### 权限管理

- 用户 CRUD + 角色分配
- 角色 CRUD + 权限码分配（树形勾选）
- 身份标签管理（员工 / HR / 财务 / 管理员）
- 模块数据范围配置（公司级 / 部门级 / 个人级）
- 审批规则引擎（基于天数条件的动态审批链）

### AI 智能

- **亚托莉聊天**：Chat / Agent 双模式滑动切换
  - Chat 模式：SSE 流式对话，支持知识注入和对话记忆
  - Agent 模式：自然语言触发业务操作，生成执行计划，人工审批后自动执行
  - 侧边栏实时显示模型状态、推理源、备用源连接情况
  - 快捷提问建议面板
- **RAG 知识库**：文档上传 + 分块预览 + 语义搜索 + 文档管理
- **LLM 追踪**：Token 用量趋势 + 费用统计 + 调用链明细
- **知识图谱**：ECharts 力导向图可视化，节点拖拽交互

### 数据报表

- 员工统计（部门分布、入职趋势、在职状态）
- 考勤概览（出勤率、迟到率、请假分布）
- 薪资汇总（部门薪资对比、月度趋势）

## 快速开始

### 1. 环境要求

- Node.js 18+
- npm 9+ 或 pnpm

### 2. 安装依赖

```bash
npm install
```

### 3. 配置 API 地址（可选）

创建 `.env.local`，默认代理到 `localhost:8000`：

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 5. 构建生产版本

```bash
npm run build
```

产物输出到 `dist/` 目录。

## 项目结构

```
src/
├── api/                # API 接口封装
│   ├── client.js       # axios 实例 + 请求/响应拦截器（snake_case 转换）
│   ├── aiChat.js       # AI 聊天相关接口
│   └── ...             # 各业务模块接口
├── assets/             # 静态资源（全局样式）
│   └── main.css        # 全局 CSS 变量 + 基础样式
├── components/         # 公共组件
│   ├── ai/             # AI 聊天面板（AtriChatPanel）、Agent 任务面板
│   └── ...             # 业务公共组件
├── layout/             # 布局组件（MainLayout、侧边栏、顶栏）
├── router/             # 路由配置 + 导航守卫
├── stores/             # Pinia 状态管理
│   ├── user.js         # 用户信息 + 登录状态
│   └── permission.js   # 权限码 + 角色信息
├── utils/              # 工具函数（审批模型、日期格式化等）
├── views/              # 页面视图
│   ├── ai/             # AI 智能（亚托莉、RAG、追踪、图谱）
│   ├── attendance/     # 考勤管理
│   ├── base/           # 基础信息（员工、部门、职位）
│   ├── permission/     # 权限管理
│   ├── report/         # 数据报表
│   └── salary/         # 薪酬管理
├── App.vue
└── main.js
```

## 设计特点

**自动数据格式转换**

axios 拦截器统一处理前后端命名风格差异：
- 请求：前端 camelCase → 后端 snake_case
- 响应：后端 snake_case → 前端 camelCase

业务代码无需手动转换字段名。

**四层权限控制**

- 路由守卫：未登录 / 无权限自动跳转
- 菜单过滤：按角色动态生成侧边栏
- 按钮级权限：`v-if="hasPermission('xxx')"` 细粒度控制
- 数据范围：同一页面不同角色看到不同数据

**AI 双模式**

Chat 聊天和 Agent 代理执行集成在同一面板，通过顶部 Tab 滑动切换，共享聊天历史和输入框。

**组件化 AI 面板**

`AtriChatPanel.vue` 是一个独立组件，通过 props 接收头像配置，可嵌入任意页面。内部封装了消息渲染、SSE 流式接收、历史加载、模型状态监控等逻辑。

## 相关文档

- [项目根 README](../README.md) — 项目总览
- [后端 README](../hrms-python/README.md) — 后端架构和 API 文档

## License

MIT
