import type { UserRole } from "@/types/db";

export function isVip(role: UserRole, vipUntil: string | null): boolean {
  if (role !== "vip") return false;
  if (!vipUntil) return false;
  return new Date(vipUntil) > new Date();
}

export function isAdmin(role: UserRole): boolean {
  return role === "admin" || role === "super_admin";
}
