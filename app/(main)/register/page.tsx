"use client";

import AuthDialog from "@/components/AuthDialog";

export default function RegisterPage() {
  return (
    <AuthDialog
      open
      onClose={() => { window.location.href = "/"; }}
      initialTab="register"
    />
  );
}
