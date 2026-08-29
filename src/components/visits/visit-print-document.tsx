import { PrinterIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { formatDate } from '@/i18n/format'
import type { VisitDetail } from '@/services/visits/visit.service'

interface VisitPrintDocumentProps {
  kind: 'prescription' | 'lab'
  visit: VisitDetail
}

export function VisitPrintDocument({ kind, visit }: VisitPrintDocumentProps) {
  const { t } = useTranslation('visits')
  const { t: tCommon } = useTranslation()

  const items =
    kind === 'prescription'
      ? visit.prescriptions.map((item) => ({
          title: item.medication_name,
          detail: [item.dosage, item.frequency, item.duration].filter(Boolean).join(' · '),
          notes: item.instructions,
        }))
      : visit.labOrders.map((item) => ({
          title: item.analysis_name,
          detail: '',
          notes: item.notes,
        }))

  return (
    <div className="mx-auto max-w-2xl space-y-6 bg-white p-6 text-black">
      <div className="flex flex-wrap gap-2 print:hidden">
        <Button type="button" onClick={() => window.print()}>
          <PrinterIcon aria-hidden="true" />
          {tCommon('print')}
        </Button>
      </div>

      <header className="border-b pb-4 text-center">
        <h1 className="font-heading text-xl font-medium">{tCommon('appName')}</h1>
        <p className="mt-1 text-lg font-medium">
          {kind === 'prescription' ? t('prescriptionTitle') : t('labTitle')}
        </p>
      </header>

      <dl className="grid gap-2 text-sm sm:grid-cols-[8rem_1fr]">
        <dt className="text-neutral-600">{t('patientLabel')}</dt>
        <dd dir="auto">{visit.patientName === '' ? t('unset') : visit.patientName}</dd>
        <dt className="text-neutral-600">{t('phoneLabel')}</dt>
        <dd dir={visit.patientPhone ? 'ltr' : undefined}>{visit.patientPhone ?? t('unset')}</dd>
        <dt className="text-neutral-600">{t('dateLabel')}</dt>
        <dd>{formatDate(visit.visit_date, { dateStyle: 'medium' })}</dd>
        <dt className="text-neutral-600">{t('doctorLabel')}</dt>
        <dd dir="auto">{visit.doctorName ?? t('unset')}</dd>
      </dl>

      {items.length === 0 ? (
        <p className="text-sm">{t('printEmpty')}</p>
      ) : (
        <ol className="list-decimal space-y-3 ps-5">
          {items.map((item, index) => (
            <li key={`${item.title}-${String(index)}`} className="border-b pb-2">
              <p className="font-medium" dir="auto">
                {item.title}
              </p>
              {item.detail !== '' ? (
                <p className="text-sm" dir="auto">
                  {item.detail}
                </p>
              ) : null}
              {item.notes !== null && item.notes !== '' ? (
                <p className="text-sm" dir="auto">
                  {item.notes}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}

      <div className="grid gap-12 pt-12 sm:grid-cols-2">
        <p className="border-t pt-2 text-sm">{t('patientSignature')}</p>
        <p className="border-t pt-2 text-sm">{t('doctorSignature')}</p>
      </div>
    </div>
  )
}
