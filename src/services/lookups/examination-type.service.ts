import { getSupabaseClient } from '@/services/supabase/client'
import type { ExaminationType, ExaminationTypeInsert, ExaminationTypeUpdate } from '@/types/models'

export type ExaminationTypeErrorKind = 'duplicate_name' | 'in_use' | 'unknown'

export class ExaminationTypeError extends Error {
  readonly kind: ExaminationTypeErrorKind

  constructor(kind: ExaminationTypeErrorKind, cause?: unknown) {
    super(kind, cause !== undefined ? { cause } : undefined)
    this.name = 'ExaminationTypeError'
    this.kind = kind
  }
}

export function isExaminationTypeError(error: unknown): error is ExaminationTypeError {
  return error instanceof ExaminationTypeError
}

function isDuplicateNameError(error: { code?: string; message?: string }): boolean {
  return error.code === '23505'
}

function wrapError(error: { code?: string; message?: string }): ExaminationTypeError {
  if (isDuplicateNameError(error)) {
    return new ExaminationTypeError('duplicate_name', error)
  }

  if (error.code === '23503') {
    return new ExaminationTypeError('in_use', error)
  }

  return new ExaminationTypeError('unknown', error)
}

export const examinationTypeService = {
  async list(): Promise<ExaminationType[]> {
    const { data, error } = await getSupabaseClient()
      .from('examination_types')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw wrapError(error)

    return data
  },

  async create(input: Pick<ExaminationTypeInsert, 'name' | 'cost'>): Promise<ExaminationType> {
    const { data, error } = await getSupabaseClient()
      .from('examination_types')
      .insert({ name: input.name.trim(), cost: input.cost })
      .select('*')
      .single()

    if (error) throw wrapError(error)

    return data
  },

  async update(
    id: string,
    input: Pick<ExaminationTypeUpdate, 'name' | 'cost'>,
  ): Promise<ExaminationType> {
    const { data, error } = await getSupabaseClient()
      .from('examination_types')
      .update({
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.cost !== undefined ? { cost: input.cost } : {}),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw wrapError(error)

    return data
  },

  async remove(id: string): Promise<void> {
    const { error } = await getSupabaseClient().from('examination_types').delete().eq('id', id)

    if (error) throw wrapError(error)
  },
}
