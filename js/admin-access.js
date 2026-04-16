import { supabase } from './supabase.js';

const ADMIN_LOGIN_ROUTE = 'painel-acesso-taipinhas.html';
const ADMIN_DASHBOARD_ROUTE = 'painel-gestao-taipinhas.html';

export { ADMIN_LOGIN_ROUTE, ADMIN_DASHBOARD_ROUTE };

export async function getVerifiedUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    return null;
  }

  return data.user;
}

export async function isCurrentUserAdmin() {
  const user = await getVerifiedUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id, is_active')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Erro ao validar admin:', error);
    return false;
  }

  return !!data;
}

export async function requireAdminOrRedirect() {
  const user = await getVerifiedUser();

  if (!user) {
    window.location.href = ADMIN_LOGIN_ROUTE;
    return null;
  }

  const isAdmin = await isCurrentUserAdmin();

  if (!isAdmin) {
    await supabase.auth.signOut();
    window.location.href = ADMIN_LOGIN_ROUTE;
    return null;
  }

  return user;
}