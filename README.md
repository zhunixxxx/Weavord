# Weavord — 中英日西混背

响应式 Web 应用，用于批量导入、管理与背诵中/英/日/西多语言单词。数据存储在浏览器本地（IndexedDB），无需后端。

## 功能

- **批量导入**：Markdown 表格录入中/英/日/西四语释义，支持音标、例句
- **单词表**：多语言释义展示，按首字母、日期、熟练度排序
- **四种背诵模式**：
  - 看单词选释义
  - 看释义选单词
  - 关键音节填空 / 完全默写
- **字典详情**：四语释义卡片、发音（Web Speech API）、例句

## 快速开始

```bash
npm install
npm run dev
```

浏览器打开 `http://localhost:5173`。

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

- Vite + React + TypeScript
- Tailwind CSS（响应式，移动端底部导航）
- Dexie（IndexedDB）
- Zustand（状态管理）
- React Router

## 打包为 iOS（后续）

```bash
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```

## 构建

```bash
npm run build
npm run preview
```
