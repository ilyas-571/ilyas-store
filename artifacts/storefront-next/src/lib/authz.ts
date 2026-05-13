export function isAdminRole(role: string | null | undefined): boolean {
  return role === "admin" || role === "staff" || role === "super_admin";
}
