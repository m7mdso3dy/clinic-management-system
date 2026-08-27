/**
 * Domain models.
 *
 * Everything here is derived from the database schema so there is a single
 * source of truth. When `database.types.ts` is regenerated, these follow.
 */

import type { Enums, Tables, TablesInsert, TablesUpdate } from '@/types/database.types'

export type UserRole = Enums<'user_role'>
export type Gender = Enums<'gender'>
export type EditRequestStatus = Enums<'edit_request_status'>

export type UserProfile = Tables<'profiles'>
export type Patient = Tables<'patients'>
export type Visit = Tables<'visits'>
export type EditRequest = Tables<'edit_requests'>

export type PatientInsert = TablesInsert<'patients'>
export type PatientUpdate = TablesUpdate<'patients'>

export type VisitInsert = TablesInsert<'visits'>
export type VisitUpdate = TablesUpdate<'visits'>

export type EditRequestInsert = TablesInsert<'edit_requests'>
