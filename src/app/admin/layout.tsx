import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated and has the 'admin' role
  if (!session || session.user?.role !== "admin") {
    redirect("/unauthorized");
  }

  return <>{children}</>;
}
