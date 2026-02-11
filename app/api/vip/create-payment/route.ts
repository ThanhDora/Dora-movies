import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getVipPlanById } from "@/lib/db";
import { createPayment } from "@/lib/db";
import { buildVnpayUrl } from "@/lib/vnpay";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { planId, gateway } = body;
  if (!planId || gateway !== "vnpay") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const plan = await getVipPlanById(planId);
  if (!plan || !plan.active) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }
  const { id: paymentId } = await createPayment({
    userId: session.user.id,
    planId: plan.id,
    amount: plan.amount,
    gateway: "vnpay",
  });
  const baseUrl = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const returnUrl = `${baseUrl}/api/vip/return?paymentId=${paymentId}`;
  const paymentUrl = buildVnpayUrl({
    amount: plan.amount,
    orderId: paymentId,
    orderInfo: `VIP ${plan.name}`,
    returnUrl,
    cancelUrl: `${baseUrl}/vip`,
  });
  return NextResponse.json({ url: paymentUrl });
}
