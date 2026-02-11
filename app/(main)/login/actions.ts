"use server";

import { unstable_rethrow } from "next/navigation";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function loginWithCredentials(formData: FormData) {
  try {
    const url = await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirectTo: "/profile",
      redirect: false,
    });
    if (typeof url === "string" && !url.includes("error") && !url.includes("signin"))
      return { ok: true, url };
  } catch (e) {
    unstable_rethrow(e);
    const causeMsg = (e as { cause?: { err?: { message?: string } } })?.cause?.err?.message;
    if (
      (e instanceof Error && e.message?.includes("EMAIL_NOT_VERIFIED")) ||
      causeMsg === "EMAIL_NOT_VERIFIED"
    ) {
      return { error: "Vui lòng xác minh email trước khi đăng nhập. Kiểm tra hộp thư và thư mục spam." };
    }
    if (e instanceof AuthError) {
      if (e.type === "CredentialsSignin") {
        const code = (e as AuthError & { code?: string }).code;
        if (code === "email_not_verified")
          return { error: "Vui lòng xác minh email trước khi đăng nhập. Kiểm tra hộp thư và thư mục spam." };
        return { error: "Email hoặc mật khẩu không đúng." };
      }
      return { error: e.message };
    }
    return { error: "Đăng nhập thất bại." };
  }
  return {};
}

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/?login=success" });
}

export async function signInWithFacebook() {
  await signIn("facebook", { redirectTo: "/?login=success" });
}
