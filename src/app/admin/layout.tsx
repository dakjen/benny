import { auth } from "@clerk/nextjs/server"; // Import Clerk's auth
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || session.user?.publicMetadata?.role !== "admin") {
    redirect("/unauthorized");
  }

  return <>{children}</>;
}
