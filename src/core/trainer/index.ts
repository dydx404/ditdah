import { createTrainer } from './trainer'
import type { CreateTrainer } from './types'

export { createTrainer } from './trainer'
export type {
  AnswerResult,
  CharStat,
  CreateTrainer,
  Prompt,
  SessionSummary,
  Trainer,
  TrainerConfig,
} from './types'

const createTrainerCheck: CreateTrainer = createTrainer

void createTrainerCheck
