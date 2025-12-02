import { SignupForm } from "@/components/SignupForm"; // Import SignupForm

export default function CreateAccountPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignupForm /> {/* Use SignupForm component */}
    </div>
  );
}
