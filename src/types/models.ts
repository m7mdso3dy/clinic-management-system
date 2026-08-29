/**
 * Domain models.
 *
 * Everything here is derived from the database schema so there is a single
 * source of truth. When `database.types.ts` is regenerated, these follow.
 */

import type { Enums, Tables, TablesInsert, TablesUpdate } from '@/types/database.types'

/** Clinic role name from `roles.name`. Built-in values are doctor and secretary. */
export type UserRole = string
export type Gender = Enums<'gender'>
export type EditRequestStatus = Enums<'edit_request_status'>

export type UserProfile = Tables<'profiles'>
export type Role = Tables<'roles'>
export type Patient = Tables<'patients'>
export type Visit = Tables<'visits'>
export type EditRequest = Tables<'edit_requests'>
export type ExaminationType = Tables<'examination_types'>
export type Permission = Tables<'permissions'>
export type RolePermission = Tables<'role_permissions'>

export type PatientInsert = TablesInsert<'patients'>
export type PatientUpdate = TablesUpdate<'patients'>

export type VisitInsert = TablesInsert<'visits'>
export type VisitUpdate = TablesUpdate<'visits'>

export type EditRequestInsert = TablesInsert<'edit_requests'>

export type ExaminationTypeInsert = TablesInsert<'examination_types'>
export type ExaminationTypeUpdate = TablesUpdate<'examination_types'>
