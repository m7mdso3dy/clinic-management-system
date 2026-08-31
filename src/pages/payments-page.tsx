import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CLINIC_CURRENCY } from '@/constants/clinic'
import { PERMISSIONS } from '@/constants/permissions'
import { visitDetailPath } from '@/constants/routes'
import { usePermissions } from '@/hooks/use-permissions'
import { formatCurrency } from '@/i18n/format'
import {
  isPaymentError,
  paymentService,
  type PaymentListItem,
} from '@/services/payments/payment.service'
import { todayDateInputValue } from '@/utils/date-input'

function clampToTodayOrEarlier(value: string): string {
  const today = todayDateInputValue()
  if (value === '' || value > today) return today
  return value
}

export function PaymentsPage() {
  const { t } = useTranslation('payments')
  const { t: tCommon } = useTranslation()
  const permissions = usePermissions()
  const dateId = useId()
  const today = todayDateInputValue()

  const [selectedDate, setSelectedDate] = useState(today)
  const [items, setItems] = useState<PaymentListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true
    const day = clampToTodayOrEarlier(selectedDate)

    paymentService
      .listByDate(day)
      .then((rows) => {
        if (!isActive) return
        setItems(rows)
        setLoadError(null)
      })
      .catch((error: unknown) => {
        if (!isActive) return
        setItems([])
        setLoadError(
          isPaymentError(error) && error.kind === 'invalid_date'
            ? t('invalidDate')
            : t('loadFailed'),
        )
      })
      .finally(() => {
        if (!isActive) return
        setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [selectedDate, t])

  const total = items.reduce((sum, item) => sum + item.amount, 0)
  const canOpenVisit = permissions.has(PERMISSIONS.visitsView)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-medium">{t('title')}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t('description')}</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={dateId}>{t('dateLabel')}</Label>
          <Input
            id={dateId}
            type="date"
            max={today}
            required
            value={selectedDate}
            onChange={(event) => {
              setSelectedDate(clampToTodayOrEarlier(event.target.value))
              setIsLoading(true)
            }}
          />
        </div>
      </div>

      <Card>
        <CardContent className="flex items-baseline justify-between gap-4 py-(--card-spacing)">
          <p className="text-muted-foreground text-sm">{t('totalLabel')}</p>
          <p className="font-heading text-2xl font-medium tabular-nums">
            {isLoading ? tCommon('loading') : formatCurrency(total, CLINIC_CURRENCY)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-0">
          {isLoading ? (
            <p className="text-muted-foreground px-(--card-spacing) py-6 text-sm">
              {tCommon('loading')}
            </p>
          ) : loadError !== null ? (
            <p role="alert" className="text-destructive px-(--card-spacing) py-6 text-sm">
              {loadError}
            </p>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground px-(--card-spacing) py-6 text-sm">{t('empty')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('patientColumn')}</TableHead>
                  <TableHead className="text-end">{t('amountColumn')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className={canOpenVisit ? 'relative' : undefined}>
                    <TableCell className="font-medium" dir="auto">
                      {item.patientName === '' ? (
                        t('unset')
                      ) : canOpenVisit ? (
                        <Link
                          to={visitDetailPath(item.id)}
                          className="hover:text-foreground underline-offset-4 after:absolute after:inset-0 hover:underline"
                        >
                          {item.patientName}
                        </Link>
                      ) : (
                        item.patientName
                      )}
                    </TableCell>
                    <TableCell className="text-end tabular-nums">
                      {formatCurrency(item.amount, CLINIC_CURRENCY)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
