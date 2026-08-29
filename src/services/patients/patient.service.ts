import { getSupabaseClient } from '@/services/supabase/client'
import type { Gender, Patient, PatientInsert, PatientUpdate } from '@/types/models'

export type PatientErrorKind = 'has_visits' | 'unknown'

export class PatientError extends Error {
  readonly kind: PatientErrorKind

  constructor(kind: PatientErrorKind, cause?: unknown) {
    super(kind, cause !== undefined ? { cause } : undefined)
    this.name = 'PatientError'
    this.kind = kind
  }
}

export function isPatientError(error: unknown): error is PatientError {
  return error instanceof PatientError
}

export interface PatientListItem extends Patient {
  lastVisitDate: string | null
  initialDiagnosis: string | null
}

interface VisitSummary {
  visit_date: string
  diagnosis: string | null
}

interface PatientListRow extends Patient {
  visits: VisitSummary[] | null
}

function wrapError(error: { code?: string }): PatientError {
  if (error.code === '23503') {
    return new PatientError('has_visits', error)
  }

  return new PatientError('unknown', error)
}

function toListItem(row: PatientListRow): PatientListItem {
  const visits = [...(row.visits ?? [])].sort((left, right) =>
    left.visit_date.localeCompare(right.visit_date),
  )
  const firstVisit = visits[0]
  const lastVisit = visits[visits.length - 1]

  return {
    id: row.id,
    full_name: row.full_name,
    phone: row.phone,
    date_of_birth: row.date_of_birth,
    gender: row.gender,
    address: row.address,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    lastVisitDate: lastVisit?.visit_date ?? null,
    initialDiagnosis: firstVisit?.diagnosis ?? null,
  }
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export interface PatientWriteInput {
  full_name: string
  phone: string
  date_of_birth: string
  gender: Gender | ''
  address: string
  notes: string
}

function toWritePayload(
  input: PatientWriteInput,
): Pick<PatientInsert, 'full_name' | 'phone' | 'date_of_birth' | 'gender' | 'address' | 'notes'> {
  return {
    full_name: input.full_name.trim(),
    phone: emptyToNull(input.phone),
    date_of_birth: emptyToNull(input.date_of_birth),
    gender: input.gender === '' ? null : input.gender,
    address: emptyToNull(input.address),
    notes: emptyToNull(input.notes),
  }
}

export const patientService = {
  async list(): Promise<PatientListItem[]> {
    const { data, error } = await getSupabaseClient()
      .from('patients')
      .select('*, visits(visit_date, diagnosis)')
      .order('full_name', { ascending: true })

    if (error) throw wrapError(error)

    return (data as PatientListRow[]).map(toListItem)
  },

  async getById(id: string): Promise<PatientListItem | null> {
    const { data, error } = await getSupabaseClient()
      .from('patients')
      .select('*, visits(visit_date, diagnosis)')
      .eq('id', id)
      .maybeSingle()

    if (error) throw wrapError(error)
    if (data === null) return null

    return toListItem(data)
  },

  async create(input: PatientWriteInput): Promise<Patient> {
    const { data, error } = await getSupabaseClient()
      .from('patients')
      .insert(toWritePayload(input))
      .select('*')
      .single()

    if (error) throw wrapError(error)

    return data
  },

  async update(id: string, input: PatientWriteInput): Promise<Patient> {
    const payload: PatientUpdate = toWritePayload(input)
    const { data, error } = await getSupabaseClient()
      .from('patients')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw wrapError(error)

    return data
  },

  async remove(id: string): Promise<void> {
    const { error } = await getSupabaseClient().from('patients').delete().eq('id', id)

    if (error) throw wrapError(error)
  },
}
