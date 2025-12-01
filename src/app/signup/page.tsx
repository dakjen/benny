import { SignUp } from "@clerk/nextjs"; // Import SignUp

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignUp />
    </div>
  );
}
