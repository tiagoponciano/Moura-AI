import { LoginCard } from "@/features/auth";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  return <LoginCard failed={error === "auth_failed"} />;
}
