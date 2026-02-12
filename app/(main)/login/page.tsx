"use client";

import AuthDialog from "@/components/AuthDialog";

export default function LoginPage() {
  return (
    <AuthDialog
      open
      onClose={() => { window.location.href = "/"; }}
      initialTab="login"
    />
  );
}
