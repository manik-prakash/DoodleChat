"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/components/ui/button"
import { Input } from "@/components/components/ui/input"
import { Label } from "@/components/components/ui/label"
import { Checkbox } from "@/components/components/ui/checkbox"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"

export function SignupForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  })

  const calculatePasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength += 1
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1
    if (/\d/.test(password)) strength += 1
    if (/[^a-zA-Z\d]/.test(password)) strength += 1
    return strength
  }

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password })
    setPasswordStrength(calculatePasswordStrength(password))
  }

  const getStrengthColor = () => {
    if (passwordStrength === 0) return "bg-border"
    if (passwordStrength <= 2) return "bg-red-500"
    if (passwordStrength === 3) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getStrengthText = () => {
    if (passwordStrength === 0) return ""
    if (passwordStrength <= 2) return "Weak"
    if (passwordStrength === 3) return "Medium"
    return "Strong"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (!formData.agreeToTerms) {
      setError("You must agree to the Terms & Privacy Policy")
      return
    }

    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsLoading(false)
    router.push("/rooms")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
          {error}
        </div>
      )}

      {/* Full Name Field */}
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          type="text"
          placeholder="John Doe"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          className="bg-input border-border focus:border-primary transition-colors"
          required
        />
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="bg-input border-border focus:border-primary transition-colors"
          required
        />
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            className="bg-input border-border focus:border-primary transition-colors pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {/* Password Strength Indicator */}
        {formData.password && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    level <= passwordStrength ? getStrengthColor() : "bg-border"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{getStrengthText()}</p>
          </div>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="bg-input border-border focus:border-primary transition-colors pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Terms Checkbox */}
      <div className="flex items-start space-x-2">
        <Checkbox
          id="terms"
          checked={formData.agreeToTerms}
          onCheckedChange={(checked) => setFormData({ ...formData, agreeToTerms: checked as boolean })}
        />
        <label htmlFor="terms" className="text-sm text-[#A1A1A1] cursor-pointer leading-relaxed">
          I agree to the{" "}
          <Link href="#" className="gradient-text hover:underline">
            Terms
          </Link>{" "}
          &{" "}
          <Link href="#" className="gradient-text hover:underline">
            Privacy Policy
          </Link>
        </label>
      </div>

      {/* Sign Up Button */}
      <Button
        type="submit"
        className="w-full gradient-button text-black font-semibold hover:opacity-90 transition-opacity"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating account...
          </>
        ) : (
          "Sign Up"
        )}
      </Button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-card px-4 text-muted-foreground">or</span>
        </div>
      </div>
    </form>
  )
}
