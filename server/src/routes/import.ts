import { Router } from 'express'
import { convertNotesToMarkdown } from '../lib/smartImport.js'

export function createImportRouter() {
  const router = Router()

  router.post('/smart-convert', async (req, res, next) => {
    try {
      const { notes, apiKey: clientKey } = req.body as {
        notes?: string
        apiKey?: string
      }

      if (!notes?.trim()) {
        res.status(400).json({ error: '请提供待转换的笔记内容' })
        return
      }

      const apiKey = clientKey?.trim() || process.env.DEEPSEEK_API_KEY?.trim()
      if (!apiKey) {
        res.status(400).json({
          error: '未配置 DeepSeek API Key，请在页面填写或在服务端设置 DEEPSEEK_API_KEY',
        })
        return
      }

      const markdown = await convertNotesToMarkdown(notes, apiKey)
      res.json({ markdown })
    } catch (err) {
      next(err)
    }
  })

  return router
}
