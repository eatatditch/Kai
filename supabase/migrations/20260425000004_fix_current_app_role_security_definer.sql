-- Fix: public.current_app_role() wrapper needs SECURITY DEFINER to call private function
create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select private.current_app_role();
$$;
grant execute on function public.current_app_role() to authenticated;
