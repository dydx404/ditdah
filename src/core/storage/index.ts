import { createProgressStore } from './store'
import type { CreateProgressStore } from './types'

export { CURRENT_SCHEMA_VERSION, createProgressStore } from './store'
export type {
  CharProgress,
  CreateProgressStore,
  Progress,
  ProgressStore,
  Streak,
} from './types'

const createProgressStoreCheck: CreateProgressStore = createProgressStore

void createProgressStoreCheck
