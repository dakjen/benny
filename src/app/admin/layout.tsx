import { auth } from "@/auth"; // Import auth from your NextAuth.js configuration
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Check if user is authenticated and has the 'admin' role
  if (!session || session.user?.role !== "admin") {
    redirect("/unauthorized");
  }

  return <>{children}</>;
}
