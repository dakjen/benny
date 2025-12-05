import Link from "next/link"; // Add this import

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold text-red-600 font-permanent-marker">Unauthorized Access</h1>
      <p className="text-lg mt-4">
        You do not have permission to view this page.
      </p>
      <Link href="/" className="mt-6 text-blue-500 hover:underline">
        Go back to home
      </Link>
    </div>
  );
}
