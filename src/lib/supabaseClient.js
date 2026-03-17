import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tzdojwdoboenumyftkit.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6ZG9qd2RvYm9lbnVteWZ0a2l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2ODk4NzUsImV4cCI6MjA4OTI2NTg3NX0.hSIk--biAQoK33UnHsJKFXs11y2GPdHVrtWk_qPP6_I'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
