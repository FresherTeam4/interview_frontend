import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email là bắt buộc')
    .email('Email không hợp lệ')
    .max(150, 'Email tối đa 150 ký tự'),
  password: z
    .string()
    .min(1, 'Mật khẩu là bắt buộc')
    .min(6, 'Mật khẩu tối thiểu 6 ký tự')
    .max(100, 'Mật khẩu tối đa 100 ký tự'),
})

export const signupSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, 'Họ và tên là bắt buộc')
      .max(150, 'Họ tên tối đa 150 ký tự'),
    email: z
      .string()
      .trim()
      .min(1, 'Email là bắt buộc')
      .email('Email không hợp lệ')
      .max(150, 'Email tối đa 150 ký tự'),
    password: z
      .string()
      .min(1, 'Mật khẩu là bắt buộc')
      .min(6, 'Mật khẩu tối thiểu 6 ký tự')
      .max(100, 'Mật khẩu tối đa 100 ký tự'),
    confirmPassword: z.string().min(1, 'Xác nhận mật khẩu là bắt buộc'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>

export function validateEmail(email: string): string | undefined {
  const res = loginSchema.shape.email.safeParse(email)
  return res.success ? undefined : res.error.issues[0]?.message
}

export function validatePassword(password: string): string | undefined {
  const res = loginSchema.shape.password.safeParse(password)
  return res.success ? undefined : res.error.issues[0]?.message
}

export function validateFullName(fullName: string): string | undefined {
  const res = signupSchema.innerType().shape.fullName.safeParse(fullName)
  return res.success ? undefined : res.error.issues[0]?.message
}

export function validateConfirmPassword(password: string, confirm: string): string | undefined {
  if (!confirm) return 'Mật khẩu xác nhận là bắt buộc'
  if (password !== confirm) return 'Mật khẩu xác nhận không khớp'
  return undefined
}
