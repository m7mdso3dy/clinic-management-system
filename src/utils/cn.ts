import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges conditional class names and resolves conflicting Tailwind utilities.
 * Required by shadcn/ui components (`aliases.utils` in components.json).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
