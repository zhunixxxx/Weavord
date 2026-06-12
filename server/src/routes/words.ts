import { Router } from 'express'
import type { WordInput } from '../types/word.js'
import type { WordRepository } from '../db/words.js'

export function createWordsRouter(repo: WordRepository) {
  const router = Router()

  router.get('/', (_req, res) => {
    res.json(repo.getAllWords())
  })

  router.get('/stats', (_req, res) => {
    res.json(repo.getStats())
  })

  router.get('/:id', (req, res) => {
    const word = repo.getWord(req.params.id)
    if (!word) {
      res.status(404).json({ error: '单词不存在' })
      return
    }
    res.json(word)
  })

  router.post('/import', (req, res) => {
    const body = req.body as { words?: WordInput[] }
    if (!Array.isArray(body.words)) {
      res.status(400).json({ error: '请求体需包含 words 数组' })
      return
    }
    const result = repo.addWords(body.words)
    res.status(201).json(result)
  })

  router.patch('/:id', (req, res) => {
    const updated = repo.updateWord(req.params.id, req.body)
    if (!updated) {
      res.status(404).json({ error: '单词不存在或无可更新字段' })
      return
    }
    res.json(repo.getWord(req.params.id))
  })

  router.post('/:id/review', (req, res) => {
    const { correct } = req.body as { correct?: boolean }
    if (typeof correct !== 'boolean') {
      res.status(400).json({ error: 'correct 字段必须为 boolean' })
      return
    }
    const result = repo.recordReview(req.params.id, correct)
    if (!result) {
      res.status(404).json({ error: '单词不存在' })
      return
    }
    res.json(result)
  })

  router.post('/:id/master', (req, res) => {
    const ok = repo.markWordAsMastered(req.params.id)
    if (!ok) {
      res.status(404).json({ error: '单词不存在或已是熟词' })
      return
    }
    res.json(repo.getWord(req.params.id))
  })

  router.delete('/:id/master', (req, res) => {
    const ok = repo.unmarkWordAsMastered(req.params.id)
    if (!ok) {
      res.status(404).json({ error: '单词不存在或不是熟词' })
      return
    }
    res.json(repo.getWord(req.params.id))
  })

  router.delete('/', (_req, res) => {
    const deleted = repo.deleteAllWords()
    res.json({ deleted })
  })

  router.delete('/:id', (req, res) => {
    const ok = repo.deleteWord(req.params.id)
    if (!ok) {
      res.status(404).json({ error: '单词不存在' })
      return
    }
    res.status(204).end()
  })

  return router
}
