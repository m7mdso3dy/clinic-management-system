import { getSupabaseClient } from '@/services/supabase/client'
import type { Visit, VisitUpdate } from '@/types/models'

export type VisitErrorKind = 'unknown'

export class VisitError extends Error {
  readonly kind: VisitErrorKind

  constructor(kind: VisitErrorKind, cause?: unknown) {
    super(kind, cause !== undefined ? { cause } : undefined)
    this.name = 'VisitError'
    this.kind = kind
  }
}

export function isVisitError(error: unknown): error is VisitError {
  return error instanceof VisitError
}

export interface VisitListItem extends Visit {
  patientName: string
  examinationTypeName: string | null
}

export interface VisitPatientOption {
  id: string
  full_name: string
  phone: string | null
}

export interface VisitWriteInput {
  patient_id: string
  examination_type_id: string
  visit_date: string
  symptoms: string
  diagnosis: string
  treatment: string
  notes: string
  amount: number
}

interface VisitListRow extends Visit {
  patients: { full_name: string } | null
  examination_types: { name: string } | null
}

function wrapError(error: { code?: string }): VisitError {
  return new VisitError('unknown', error)
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function toListItem(row: VisitListRow): VisitListItem {
  return {
    id: row.id,
    patient_id: row.patient_id,
    doctor_id: row.doctor_id,
    examination_type_id: row.examination_type_id,
    visit_date: row.visit_date,
    symptoms: row.symptoms,
    diagnosis: row.diagnosis,
    treatment: row.treatment,
    notes: row.notes,
    amount: row.amount,
    created_at: row.created_at,
    updated_at: row.updated_at,
    patientName: row.patients?.full_name ?? '',
    examinationTypeName: row.examination_types?.name ?? null,
  }
}

function toWritePayload(
  input: VisitWriteInput,
): Pick<
  VisitUpdate,
  | 'patient_id'
  | 'examination_type_id'
  | 'visit_date'
  | 'symptoms'
  | 'diagnosis'
  | 'treatment'
  | 'notes'
  | 'amount'
> {
  return {
    patient_id: input.patient_id,
    examination_type_id: input.examination_type_id,
    visit_date: input.visit_date,
    symptoms: emptyToNull(input.symptoms),
    diagnosis: emptyToNull(input.diagnosis),
    treatment: emptyToNull(input.treatment),
    notes: emptyToNull(input.notes),
    amount: input.amount,
  }
}

const VISIT_SELECT = '*, patients(full_name), examination_types(name)'

export const visitService = {
  async list(): Promise<VisitListItem[]> {
    const { data, error } = await getSupabaseClient()
      .from('visits')
      .select(VISIT_SELECT)
      .order('visit_date', { ascending: false })

    if (error) throw wrapError(error)

    return data.map(toListItem)
  },

  async getById(id: string): Promise<VisitListItem | null> {
    const { data, error } = await getSupabaseClient()
      .from('visits')
      .select(VISIT_SELECT)
      .eq('id', id)
      .maybeSingle()

    if (error) throw wrapError(error)
    if (data === null) return null

    return toListItem(data)
  },

  async listPatientOptions(): Promise<VisitPatientOption[]> {
    const { data, error } = await getSupabaseClient()
      .from('patients')
      .select('id, full_name, phone')
      .order('full_name', { ascending: true })

    if (error) throw wrapError(error)

    return data
  },

  async update(id: string, input: VisitWriteInput): Promise<Visit> {
    const { data, error } = await getSupabaseClient()
      .from('visits')
      .update(toWritePayload(input))
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw wrapError(error)

    return data
  },

  async remove(id: string): Promise<void> {
    const { error } = await getSupabaseClient().from('visits').delete().eq('id', id)

    if (error) throw wrapError(error)
  },
}
