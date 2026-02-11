"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function loginWithCredentials(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirectTo: "/",
    });
  } catch (e) {
    if (e instanceof AuthError) {
      if (e.type === "CredentialsSignin") return { error: "Email hoặc mật khẩu không đúng." };
      return { error: e.message };
    }
    return { error: "Đăng nhập thất bại." };
  }
  return {};
}

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/" });
}

export async function signInWithFacebook() {
  await signIn("facebook", { redirectTo: "/" });
}
