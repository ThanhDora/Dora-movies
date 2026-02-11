import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getVipPlans } from "@/lib/db";
import VipCheckout from "./VipCheckout";

export default async function VipPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/vip");

  const params = await searchParams;
  const success = params.success === "1";
  const error = typeof params.error === "string" ? params.error : null;

  let plans: { id: string; name: string; duration_days: number; amount: number }[] = [];
  try {
    plans = await getVipPlans();
  } catch {
    plans = [];
  }

  return (
    <main className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 py-8">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Nâng cấp VIP</h1>
        {success ? (
          <div className="bg-green-500/20 border border-green-500/40 rounded-xl p-4 text-green-300 mb-6">
            Thanh toán thành công. Tài khoản của bạn đã được nâng cấp VIP.
          </div>
        ) : null}
        {error ? (
          <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-4 text-red-300 mb-6">
            {error === "failed" && "Thanh toán thất bại hoặc đã bị hủy."}
            {error === "invalid" && "Giao dịch không hợp lệ."}
            {error === "complete" && "Có lỗi khi kích hoạt VIP. Liên hệ hỗ trợ."}
            {error !== "failed" && error !== "invalid" && error !== "complete" && "Có lỗi xảy ra."}
          </div>
        ) : null}
        <ul className="space-y-4">
          {plans.map((plan) => (
            <li
              key={plan.id}
              className="flex flex-wrap items-center justify-between gap-4 bg-white/5 rounded-xl p-4 border border-white/10"
            >
              <div>
                <p className="font-bold text-white">{plan.name}</p>
                <p className="text-white/70 text-sm">{plan.duration_days} ngày · Không quảng cáo, xem chất lượng cao</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-[#ff2a14]">
                  {plan.amount.toLocaleString("vi-VN")} đ
                </span>
                <VipCheckout planId={plan.id} planName={plan.name} />
              </div>
            </li>
          ))}
        </ul>
        {plans.length === 0 ? (
          <p className="text-white/70">Chưa có gói VIP. Vui lòng quay lại sau.</p>
        ) : null}
      </div>
    </main>
  );
}
