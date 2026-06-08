/*
# Fix get_user_role function — add SECURITY DEFINER

## Problem
The `get_user_role()` function queries `public.profiles` to return the
calling user's role. However, the profiles table has RLS enabled and the
SELECT policy itself calls `get_user_role()` to decide access — creating
a circular dependency / deadlock that results in a 403 permission error.

## Fix
Recreate `get_user_role()` with `SECURITY DEFINER` so it executes with the
privileges of the function owner (postgres/superuser), bypassing RLS when
doing the internal lookup. This breaks the circular dependency.

Also sets `search_path = public` for security best practice.
*/

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;
