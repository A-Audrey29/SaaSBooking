import { redirect } from "next/navigation";
import { ResetPasswordClient } from "./reset-password-client";

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;

  if (!token) {
    redirect("/login");
  }

  return <ResetPasswordClient token={token} />;
}
