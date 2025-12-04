import Link from "next/link";
import { getServerSession } from "next-auth/next";
import authOptions from "@/auth";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "admin";
  const isJudge = session?.user?.role === "judge";

  let defaultGameId: number | null = null;
  try {
    const gamesResponse = await fetch(`/api/admin/games`);
    if (gamesResponse.ok) {
      const gamesData = await gamesResponse.json();
      if (gamesData.length === 1) {
        defaultGameId = gamesData[0].id;
      }
    } else {
      console.error("Failed to fetch games for default selection:", gamesResponse.status, gamesResponse.statusText);
    }
  } catch (error) {
    console.error("Error fetching games for default selection:", error);
  }

  let pendingSubmissionsCount = 0;
  if ((isAdmin || isJudge) && defaultGameId) { // Only fetch if a default game is selected
    try {
      const response = await fetch(`/api/admin/submissions/count?gameId=${defaultGameId}`);
      if (response.ok) {
        const data = await response.json();
        pendingSubmissionsCount = data.count;
      } else {
        console.error("Failed to fetch pending submissions count:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error fetching pending submissions count:", error);
    }
  }

  let totalPointsGranted = 0;
  if ((isAdmin || isJudge) && defaultGameId) { // Only fetch if a default game is selected
    try {
      const response = await fetch(`/api/admin/points/total?gameId=${defaultGameId}`);
      if (response.ok) {
        const data = await response.json();
        totalPointsGranted = data.totalPoints;
      } else {
        console.error("Failed to fetch total points granted:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error fetching total points granted:", error);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-6xl">
        <div className="p-6 rounded-lg shadow-md" style={{ backgroundColor: "#7fab61" }}>
          <h2 className="text-2xl font-bold mb-4">Submissions</h2>
          {(isAdmin || isJudge) && (
            <p className="text-lg">Pending for grading: {pendingSubmissionsCount}</p>
          )}
          {/* Add content for Submissions here */}
        </div>
        <div className="p-6 rounded-lg shadow-md" style={{ backgroundColor: "#7fab61" }}>
          <h2 className="text-2xl font-bold mb-4">Games</h2> {/* Renamed to Games */}
          {isAdmin && (
            <>
              <Link href={defaultGameId ? `/admin/games?gameId=${defaultGameId}` : "/admin/games"}>
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
          {(isAdmin || isJudge) && (
            <p className="text-lg">Total granted: {totalPointsGranted}</p>
          )}
          {/* Add content for Points here */}
        </div>
      </div>
    </div>
  );
}
