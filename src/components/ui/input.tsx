import * as React from 'react'

import { cn } from '@/utils/cn'
import { resolveEditableDir } from '@/utils/text-dir'

const LTR_INPUT_TYPES = new Set([
  'email',
  'tel',
  'url',
  'number',
  'date',
  'time',
  'datetime-local',
  'month',
  'week',
])

function isEmptyInputValue(value: React.ComponentProps<'input'>['value']): boolean {
  return value === undefined || value === null || String(value) === ''
}

function resolveInputDir(
  type: React.HTMLInputTypeAttribute | undefined,
  dir: React.ComponentProps<'input'>['dir'],
  isEmpty: boolean,
): React.ComponentProps<'input'>['dir'] {
  if (dir === 'ltr' || dir === 'rtl') return dir
  if (type !== undefined && LTR_INPUT_TYPES.has(type)) return 'ltr'
  if (type === undefined || type === 'text' || type === 'search' || type === 'password') {
    return resolveEditableDir(isEmpty, dir)
  }
  return dir
}

function Input({
  className,
  type,
  dir,
  value,
  defaultValue,
  onChange,
  ...props
}: React.ComponentProps<'input'>) {
  const isControlled = value !== undefined
  const [uncontrolledEmpty, setUncontrolledEmpty] = React.useState(() =>
    isEmptyInputValue(defaultValue),
  )
  const isEmpty = isControlled ? isEmptyInputValue(value) : uncontrolledEmpty

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'border-input file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 disabled:bg-input/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1 text-start text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3 md:text-sm',
        className,
      )}
      {...props}
      dir={resolveInputDir(type, dir, isEmpty)}
      {...(isControlled ? { value } : defaultValue === undefined ? {} : { defaultValue })}
      onChange={(event) => {
        if (!isControlled) {
          setUncontrolledEmpty(event.target.value === '')
        }
        onChange?.(event)
      }}
    />
  )
}

export { Input }
