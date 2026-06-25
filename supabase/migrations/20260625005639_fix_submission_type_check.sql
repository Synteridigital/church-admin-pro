-- Fix: expand submission_type check constraint to include public variants.
-- Old: ('self','household','child')
-- New: adds 'public_self','public_household','public_child', allows NULL.

alter table public.members drop constraint members_submission_type_check;

alter table public.members add constraint members_submission_type_check
  check (submission_type is null or submission_type in (
    'self', 'household', 'child',
    'public_self', 'public_household', 'public_child'
  ));
