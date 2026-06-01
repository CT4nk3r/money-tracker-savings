import { AppShell } from "@/components/app-shell";
import { requireUserId } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUserId();

  return <AppShell>{children}</AppShell>;
}
