/**
 * UnlockToast — a small celebration when a new Koch character is unlocked.
 * Auto-dismisses; the character it announces is new to the learner's ear.
 */
import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'

interface UnlockToastProps {
  char: string | null
  onDismiss: () => void
}

export function UnlockToast({ char, onDismiss }: UnlockToastProps) {
  useEffect(() => {
    if (!char) return
    const t = setTimeout(onDismiss, 2600)
    return () => clearTimeout(t)
  }, [char, onDismiss])

  return (
    <AnimatePresence>
      {char && (
        <motion.div
          className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 font-mono text-sm text-accent"
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
        >
          new character unlocked — <span className="font-bold">{char}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
