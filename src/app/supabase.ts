/**
 * Supabase client — the one network dependency, used only for optional sign-in
 * and progress sync. Anonymous/offline use never touches it.
 *
 * These values are public by design: the publishable key and project URL are
 * meant to ship in client code. Row-Level Security is the real boundary — every
 * row is readable/writable only by its signed-in owner — so committing them is
 * safe. Rotate anytime from the Supabase dashboard.
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://izonygtbxzwufxptsbid.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_XtADANR1aR4wAQRK1RvAFA_AgrNSU5p'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
