import { auth } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div>
      <Navbar
        userEmail={session?.user?.email}
        isAdmin={session?.user?.role === "ADMIN"}
      />
      <main>{children}</main>
    </div>
  );
}
