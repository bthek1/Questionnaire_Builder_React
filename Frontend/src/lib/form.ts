import type { ValidationError } from '@tanstack/react-form'

/** TanStack Form v1 passes a `{ value, fieldApi, validationSource }` opts object to validators. */
interface ValidatorOpts<T> {
  value: T
}

/** Validates that a string field is not empty. */
export function required({ value }: ValidatorOpts<string>): ValidationError {
  return !value?.trim() ? 'This field is required' : undefined
}

/** Validates a string field has a minimum length. */
export function minLength(min: number) {
  return ({ value }: ValidatorOpts<string>): ValidationError =>
    value.trim().length < min ? `Must be at least ${min} characters` : undefined
}

/** Validates a string field does not exceed a maximum length. */
export function maxLength(max: number) {
  return ({ value }: ValidatorOpts<string>): ValidationError =>
    value.trim().length > max ? `Must be at most ${max} characters` : undefined
}

/** Composes multiple validators — returns the first error encountered. */
export function compose<T>(
  ...validators: Array<(opts: ValidatorOpts<T>) => ValidationError>
): (opts: ValidatorOpts<T>) => ValidationError {
  return (opts: ValidatorOpts<T>) => {
    for (const validator of validators) {
      const error = validator(opts)
      if (error) return error
    }
    return undefined
  }
}
