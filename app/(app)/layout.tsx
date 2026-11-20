import Nav from "@/components/Nav";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <>
      <Nav />
      {children}
    </>
  );
}
