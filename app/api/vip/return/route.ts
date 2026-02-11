import { NextRequest, NextResponse } from "next/server";
import { verifyVnpayReturn } from "@/lib/vnpay";
import { completePayment, getPaymentById } from "@/lib/db";

export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get("paymentId");
  if (!paymentId) {
    return NextResponse.redirect(new URL("/vip?error=missing", req.url));
  }
  const payment = await getPaymentById(paymentId);
  if (!payment) {
    return NextResponse.redirect(new URL("/vip?error=invalid", req.url));
  }
  if (payment.status === "completed") {
    return NextResponse.redirect(new URL("/vip?success=1", req.url));
  }
  const params = req.nextUrl.searchParams;
  const result = verifyVnpayReturn(params);
  if (!result.success) {
    return NextResponse.redirect(new URL("/vip?error=failed", req.url));
  }
  if (result.txnRef !== paymentId) {
    return NextResponse.redirect(new URL("/vip?error=invalid", req.url));
  }
  try {
    await completePayment(paymentId, result.transactionNo);
  } catch {
    return NextResponse.redirect(new URL("/vip?error=complete", req.url));
  }
  return NextResponse.redirect(new URL("/vip?success=1", req.url));
}
