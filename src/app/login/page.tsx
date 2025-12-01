import { SignIn } from "@clerk/nextjs"; // Import SignIn

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignIn />
    </div>
  );
}
