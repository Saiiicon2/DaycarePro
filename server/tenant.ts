export function isAdmin(user?: any) {
  return user?.role === "admin" || user?.role === "system_admin";
}

export function userDaycareId(user?: any): number | null {
  return user?.daycare_id ?? null;
}
