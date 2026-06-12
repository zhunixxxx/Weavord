# Weavord — 中英日西混背

响应式 Web 应用，用于批量导入、管理与背诵中/英/日/西多语言单词。词库数据持久化在后端 SQLite 数据库中。

## 项目结构

```
Weavord/
├── client/          # 前端（Vite + React + TypeScript）
├── server/          # 后端（Express + SQLite）
├── package.json     # 根目录编排脚本
└── README.md
```

## 功能

- **批量导入**：Markdown 表格录入中/英/日/西四语释义，支持音标、例句
- **单词表**：多语言释义展示，按首字母、日期、熟练度排序
- **四种背诵模式**：
  - 看单词选释义
  - 看释义选单词
  - 关键音节填空 / 完全默写
- **字典详情**：四语释义卡片、发音（Web Speech API）、例句

## 环境要求

- Node.js >= 18（推荐 20+）
- 后端依赖 `better-sqlite3` 原生模块，需与当前 Node 版本匹配

## 快速开始

需要同时启动后端 API 与前端开发服务器：

```bash
npm run install:all
npm start
```

或分别在两个终端运行：

```bash
npm run dev:server   # API http://localhost:3001
npm run dev:client   # 前端 http://localhost:5173
```

浏览器打开 `http://localhost:5173`。前端通过 Vite 代理将 `/api` 请求转发到后端。

## 后端 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/words` | 获取全部单词 |
| GET | `/api/words/stats` | 统计（总数、熟词、今日已背） |
| GET | `/api/words/:id` | 获取单个单词 |
| POST | `/api/words/import` | 批量导入 `{ words: [...] }` |
| PATCH | `/api/words/:id` | 更新单词 |
| POST | `/api/words/:id/review` | 记录复习 `{ correct: boolean }` |
| POST | `/api/words/:id/master` | 标记为熟词 |
| DELETE | `/api/words/:id` | 删除单词 |
| DELETE | `/api/words` | 清空词库 |

数据库文件默认位于 `server/data/weavord.db`，可通过环境变量 `DATABASE_PATH` 修改。

## 导入格式

### Markdown 表格（单词书）

```markdown
# 📙 Libro de Vocabulario en Español

| 单词/短语 | 音标 | 英语 | 日语 | 释义 | 简单例句 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Buenos días** | [ˈbwenos ˈði.as] | Good morning | おはよう | 早上好 | Buenos días, ¿cómo estás? |
```

自动识别表头列名；文档标题含 Español/西班牙语 时默认识别为西语。`[音标]` 会自动转为 `/音标/` 格式。

### Markdown 管道符

```markdown
# 英语
apple | 苹果 | /ˈæp.əl/ | An apple a day. | 一天一苹果。 | ap

# 西班牙语
hola | 你好
```

字段：`单词 | 中文释义 | 音标 | 例句 | 例句翻译 | 关键音节`（后四项可选）

### CSV

```csv
word,translation,language,pronunciation,example,exampleTranslation,keySyllables
apple,苹果,en,/ˈæp.əl/,,,
hola,你好,es,,,,
```

## 技术栈

- **client/**：Vite + React + TypeScript、Tailwind CSS、Zustand、React Router
- **server/**：Express + SQLite（better-sqlite3）

## 打包为 iOS（后续）

```bash
npm run build
cd client && npx cap add ios
cd client && npx cap sync ios
cd client && npx cap open ios
```

## 构建

```bash
npm run build          # 仅前端
npm run build:server   # 仅后端
npm run build:all      # 前后端
npm run preview        # 预览前端构建产物
```

## 常见问题

**后端报错 `better-sqlite3` / `NODE_MODULE_VERSION`**

原生模块是用别的 Node 版本编译的（例如切换了 nvm 版本）。在项目根目录执行：

```bash
npm run rebuild:native
```

然后重新 `npm start`。
