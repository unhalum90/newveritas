export type UserRole = "teacher" | "student" | "school_admin" | "platform_admin";

export function getUserRole(user: { user_metadata?: unknown } | null | undefined): UserRole | null {
  const role = (user?.user_metadata as { role?: unknown } | undefined)?.role;
  if (role === "teacher" || role === "student" || role === "school_admin" || role === "platform_admin") {
    return role;
  }
  return null;
}

