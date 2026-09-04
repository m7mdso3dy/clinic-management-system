-- Add canceled to visit_status. The new value is used in a following migration
-- because PostgreSQL cannot use a newly added enum value in the same transaction.

alter type public.visit_status add value 'canceled';
