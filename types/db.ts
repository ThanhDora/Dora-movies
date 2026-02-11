export type UserRole = "free" | "vip" | "admin" | "super_admin";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type PaymentGateway = "vnpay" | "momo" | "manual";
export type PaymentStatus = "pending" | "completed" | "failed";

export interface DbUser {
  id: string;
  auth_id: string | null;
  email: string;
  password_hash: string | null;
  name: string | null;
  image: string | null;
  role: UserRole;
  vip_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbMovieApproval {
  id: string;
  slug: string;
  source: string;
  status: ApprovalStatus;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface DbVipPlan {
  id: string;
  name: string;
  duration_days: number;
  amount: number;
  active: boolean;
  created_at: string;
}

export interface DbPayment {
  id: string;
  user_id: string;
  plan_id: string;
  amount: number;
  gateway: PaymentGateway;
  gateway_transaction_id: string | null;
  status: PaymentStatus;
  paid_at: string | null;
  created_at: string;
}
