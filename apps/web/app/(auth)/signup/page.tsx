import Link from "next/link"
import { SignupForm } from "@/components/signup-form"

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Logo/App Name */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold gradient-text inline-block">
            DrawChat
          </Link>
        </div>

        {/* Signup Card */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Create Account</h1>
            <p className="text-[#A1A1A1]">Start collaborating in seconds</p>
          </div>

          <SignupForm />

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-sm text-[#A1A1A1]">
              Already have an account?{" "}
              <Link href="/login" className="gradient-text font-semibold hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
