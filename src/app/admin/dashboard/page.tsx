import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "admin";
  const isJudge = session?.user?.role === "judge";

  return (
    <div className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-6xl">
        <div className="p-6 rounded-lg shadow-md" style={{ backgroundColor: "#7fab61" }}>
          <h2 className="text-2xl font-bold mb-4">Submissions</h2>
          {/* Add content for Submissions here */}
        </div>
        <div className="p-6 rounded-lg shadow-md" style={{ backgroundColor: "#7fab61" }}>
          <h2 className="text-2xl font-bold mb-4">Games</h2> {/* Renamed to Games */}
          {isAdmin && (
            <>
              <Link href="/admin/games">
                <p className="text-primary hover:underline">Manage Games & Teams</p>
              </Link>
            </>
          )}
        </div>
        <div className="p-6 rounded-lg shadow-md" style={{ backgroundColor: "#7fab61" }}>
          <h2 className="text-2xl font-bold mb-4">Users</h2> {/* New Users container */}
          {isAdmin && (
            <Link href="/admin/users">
              <p className="text-primary hover:underline">Manage Users</p>
            </Link>
          )}
        </div>
        <div className="p-6 rounded-lg shadow-md" style={{ backgroundColor: "#7fab61" }}>
          <h2 className="text-2xl font-bold mb-4">Points</h2>
          {/* Add content for Points here */}
        </div>
      </div>
    </div>
  );
}
