import { prisma } from "@/lib/prisma";
import type { DbUser, DbMovieApproval, DbVipPlan, UserRole, ApprovalStatus } from "@/types/db";

function toDbUser(u: { id: string; authId: string | null; email: string; passwordHash: string | null; name: string | null; image: string | null; role: string; vipUntil: Date | null; createdAt: Date; updatedAt: Date }): DbUser {
  return {
    id: u.id,
    auth_id: u.authId,
    email: u.email,
    password_hash: u.passwordHash,
    name: u.name,
    image: u.image,
    role: u.role as UserRole,
    vip_until: u.vipUntil?.toISOString() ?? null,
    created_at: u.createdAt.toISOString(),
    updated_at: u.updatedAt.toISOString(),
  };
}

function toDbMovieApproval(m: { id: string; slug: string; source: string; status: string; approvedById: string | null; approvedAt: Date | null; createdAt: Date }): DbMovieApproval {
  return {
    id: m.id,
    slug: m.slug,
    source: m.source,
    status: m.status as ApprovalStatus,
    approved_by: m.approvedById,
    approved_at: m.approvedAt?.toISOString() ?? null,
    created_at: m.createdAt.toISOString(),
  };
}

function toDbVipPlan(p: { id: string; name: string; durationDays: number; amount: number; active: boolean; createdAt: Date }): DbVipPlan {
  return {
    id: p.id,
    name: p.name,
    duration_days: p.durationDays,
    amount: p.amount,
    active: p.active,
    created_at: p.createdAt.toISOString(),
  };
}

function noDb(): never {
  throw new Error("DATABASE_URL is not set. Add it to .env to use auth, VIP, and admin.");
}

export async function getUserByAuthId(authId: string): Promise<DbUser | null> {
  if (!prisma) return null;
  const u = await prisma.user.findUnique({ where: { authId } });
  return u ? toDbUser(u) : null;
}

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  if (!prisma) return null;
  const u = await prisma.user.findUnique({ where: { email } });
  return u ? toDbUser(u) : null;
}

export async function getUserById(id: string): Promise<DbUser | null> {
  if (!prisma) return null;
  const u = await prisma.user.findUnique({ where: { id } });
  return u ? toDbUser(u) : null;
}

export async function upsertUserFromAuth(params: {
  authId: string;
  email: string;
  name?: string | null;
  image?: string | null;
}): Promise<DbUser> {
  if (!prisma) noDb();
  const existing = await prisma!.user.findUnique({ where: { authId: params.authId } });
  if (existing) {
    const u = await prisma!.user.update({
      where: { id: existing.id },
      data: {
        name: params.name ?? existing.name,
        image: params.image ?? existing.image,
      },
    });
    return toDbUser(u);
  }
  const u = await prisma!.user.create({
    data: {
      authId: params.authId,
      email: params.email,
      name: params.name ?? null,
      image: params.image ?? null,
      role: "free",
    },
  });
  return toDbUser(u);
}

export async function getApprovedMovieSlugs(): Promise<Set<string>> {
  if (!prisma) return new Set();
  const rows = await prisma.movieApproval.findMany({
    where: { status: "approved" },
    select: { slug: true },
  });
  return new Set(rows.map((r: { slug: string }) => r.slug));
}

export async function getVipPlans(): Promise<DbVipPlan[]> {
  if (!prisma) return [];
  const list = await prisma.vipPlan.findMany({ where: { active: true } });
  return list.map(toDbVipPlan);
}

export async function getVipPlanById(id: string): Promise<DbVipPlan | null> {
  if (!prisma) return null;
  const p = await prisma.vipPlan.findUnique({ where: { id } });
  return p ? toDbVipPlan(p) : null;
}

export async function createPayment(params: {
  userId: string;
  planId: string;
  amount: number;
  gateway: "vnpay" | "momo";
  gatewayTransactionId?: string;
}): Promise<{ id: string }> {
  if (!prisma) noDb();
  const payment = await prisma!.payment.create({
    data: {
      userId: params.userId,
      planId: params.planId,
      amount: params.amount,
      gateway: params.gateway,
      gatewayTransactionId: params.gatewayTransactionId ?? null,
      status: "pending",
    },
  });
  return { id: payment.id };
}

