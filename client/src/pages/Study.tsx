import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MultipleChoice from '../components/study/MultipleChoice'
import SyllableFill from '../components/study/SyllableFill'
import FullDictation from '../components/study/FullDictation'
import { playStudyCompleteFeedback } from '../lib/audio'
import { buildQuestion, pickStudyBatch, type QuizQuestion } from '../lib/study'
import {
  clearStudySession,
  loadStudySession,
  saveStudySession,
  type StudySessionSnapshot,
} from '../lib/studySession'
import { useWordStore } from '../store/words'
import type { StudyMode, Word } from '../types/word'
import { STUDY_MODE_LABELS } from '../types/word'

const MODES: StudyMode[] = [
  'choice-to-meaning',
  'choice-to-word',
  'syllable-fill',
  'full-dictation',
]

export default function StudyPage() {
  const words = useWordStore((s) => s.words)
  const loadWords = useWordStore((s) => s.loadWords)
  const recordReview = useWordStore((s) => s.recordReview)

  const [phase, setPhase] = useState<'setup' | 'study' | 'done'>('setup')
  const [mode, setMode] = useState<StudyMode>('choice-to-meaning')
  const [batchSize, setBatchSize] = useState(10)
  const [batch, setBatch] = useState<typeof words>([])
  const [index, setIndex] = useState(0)
  const [question, setQuestion] = useState<QuizQuestion | null>(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [reviewProficiency, setReviewProficiency] = useState<{
    previous: number
    next: number
  } | null>(null)
  const [awaitingContinue, setAwaitingContinue] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | undefined>()

  useEffect(() => {
    loadWords()
  }, [loadWords])

  useEffect(() => {
    if (words.length === 0 || phase !== 'setup') return
    const saved = loadStudySession()
    if (!saved) return
    restoreSession(saved, words)
  }, [words, phase])

  const persistSession = (
    overrides: Partial<StudySessionSnapshot> & {
      mode: StudyMode
      batch: Word[]
      index: number
      score: { correct: number; total: number }
    },
  ) => {
    saveStudySession({
      mode: overrides.mode,
      batchIds: overrides.batch.map((w) => w.id),
      index: overrides.index,
      score: overrides.score,
      awaitingContinue: overrides.awaitingContinue ?? awaitingContinue,
      selectedAnswer: overrides.selectedAnswer ?? selectedAnswer,
      reviewProficiency: overrides.reviewProficiency ?? reviewProficiency,
    })
  }

  const restoreSession = (saved: StudySessionSnapshot, wordList: Word[]) => {
    const restoredBatch = saved.batchIds
      .map((id) => wordList.find((w) => w.id === id))
      .filter((w): w is Word => w != null)
    if (restoredBatch.length === 0) {
      clearStudySession()
      return
    }

    setMode(saved.mode)
    setBatch(restoredBatch)
    setIndex(saved.index)
    setScore(saved.score)
    setAwaitingContinue(saved.awaitingContinue)
    setSelectedAnswer(saved.selectedAnswer)
    setReviewProficiency(saved.reviewProficiency ?? null)
    setQuestion(buildQuestion(restoredBatch[saved.index], wordList, saved.mode))
    setPhase('study')
  }

  const startStudy = () => {
    if (words.length === 0) return
    const selected = pickStudyBatch(words, batchSize)
    if (selected.length === 0) return
    clearStudySession()
    setBatch(selected)
    setIndex(0)
    setScore({ correct: 0, total: 0 })
    setReviewProficiency(null)
    setAwaitingContinue(false)
    setSelectedAnswer(undefined)
    setQuestion(buildQuestion(selected[0], words, mode))
    setPhase('study')
  }

  const advanceToNext = (newScore: { correct: number; total: number }) => {
    const nextIndex = index + 1
    if (nextIndex >= batch.length) {
      clearStudySession()
      playStudyCompleteFeedback()
      setPhase('done')
      setQuestion(null)
      setReviewProficiency(null)
      setAwaitingContinue(false)
      setSelectedAnswer(undefined)
      return
    }

    setIndex(nextIndex)
    setReviewProficiency(null)
    setAwaitingContinue(false)
    setSelectedAnswer(undefined)
    setQuestion(buildQuestion(batch[nextIndex], words, mode))
    persistSession({
      mode,
      batch,
      index: nextIndex,
      score: newScore,
      awaitingContinue: false,
      selectedAnswer: undefined,
      reviewProficiency: null,
    })
  }

  const handleAnswer = async (correct: boolean, wrongSelected?: string) => {
    const current = batch[index]
    const result = await recordReview(current.id, correct)
    const newScore = {
      correct: score.correct + (correct ? 1 : 0),
      total: score.total + 1,
    }
    setScore(newScore)

    const isChoice = mode === 'choice-to-meaning' || mode === 'choice-to-word'
    if (!correct && isChoice) {
      const prof = result
        ? { previous: result.previous, next: result.proficiency }
        : null
      setReviewProficiency(prof)
      setAwaitingContinue(true)
      setSelectedAnswer(wrongSelected)
      persistSession({
        mode,
        batch,
        index,
        score: newScore,
        awaitingContinue: true,
        selectedAnswer: wrongSelected,
        reviewProficiency: prof,
      })
      return
    }

    advanceToNext(newScore)
  }

  const handleChoiceContinue = () => {
    advanceToNext(score)
  }

  const handleViewWordCard = (answer: string) => {
    setSelectedAnswer(answer)
    persistSession({
      mode,
      batch,
      index,
      score,
      awaitingContinue: true,
      selectedAnswer: answer,
      reviewProficiency,
    })
  }

  if (words.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center">
        <p className="text-slate-600">还没有单词可以背诵</p>
        <Link
          to="/import"
          className="mt-4 inline-block rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white"
        >
          去导入单词
        </Link>
      </div>
    )
  }

  if (phase === 'done') {
    const pct = Math.round((score.correct / score.total) * 100)
    return (
      <div className="mx-auto max-w-md space-y-6 text-center">
        <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-indigo-700 p-8 text-white">
          <p className="text-lg opacity-90">本轮完成 🎉</p>
          <p className="mt-4 text-5xl font-bold">{pct}%</p>
          <p className="mt-2 text-brand-100">
            {score.correct} / {score.total} 正确
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={startStudy}
            className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
          >
            再来一轮
          </button>
          <button
            type="button"
            onClick={() => setPhase('setup')}
            className="rounded-xl bg-slate-100 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-200"
          >
            更换模式
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'study' && question) {
    const progress = ((index + 1) / batch.length) * 100
    const isChoice = mode === 'choice-to-meaning' || mode === 'choice-to-word'

    return (
      <div className="mx-auto max-w-xl space-y-4">
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500 sm:mb-2 sm:text-sm">
            <span>{STUDY_MODE_LABELS[mode]}</span>
            <span>
              {index + 1} / {batch.length}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-brand-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {isChoice && (
          <MultipleChoice
            key={`${index}-${question.word.id}`}
            question={question}
            mode={mode}
            onAnswer={handleAnswer}
            onContinue={handleChoiceContinue}
            reviewProficiency={reviewProficiency}
            onViewWordCard={handleViewWordCard}
            restoredWrong={
              awaitingContinue && selectedAnswer
                ? { selected: selectedAnswer }
                : undefined
            }
          />
        )}
        {mode === 'syllable-fill' && (
          <SyllableFill key={`${index}-${question.word.id}`} question={question} onAnswer={handleAnswer} />
        )}
        {mode === 'full-dictation' && (
          <FullDictation key={`${index}-${question.word.id}`} question={question} onAnswer={handleAnswer} />
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">背单词</h2>
        <p className="mt-1 text-slate-500">西语单词，答对提升熟练度，选择题答错降低熟练度</p>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">练习模式</h3>
        <div className="grid gap-2">
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-2xl px-4 py-3.5 text-left text-sm font-medium transition-all ${
                mode === m
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-brand-300'
              }`}
            >
              {STUDY_MODE_LABELS[m]}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">
          本轮题数：{batchSize}
        </h3>
        <input
          type="range"
          min={5}
          max={Math.min(50, words.length)}
          value={batchSize}
          onChange={(e) => setBatchSize(Number(e.target.value))}
          className="w-full accent-brand-600"
        />
        <div className="flex justify-between text-xs text-slate-400">
          <span>5</span>
          <span>{Math.min(50, words.length)}</span>
        </div>
      </section>

      <button
        type="button"
        onClick={startStudy}
        className="w-full rounded-2xl bg-brand-600 py-4 text-base font-bold text-white shadow-lg transition-colors hover:bg-brand-700"
      >
        开始背诵
      </button>
    </div>
  )
}
