import { getSupabaseClient } from '@/services/supabase/client'
import type { Json } from '@/types/database.types'
import type { Visit, VisitLabOrder, VisitPrescriptionItem } from '@/types/models'

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

export interface VisitDetail extends VisitListItem {
  patientPhone: string | null
  doctorName: string | null
  prescriptions: VisitPrescriptionItem[]
  labOrders: VisitLabOrder[]
}

export interface VisitPatientOption {
  id: string
  full_name: string
  phone: string | null
}

export interface PrescriptionWriteInput {
  medication_name: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}

export interface LabOrderWriteInput {
  analysis_name: string
  notes: string
}

export interface VisitWriteInput {
  patient_id: string
  examination_type_id: string
  visit_date: string
  amount: number
  heart_rate: number | null
  blood_pressure_systolic: number | null
  blood_pressure_diastolic: number | null
  temperature: number | null
  weight_kg: number | null
  height_cm: number | null
  respiratory_rate: number | null
  oxygen_saturation: number | null
  blood_glucose: number | null
  symptoms: string
  diagnosis: string
  treatment: string
  notes: string
  prescriptions: PrescriptionWriteInput[]
  labOrders: LabOrderWriteInput[]
}

interface VisitListRow extends Visit {
  patients: { full_name: string } | null
  examination_types: { name: string } | null
}

interface VisitDetailRow extends Visit {
  patients: { full_name: string; phone: string | null } | null
  examination_types: { name: string } | null
  profiles: { full_name: string } | null
}

function wrapError(error: { code?: string }): VisitError {
  return new VisitError('unknown', error)
}

function toListItem(row: VisitListRow): VisitListItem {
  const { patients, examination_types, ...visit } = row
  return {
    ...visit,
    patientName: patients?.full_name ?? '',
    examinationTypeName: examination_types?.name ?? null,
  }
}

function toDetail(
  row: VisitDetailRow,
  prescriptions: VisitPrescriptionItem[],
  labOrders: VisitLabOrder[],
): VisitDetail {
  const { patients, examination_types, profiles, ...visit } = row
  return {
    ...visit,
    patientName: patients?.full_name ?? '',
    patientPhone: patients?.phone ?? null,
    examinationTypeName: examination_types?.name ?? null,
    doctorName: profiles?.full_name ?? null,
    prescriptions,
    labOrders,
  }
}

const LIST_SELECT = '*, patients(full_name), examination_types(name)'
const DETAIL_SELECT = '*, patients(full_name, phone), examination_types(name), profiles(full_name)'

export const visitService = {
  async list(): Promise<VisitListItem[]> {
    const { data, error } = await getSupabaseClient()
      .from('visits')
      .select(LIST_SELECT)
      .order('visit_date', { ascending: false })

    if (error) throw wrapError(error)

    return data.map((row) => toListItem(row))
  },

  async getById(id: string): Promise<VisitDetail | null> {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('visits')
      .select(DETAIL_SELECT)
      .eq('id', id)
      .maybeSingle()

    if (error) throw wrapError(error)
    if (data === null) return null

    const { data: prescriptions, error: prescriptionError } = await client
      .from('visit_prescription_items')
      .select('*')
      .eq('visit_id', id)
      .order('sort_order', { ascending: true })

    if (prescriptionError) throw wrapError(prescriptionError)

    const { data: labOrders, error: labError } = await client
      .from('visit_lab_orders')
      .select('*')
      .eq('visit_id', id)
      .order('sort_order', { ascending: true })

    if (labError) throw wrapError(labError)

    return toDetail(data, prescriptions, labOrders)
  },

  async listPatientOptions(): Promise<VisitPatientOption[]> {
    const { data, error } = await getSupabaseClient()
      .from('patients')
      .select('id, full_name, phone')
      .order('full_name', { ascending: true })

    if (error) throw wrapError(error)

    return data
  },

  async save(input: VisitWriteInput, id?: string): Promise<Visit> {
    const { data, error } = await getSupabaseClient().rpc('save_clinic_visit', {
      p_patient_id: input.patient_id,
      p_examination_type_id: input.examination_type_id,
      p_visit_date: input.visit_date,
      p_amount: input.amount,
      p_heart_rate: input.heart_rate,
      p_blood_pressure_systolic: input.blood_pressure_systolic,
      p_blood_pressure_diastolic: input.blood_pressure_diastolic,
      p_temperature: input.temperature,
      p_weight_kg: input.weight_kg,
      p_height_cm: input.height_cm,
      p_respiratory_rate: input.respiratory_rate,
      p_oxygen_saturation: input.oxygen_saturation,
      p_blood_glucose: input.blood_glucose,
      p_symptoms: input.symptoms,
      p_diagnosis: input.diagnosis,
      p_treatment: input.treatment,
      p_notes: input.notes,
      p_prescriptions: input.prescriptions as unknown as Json,
      p_lab_orders: input.labOrders as unknown as Json,
      p_id: id ?? null,
    })

    if (error) throw wrapError(error)
    if (data === null) throw new VisitError('unknown')

    return data
  },

  async remove(id: string): Promise<void> {
    const { error } = await getSupabaseClient().from('visits').delete().eq('id', id)

    if (error) throw wrapError(error)
  },
}