export async function completePayment(
  paymentId: string,
  gatewayTransactionId?: string
): Promise<void> {
  if (!prisma) noDb();
  const payment = await prisma!.payment.findUnique({
    where: { id: paymentId },
    select: { userId: true, planId: true, status: true },
  });
  if (!payment || payment.status === "completed") throw new Error("Payment not found");
  const plan = await prisma!.vipPlan.findUnique({ where: { id: payment.planId } });
  if (!plan) throw new Error("Plan not found");
  const user = await prisma!.user.findUnique({ where: { id: payment.userId } });
  if (!user) throw new Error("User not found");
  const now = new Date();
  let newVipUntil: Date;
  if (user.vipUntil && user.vipUntil > now) {
    const end = new Date(user.vipUntil);
    end.setDate(end.getDate() + plan.durationDays);
    newVipUntil = end;
  } else {
    const end = new Date(now);
    end.setDate(end.getDate() + plan.durationDays);
    newVipUntil = end;
  }
  await prisma!.payment.update({
    where: { id: paymentId },
    data: {
      status: "completed",
      paidAt: now,
      gatewayTransactionId: gatewayTransactionId ?? undefined,
    },
  });
  await prisma!.user.update({
    where: { id: payment.userId },
    data: { role: "vip", vipUntil: newVipUntil },
  });
}

export async function getPaymentById(id: string): Promise<{ user_id: string; plan_id: string; status: string } | null> {
  if (!prisma) return null;
  const p = await prisma.payment.findUnique({
    where: { id },
    select: { userId: true, planId: true, status: true },
  });
  if (!p) return null;
  return { user_id: p.userId, plan_id: p.planId, status: p.status };
}

export async function insertMovieApprovals(slugs: string[], source = "ophim1"): Promise<number> {
  if (!prisma) return 0;
  if (slugs.length === 0) return 0;
  const existing = await prisma.movieApproval.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true },
  });
  const existingSet = new Set(existing.map((r: { slug: string }) => r.slug));
  const toInsert = slugs.filter((s) => !existingSet.has(s));
  if (toInsert.length === 0) return 0;
  await prisma.movieApproval.createMany({
    data: toInsert.map((slug) => ({ slug, source, status: "pending" })),
  });
  return toInsert.length;
}

export async function getPendingMovieApprovals(): Promise<DbMovieApproval[]> {
  if (!prisma) return [];
  const list = await prisma.movieApproval.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "desc" },
  });
  type Row = { id: string; slug: string; source: string; status: string; approvedById: string | null; approvedAt: Date | null; createdAt: Date };
  return list.map((m: Row) => toDbMovieApproval(m));
}

export async function updateMovieApprovalStatus(
  id: string,
  status: ApprovalStatus,
  approvedBy: string
): Promise<void> {
  if (!prisma) noDb();
  await prisma!.movieApproval.update({
    where: { id },
    data: {
      status,
      approvedById: approvedBy,
      approvedAt: status === "approved" ? new Date() : null,
    },
  });
}

export async function listUsers(params?: { role?: UserRole }): Promise<DbUser[]> {
  if (!prisma) return [];
  const list = await prisma.user.findMany({
    where: params?.role ? { role: params.role } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return list.map(toDbUser);
}

export async function updateUserRole(userId: string, role: UserRole): Promise<void> {
  if (!prisma) noDb();
  await prisma!.user.update({
    where: { id: userId },
    data: { role },
  });
}

export async function grantVipManual(
  userId: string,
  durationDays: number,
  _adminId: string
): Promise<void> {
  if (!prisma) noDb();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");
  const now = new Date();
  let newVipUntil: Date;
  if (user.vipUntil && user.vipUntil > now) {
    const end = new Date(user.vipUntil);
    end.setDate(end.getDate() + durationDays);
    newVipUntil = end;
  } else {
    const end = new Date(now);
    end.setDate(end.getDate() + durationDays);
    newVipUntil = end;
  }
  const plan = await prisma.vipPlan.findFirst({ where: { active: true } });
  await prisma.user.update({
    where: { id: userId },
    data: { role: "vip", vipUntil: newVipUntil },
  });
  if (plan) {
    await prisma.payment.create({
      data: {
        userId,
        planId: plan.id,
        amount: 0,
        gateway: "manual",
        status: "completed",
        paidAt: now,
      },
    });
  }
}

export async function createUserAsAdmin(params: {
  email: string;
  name?: string;
  role: UserRole;
}): Promise<DbUser> {
  if (!prisma) noDb();
  const existing = await prisma!.user.findUnique({ where: { email: params.email } });
  if (existing) {
    const u = await prisma!.user.update({
      where: { id: existing.id },
      data: { role: params.role, name: params.name ?? existing.name },
    });
    return toDbUser(u);
  }
  const u = await prisma!.user.create({
    data: {
      email: params.email,
      name: params.name ?? null,
      role: params.role,
    },
  });
  return toDbUser(u);
}

export async function registerUser(params: {
  email: string;
  passwordHash: string;
  name?: string | null;
}): Promise<DbUser> {
  if (!prisma) noDb();
  const existing = await prisma!.user.findUnique({ where: { email: params.email } });
  if (existing) throw new Error("Email already registered");
  const u = await prisma!.user.create({
    data: {
      email: params.email,
      passwordHash: params.passwordHash,
      name: params.name ?? null,
      role: "free",
    },
  });
  return toDbUser(u);
}
