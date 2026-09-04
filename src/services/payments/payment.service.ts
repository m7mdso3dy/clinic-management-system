import { getSupabaseClient } from '@/services/supabase/client'
import { dateInputDayRangeIso } from '@/utils/date-input'

export type PaymentErrorKind = 'invalid_date' | 'unknown'

export class PaymentError extends Error {
  readonly kind: PaymentErrorKind

  constructor(kind: PaymentErrorKind, cause?: unknown) {
    super(kind, cause !== undefined ? { cause } : undefined)
    this.name = 'PaymentError'
    this.kind = kind
  }
}

export function isPaymentError(error: unknown): error is PaymentError {
  return error instanceof PaymentError
}

export interface PaymentListItem {
  id: string
  patientName: string
  amount: number
  visit_date: string
}

interface PaymentListRow {
  id: string
  amount: number | string
  visit_date: string
  patients: { full_name: string } | null
}

function wrapError(error: { code?: string }): PaymentError {
  return new PaymentError('unknown', error)
}

function toListItem(row: PaymentListRow): PaymentListItem {
  return {
    id: row.id,
    patientName: row.patients?.full_name ?? '',
    amount: Number(row.amount),
    visit_date: row.visit_date,
  }
}

export const paymentService = {
  async listByDate(dateInput: string): Promise<PaymentListItem[]> {
    const range = dateInputDayRangeIso(dateInput)
    if (range === null) throw new PaymentError('invalid_date')

    const { data, error } = await getSupabaseClient()
      .from('visits')
      .select('id, amount, visit_date, patients(full_name)')
      .neq('status', 'canceled')
      .gte('visit_date', range.startIso)
      .lt('visit_date', range.endExclusiveIso)
      .order('visit_date', { ascending: true })

    if (error) throw wrapError(error)

    return data.map((row) => toListItem(row))
  },
}
