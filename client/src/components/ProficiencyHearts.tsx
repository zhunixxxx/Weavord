import { MAX_PROFICIENCY } from '../types/word'

interface ProficiencyHeartsProps {
  proficiency: number
  previous?: number
  className?: string
}

function HeartIcon({ filled, dimmed }: { filled: boolean; dimmed?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.75"
      className={`h-7 w-7 transition-colors ${
        filled
          ? dimmed
            ? 'text-rose-300'
            : 'text-rose-500'
          : 'text-slate-300'
      }`}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      />
    </svg>
  )
}

export default function ProficiencyHearts({
  proficiency,
  previous,
  className = '',
}: ProficiencyHeartsProps) {
  const level = Math.max(0, Math.min(MAX_PROFICIENCY, proficiency))
  const changedIndex =
    previous != null && previous !== level
      ? Math.min(previous, level)
      : -1

  return (
    <div
      className={`flex items-center justify-center gap-1 ${className}`}
      role="img"
      aria-label={`熟练度 ${level}，满分 ${MAX_PROFICIENCY}`}
    >
      {Array.from({ length: MAX_PROFICIENCY }, (_, i) => {
        const filled = i < level
        const dimmed = changedIndex === i && previous != null && previous > level
        return <HeartIcon key={i} filled={filled} dimmed={dimmed} />
      })}
    </div>
  )
}
