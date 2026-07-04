/**
 * FeedbackReveal — the instant after an answer.
 * Correct: the character pops in green (reinforces sound → letter, *after* the
 * decode, so it's a reward not a crutch). Miss: reveal the correct character so
 * the learner studies it, with what they typed shown below. Never dots/dashes.
 */
import { motion } from 'motion/react'
import type { AnswerResult } from '@/core/trainer/types'
import { useT } from '@/i18n'

interface FeedbackRevealProps {
  result: AnswerResult
}

export function FeedbackReveal({ result }: FeedbackRevealProps) {
  const t = useT()
  const correct = result.correct
  return (
    <motion.div
      className="flex flex-col items-center gap-4"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      <div
        className={`grid h-40 w-40 place-items-center rounded-full border ${
          correct ? 'border-accent/40 bg-accent/10' : 'border-error/40 bg-error/10'
        }`}
      >
        <span
          className={`font-mono text-7xl font-bold ${
            correct ? 'text-accent' : 'text-error'
          }`}
        >
          {result.expected}
        </span>
      </div>
      {correct ? (
        <p className="font-mono text-sm text-accent">{t('feedback.nice')}</p>
      ) : (
        <p className="font-mono text-sm text-muted">
          {t('feedback.youTypedExpected', {
            got: result.received || '—',
            expected: result.expected,
          })}
        </p>
      )}
    </motion.div>
  )
}
