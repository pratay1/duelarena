import { z } from 'zod'

export const profileSchema = z.object({
  username: z.string().min(3).max(30),
  avatar_url: z.string().url().optional().nullable(),
})

export const matchSchema = z.object({
  player2_id: z.string().uuid().optional().nullable(),
  category_id: z.string().uuid(),
})

export const playerAnswerSchema = z.object({
  round_id: z.string().uuid(),
  answer_id: z.string().uuid(),
  response_time_ms: z.number().int().min(0).max(30000),
})

export const categorySchema = z.object({
  name: z.string().min(1).max(50),
  icon: z.string().min(1).max(30),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
})

export const friendshipSchema = z.object({
  friend_id: z.string().uuid(),
})

export const uuidSchema = z.string().uuid()

export function validateMatchCreation(data: unknown) {
  return matchSchema.safeParse(data)
}

export function validateProfileUpdate(data: unknown) {
  return profileSchema.safeParse(data)
}

export function validatePlayerAnswer(data: unknown) {
  return playerAnswerSchema.safeParse(data)
}

export function validateUUID(id: string) {
  return uuidSchema.safeParse(id)
}