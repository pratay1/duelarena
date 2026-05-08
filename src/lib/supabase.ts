import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

export function handleSupabaseError(error: unknown): { code: string; message: string; hint?: string; details?: string } {
  if (error && typeof error === 'object' && 'code' in error) {
    return {
      code: (error as Record<string, unknown>).code as string,
      message: (error as Record<string, unknown>).message as string,
      hint: (error as Record<string, unknown>).hint as string | undefined,
      details: (error as Record<string, unknown>).details as string | undefined,
    }
  }
  return {
    code: 'UNKNOWN_ERROR',
    message: error instanceof Error ? error.message : 'An unknown error occurred',
  }
}

export function isUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

export function validateOwnership(userId: string, resourceUserId: string): boolean {
  return userId === resourceUserId
}