-- handle_new_user is a trigger-only function; it must not be callable
-- through the REST RPC endpoint.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
