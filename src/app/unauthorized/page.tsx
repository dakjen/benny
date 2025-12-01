export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold text-red-600">Unauthorized Access</h1>
      <p className="text-lg mt-4">
        You do not have permission to view this page.
      </p>
      <a href="/" className="mt-6 text-blue-500 hover:underline">
        Go back to home
      </a>
    </div>
  );
}
