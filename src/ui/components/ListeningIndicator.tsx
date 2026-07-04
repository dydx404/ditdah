/**
 * ListeningIndicator — shown while a character is playing / awaiting input.
 * A calm pulsing ring, NOT the character. Sound-first: the learner must decode
 * by ear, so we never show the letter (or dots/dashes) here.
 */
import { motion } from 'motion/react'
import { useT } from '@/i18n'

export function ListeningIndicator() {
  const t = useT()

  return (
    <div className="flex flex-col items-center gap-8">
      <motion.div
        className="grid h-40 w-40 place-items-center rounded-full border border-border"
        animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.div
          className="h-24 w-24 rounded-full bg-accent/15"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
      <p className="font-mono text-sm tracking-wide text-muted">
        {t('practice.listeningHint')}
      </p>
    </div>
  )
}
