import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-6xl">
        <div className="bg-secondary p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Submissions</h2>
          {/* Add content for Submissions here */}
        </div>
        <div className="bg-secondary p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Users</h2>
          <Link href="/admin/users">
            <p className="text-primary hover:underline">Manage Users</p>
          </Link>
        </div>
        <div className="bg-secondary p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Teams</h2>
          {/* Add content for Teams here */}
        </div>
        <div className="bg-secondary p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Points</h2>
          {/* Add content for Points here */}
        </div>
      </div>
    </div>
  );
}
