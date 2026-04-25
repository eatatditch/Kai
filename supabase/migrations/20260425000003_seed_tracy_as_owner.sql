-- Set Tracy as owner
update public.profiles
set role = 'owner'
where email = 'tracy@eatatditch.com';
