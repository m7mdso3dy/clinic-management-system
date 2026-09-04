-- Held visits: patient no-show. The new enum value is used in the next migration.

alter type public.visit_status add value 'held';
