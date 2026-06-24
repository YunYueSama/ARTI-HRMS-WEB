<div align="center">

<!-- TODO: 在 GitHub 网页编辑器中拖入 ATRI-logo.png，替换下方链接 -->
<img src="https://github.com/user-attachments/assets/47258057-8df9-4bf0-9bfb-dc4a234e3f38" width="120" alt="ATRI Logo" />

# ATRI-HRMS

**基于 AI 的智能人力资源管理系统**

![Vue.js](https://img.shields.io/badge/Vue.js-3-4FC08D?style=flat&logo=vuedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat&logo=vite&logoColor=white)
![Element Plus](https://img.shields.io/badge/Element_Plus-2-409EFF?style=flat&logo=element&logoColor=white)
![ECharts](https://img.shields.io/badge/ECharts-6-AA344D?style=flat&logo=apacheecharts&logoColor=white)
![Pinia](https://img.shields.io/badge/Pinia-3-FAD03C?style=flat&logo=vuedotjs&logoColor=white)

覆盖组织管理、考勤、薪酬、OA 审批、权限配置和数据报表等核心人事场景，集成 AI 智能助手「亚托莉」，支持自然语言查询公司数据与 AI 代理执行操作。

</div>

---

## 系统预览

<!-- TODO: 拖入 首页.png -->
<div align="center">
  <img src="https://github.com/user-attachments/assets/首页" width="900" alt="首页仪表盘" />
</div>

## 核心功能

### AI 智能助手

集成具有独立人格设定的 AI 助手「亚托莉」，支持 Chat / Agent 双模式切换。

<table>
  <tr>
    <td width="50%">
      <!-- TODO: 拖入 chat.png -->
      <img src="https://github.com/user-attachments/assets/chat" width="100%" alt="AI 聊天" />
    </td>
    <td width="50%">
      <!-- TODO: 拖入 agent.png -->
      <img src="https://github.com/user-attachments/assets/agent" width="100%" alt="AI Agent" />
    </td>
  </tr>
  <tr>
    <td align="center"><b>Chat 模式</b><br/>SSE 流式对话，逐字渲染，支持模型切换与反馈</td>
    <td align="center"><b>Agent 模式</b><br/>自然语言触发业务操作，生成执行计划，人工审批后自动执行</td>
  </tr>
</table>

### RAG 知识库与评测

文档上传 + 分块预览 + 语义搜索 + Rerank 精排，支持一键评测（Faithfulness / Relevancy / Precision）。

<table>
  <tr>
    <td width="50%">
      <!-- TODO: 拖入 RAG知识库.png -->
      <img src="https://github.com/user-attachments/assets/RAG知识库" width="100%" alt="RAG 知识库" />
    </td>
    <td width="50%">
      <!-- TODO: 拖入 RAG测评.png -->
      <img src="https://github.com/user-attachments/assets/RAG测评" width="100%" alt="RAG 评测" />
    </td>
  </tr>
</table>

### 知识图谱与 LLM 追踪

ECharts 力导向图可视化实体关系，Langfuse 集成 Token 用量追踪与费用统计。

<table>
  <tr>
    <td width="50%">
      <!-- TODO: 拖入 知识图谱.png -->
      <img src="https://github.com/user-attachments/assets/知识图谱" width="100%" alt="知识图谱" />
    </td>
    <td width="50%">
      <!-- TODO: 拖入 Langfuse-LLM追踪.png -->
      <img src="https://github.com/user-attachments/assets/Langfuse-LLM追踪" width="100%" alt="LLM 追踪" />
    </td>
  </tr>
</table>

### 人事管理

<table>
  <tr>
    <td width="50%">
      <!-- TODO: 拖入 员工管理.png -->
      <img src="https://github.com/user-attachments/assets/员工管理" width="100%" alt="员工管理" />
    </td>
    <td width="50%">
      <!-- TODO: 拖入 薪资记录管理.png -->
      <img src="https://github.com/user-attachments/assets/薪资记录管理" width="100%" alt="薪资管理" />
    </td>
  </tr>
  <tr>
    <td align="center"><b>员工管理</b><br/>列表筛选 + 分页 + CRUD + 移动端自适应</td>
    <td align="center"><b>薪酬管理</b><br/>薪资记录 + 配置 + 多级审批流程</td>
  </tr>
</table>

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3 (Composition API + `<script setup>`) |
| 构建 | Vite 7 |
| UI 库 | Element Plus |
| 状态管理 | Pinia 3 |
| 路由 | Vue Router 4 |
| HTTP | Axios（自动 snake_case ↔ camelCase 转换） |
| 图表 | ECharts 6 (vue-echarts) |
| 样式 | Scoped CSS + CSS Variables + Geist 字体 |

## 功能模块

| 模块 | 功能 |
|------|------|
| **首页仪表盘** | 核心数据卡片、趋势图表、快捷操作、个人考勤 |
| **基础信息** | 员工 / 部门 / 职位 CRUD，树形结构，拖拽排序 |
| **考勤管理** | 打卡记录、请假申请、多级审批链自动匹配 |
| **薪酬管理** | 薪资记录、配置、审批流程（草稿 → 已发放） |
| **权限管理** | 用户 / 角色 / 权限码、身份标签、模块数据范围、审批规则引擎 |
| **AI 智能** | 亚托莉聊天、RAG 知识库、RAG 评测、人设管理、LLM 追踪、知识图谱 |
| **数据报表** | 员工统计、考勤概览、薪资汇总 |

## 快速开始

### 环境要求

- Node.js `^20.19.0 || >=22.12.0`
- npm 9+ 或 pnpm

### 安装与运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:5173

### 配置 API 地址（可选）

创建 `.env.local`，默认代理到 `localhost:8000`：

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### 构建生产版本

```bash
npm run build
```

产物输出到 `dist/` 目录。

## 项目结构

```
src/
├── api/                # API 接口封装
│   ├── client.js       # axios 实例 + 请求/响应拦截器
│   ├── aiChat.js       # AI 聊天（SSE 流式）
│   └── ...             # 各业务模块接口
├── assets/
│   └── main.css        # 全局设计系统（CSS 变量 + 组件样式）
├── components/
│   └── ai/             # AI 聊天面板、Agent 任务面板
├── layout/             # 布局组件（侧边栏、顶栏）
├── router/             # 路由 + 导航守卫
├── stores/             # Pinia 状态管理
├── utils/              # 工具函数
└── views/              # 页面视图
    ├── ai/             # AI 智能模块
    ├── attendance/     # 考勤管理
    ├── base/           # 基础信息
    ├── permission/     # 权限管理
    ├── salary/         # 薪酬管理
    └── Report.vue      # 数据报表
```

## 设计特点

**统一设计系统** — 30+ 语义化 CSS 变量覆盖文本、表面、边框、状态色板，全局一致的 spring 物理缓动与微交互。

**四层权限控制** — 路由守卫 → 菜单过滤 → 按钮级权限 → 数据范围，AI 子模块独立授权。

**SSE 流式输出** — `fetch + ReadableStream` 实现逐字渲染，配合光标闪烁动画增强实时感。

**反馈闭环** — 每条 AI 回复提供 👍/👎 按钮，关联 Langfuse Trace，形成质量监控闭环。

**响应式设计** — 桌面端表格视图 + 移动端卡片视图自动切换，768px / 480px 双断点适配。

## 相关项目

- [ARTI-HRMS-Python](https://github.com/YunYueSama/ARTI-HRMS-Python) — Python 后端服务

## License

MIT
