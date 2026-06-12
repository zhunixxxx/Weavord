import { useState } from 'react'
import { MAX_PROFICIENCY } from '../types/word'

interface ProficiencyStarsProps {
  proficiency: number
  onChange?: (value: number) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function StarIcon({
  filled,
  preview,
  size,
}: {
  filled: boolean
  preview?: boolean
  size: 'sm' | 'md' | 'lg'
}) {
  const sizeClass =
    size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : 'h-8 w-8'
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled || preview ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.75"
      className={`${sizeClass} transition-colors ${
        filled
          ? 'text-amber-500'
          : preview
            ? 'text-amber-300'
            : 'text-slate-300'
      }`}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2Z"
      />
    </svg>
  )
}

export default function ProficiencyStars({
  proficiency,
  onChange,
  size = 'sm',
  className = '',
}: ProficiencyStarsProps) {
  const level = Math.max(0, Math.min(MAX_PROFICIENCY, proficiency))
  const [hover, setHover] = useState<number | null>(null)
  const interactive = Boolean(onChange)
  const display = hover ?? level
  const gapClass = size === 'lg' ? 'gap-1.5' : 'gap-0.5'

  const handleClick = (value: number) => {
    if (!onChange) return
    onChange(value === level ? 0 : value)
  }

  return (
    <div
      className={`inline-flex items-center ${gapClass} ${className}`}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={interactive ? '设置熟练度' : `熟练度 ${level}，满分 ${MAX_PROFICIENCY}`}
      onMouseLeave={() => setHover(null)}
    >
      {Array.from({ length: MAX_PROFICIENCY }, (_, i) => {
        const starValue = i + 1
        const filled = starValue <= display
        const preview = hover != null && starValue <= hover && starValue > level

        if (interactive) {
          return (
            <button
              key={starValue}
              type="button"
              role="radio"
              aria-checked={starValue === level}
              aria-label={`${starValue} 星`}
              onMouseEnter={() => setHover(starValue)}
              onClick={() => handleClick(starValue)}
              className={`rounded transition-transform hover:scale-110 ${size === 'lg' ? 'p-1' : 'p-0.5'}`}
            >
              <StarIcon filled={filled} preview={preview} size={size} />
            </button>
          )
        }

        return <StarIcon key={starValue} filled={filled} size={size} />
      })}
    </div>
  )
}
