import type { ComponentProps } from 'react'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

interface ProfileTextFieldProps extends ComponentProps<typeof Input> {
  label: string
  error?: { message?: string }
}

/** Ghép Input + label + thông báo lỗi của react-hook-form, dùng lại cho mọi ô text của hồ sơ. */
export default function ProfileTextField({
  label,
  error,
  id,
  ...inputProps
}: ProfileTextFieldProps) {
  const invalid = error ? true : undefined

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} aria-invalid={invalid} {...inputProps} />
      <FieldError errors={[error]} />
    </Field>
  )
}
