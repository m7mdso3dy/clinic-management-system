import { ChevronDownIcon } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { Input } from '@/components/ui/input'
import type { VisitPatientOption } from '@/services/visits/visit.service'
import { cn } from '@/utils/cn'

interface PatientLookupProps {
  id?: string
  patients: VisitPatientOption[]
  selectedId: string | null
  onSelect: (patientId: string) => void
  disabled?: boolean
}

function matchesQuery(patient: VisitPatientOption, query: string): boolean {
  const normalized = query.trim().toLowerCase()
  if (normalized === '') return true

  return (
    patient.full_name.toLowerCase().includes(normalized) ||
    (patient.phone ?? '').toLowerCase().includes(normalized)
  )
}

export function PatientLookup({
  id,
  patients,
  selectedId,
  onSelect,
  disabled = false,
}: PatientLookupProps) {
  const { t, i18n } = useTranslation('visits')
  const generatedInputId = useId()
  const inputId = id ?? generatedInputId
  const listId = useId()
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = patients.find((patient) => patient.id === selectedId) ?? null
  const [query, setQuery] = useState(selected?.full_name ?? '')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const matches = useMemo(
    () => patients.filter((patient) => matchesQuery(patient, query)),
    [patients, query],
  )

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current?.contains(event.target as Node)) return
      setIsOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isOpen])

  function selectPatient(patient: VisitPatientOption) {
    onSelect(patient.id)
    setQuery(patient.full_name)
    setIsOpen(false)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setIsOpen(false)
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        setActiveIndex(0)
        return
      }
      setActiveIndex((index) => (matches.length === 0 ? 0 : (index + 1) % matches.length))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        setActiveIndex(Math.max(matches.length - 1, 0))
        return
      }
      setActiveIndex((index) =>
        matches.length === 0 ? 0 : (index - 1 + matches.length) % matches.length,
      )
      return
    }

    if (event.key === 'Enter' && isOpen) {
      const active = matches[activeIndex]
      if (active === undefined) return
      event.preventDefault()
      selectPatient(active)
    }
  }

  const activePatient = matches[activeIndex]
  const activeOptionId = activePatient === undefined ? undefined : `${listId}-${activePatient.id}`

  return (
    <div ref={containerRef} className="relative min-w-0 flex-1">
      <div className="relative">
        <Input
          id={inputId}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={isOpen ? activeOptionId : undefined}
          dir={query.trim() === '' ? i18n.dir() : 'auto'}
          autoComplete="off"
          disabled={disabled}
          className="pe-8"
          placeholder={t('searchPatientPlaceholder')}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActiveIndex(0)
            setIsOpen(true)
          }}
          onFocus={() => {
            setIsOpen(true)
            setActiveIndex(0)
          }}
          onKeyDown={handleKeyDown}
        />
        <ChevronDownIcon
          aria-hidden="true"
          className="text-muted-foreground pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2"
        />
      </div>

      {isOpen ? (
        <ul
          id={listId}
          role="listbox"
          className="bg-popover text-popover-foreground ring-foreground/10 absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border py-1 shadow-md ring-1"
        >
          {matches.length === 0 ? (
            <li className="text-muted-foreground px-2.5 py-2 text-sm">{t('noMatchingPatients')}</li>
          ) : (
            matches.map((patient, index) => {
              const isActive = index === activeIndex
              const isSelected = patient.id === selectedId

              return (
                <li key={patient.id} role="none">
                  <button
                    type="button"
                    id={`${listId}-${patient.id}`}
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      'flex w-full flex-col items-start px-2.5 py-1.5 text-start text-sm',
                      isActive ? 'bg-muted' : 'hover:bg-muted/70',
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectPatient(patient)}
                  >
                    <span className="font-medium" dir="auto">
                      {patient.full_name}
                    </span>
                    {patient.phone !== null && patient.phone !== '' ? (
                      <span className="text-muted-foreground text-xs">{patient.phone}</span>
                    ) : null}
                  </button>
                </li>
              )
            })
          )}
        </ul>
      ) : null}
    </div>
  )
}
