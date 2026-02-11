import { createHmac } from "crypto";

const TMN_CODE = process.env.VNPAY_TMN_CODE!;
const HASH_SECRET = process.env.VNPAY_HASH_SECRET!;
const VNPAY_URL = process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

export function buildVnpayUrl(params: {
  amount: number;
  orderId: string;
  orderInfo: string;
  returnUrl: string;
  cancelUrl?: string;
  locale?: "vn" | "en";
}): string {
  const vnpParams: Record<string, string> = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: TMN_CODE,
    vnp_Amount: String(params.amount * 100),
    vnp_CurrCode: "VND",
    vnp_TxnRef: params.orderId,
    vnp_OrderInfo: params.orderInfo,
    vnp_OrderType: "other",
    vnp_Locale: params.locale ?? "vn",
    vnp_ReturnUrl: params.returnUrl,
    vnp_IpAddr: "127.0.0.1",
    vnp_CreateDate: new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14),
  };
  if (params.cancelUrl) vnpParams.vnp_CancelUrl = params.cancelUrl;

  const sortedKeys = Object.keys(vnpParams).sort();
  const signData = sortedKeys
    .filter((k) => vnpParams[k] !== "" && vnpParams[k] !== undefined)
    .map((k) => `${k}=${encodeURIComponent(vnpParams[k])}`)
    .join("&");
  const hmac = createHmac("sha512", HASH_SECRET);
  hmac.update(Buffer.from(signData, "utf-8"));
  const vnpSecureHash = hmac.digest("hex");
  const query = `${signData}&vnp_SecureHash=${vnpSecureHash}`;
  return `${VNPAY_URL}?${query}`;
}

export function verifyVnpayReturn(searchParams: URLSearchParams): { success: boolean; txnRef: string; amount: number; transactionNo?: string } {
  const vnpSecureHash = searchParams.get("vnp_SecureHash");
  const vnpSecureHashType = searchParams.get("vnp_SecureHashType");
  const vnpResponseCode = searchParams.get("vnp_ResponseCode");
  const vnpTxnRef = searchParams.get("vnp_TxnRef");
  const vnpAmount = searchParams.get("vnp_Amount");
  const vnpTransactionNo = searchParams.get("vnp_TransactionNo");

  if (!vnpSecureHash || !vnpTxnRef || !vnpAmount) {
    return { success: false, txnRef: "", amount: 0 };
  }

  const sortedKeys = Array.from(searchParams.keys())
    .filter((k) => k !== "vnp_SecureHash" && k !== "vnp_SecureHashType")
    .sort();
  const signData = sortedKeys
    .map((k) => `${k}=${encodeURIComponent(searchParams.get(k) ?? "")}`)
    .join("&");
  const hmac = createHmac("sha512", HASH_SECRET);
  hmac.update(Buffer.from(signData, "utf-8"));
  const expected = hmac.digest("hex");
  if (expected !== vnpSecureHash) {
    return { success: false, txnRef: vnpTxnRef, amount: 0 };
  }
  const success = vnpResponseCode === "00";
  const amount = Math.round(Number(vnpAmount) / 100);
  return {
    success,
    txnRef: vnpTxnRef,
    amount,
    transactionNo: vnpTransactionNo ?? undefined,
  };
}
