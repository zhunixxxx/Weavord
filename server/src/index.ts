import cors from 'cors'
import express from 'express'
import { resolve } from 'node:path'
import { createWordRepository } from './db/words.js'
import { createImportRouter } from './routes/import.js'
import { createWordsRouter } from './routes/words.js'

const PORT = Number(process.env.PORT) || 3001
const DB_PATH =
  process.env.DATABASE_PATH ?? resolve(process.cwd(), 'data', 'weavord.db')

const repo = createWordRepository(DB_PATH)
const app = express()

app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, database: DB_PATH })
})

app.use('/api/words', createWordsRouter(repo))
app.use('/api/import', createImportRouter())

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err)
    const message = err instanceof Error ? err.message : '服务器内部错误'
    res.status(500).json({ error: message })
  },
)

const server = app.listen(PORT, () => {
  console.log(`Weavord API 运行于 http://localhost:${PORT}`)
  console.log(`数据库: ${DB_PATH}`)
})

function shutdown() {
  server.close()
  repo.close()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
