import { createContext } from 'react'

import type { AuthContextValue } from '@/types/auth'

/**
 * Kept in its own module (no components) so React Fast Refresh stays reliable.
 * Consume it through the `useAuth` hook rather than `useContext` directly.
 */
export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
