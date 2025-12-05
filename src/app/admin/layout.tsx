import { getServerSession } from "next-auth/next";
import authOptions from "@/auth";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated and has the 'admin' or 'judge' role
  if (!session || (session.user?.role !== "admin" && session.user?.role !== "judge")) {
    redirect("/unauthorized");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 overflow-y-auto" style={{ height: 'calc(100vh - 80px)' }}>{children}</main>
      <BottomNav />
    </div>
  );
}
