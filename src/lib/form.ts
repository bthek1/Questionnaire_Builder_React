import type { ValidationError } from '@tanstack/react-form'

/** Validates that a string field is not empty. */
export function required(value: string): ValidationError {
  return !value?.trim() ? 'This field is required' : undefined
}

/** Validates a string field has a minimum length. */
export function minLength(min: number) {
  return (value: string): ValidationError =>
    value.trim().length < min ? `Must be at least ${min} characters` : undefined
}

/** Validates a string field does not exceed a maximum length. */
export function maxLength(max: number) {
  return (value: string): ValidationError =>
    value.trim().length > max ? `Must be at most ${max} characters` : undefined
}

/** Composes multiple validators — returns the first error encountered. */
export function compose<T>(
  ...validators: Array<(value: T) => ValidationError>
): (value: T) => ValidationError {
  return (value: T) => {
    for (const validator of validators) {
      const error = validator(value)
      if (error) return error
    }
    return undefined
  }
}
