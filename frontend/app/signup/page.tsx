"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp, confirmSignUp } from "aws-amplify/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Cloud, ArrowRight, Sparkles, Rocket, Shield, CloudCog } from "lucide-react";
import "@/lib/cognito";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"signup" | "confirm">("signup");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signUp({ username: email, password });
      setStep("confirm");
    } catch (err: any) {
      setError(err.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
      router.push("/signin");
    } catch (err: any) {
      setError(err.message || "Confirmation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0f1b2d] items-center justify-center p-12">
        <div className="text-white space-y-8 max-w-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center">
              <img src="/logo.png" alt="CloudCanva" className="w-10 h-10 object-contain" />
            </div>
            <h1 className="text-xl font-bold">CloudCanva</h1>
          </div>

          <h2 className="text-4xl font-bold leading-tight">
            The OS for Cloud<br />Infrastructure
          </h2>

          <p className="text-base text-white/60">
            Design, simulate, and deploy complex cloud architectures with a drag-and-drop interface. Turn your blueprints into production-ready infrastructure in seconds.
          </p>

          <div className="space-y-5 pt-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#10b981]/20 flex items-center justify-center mt-0.5">
                <Sparkles size={16} className="text-[#10b981]" />
              </div>
              <div>
                <p className="font-semibold">AI-Native Design</p>
                <p className="text-sm text-white/50">Generate optimized infrastructure patterns from natural language prompts.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#10b981]/20 flex items-center justify-center mt-0.5">
                <Rocket size={16} className="text-[#10b981]" />
              </div>
              <div>
                <p className="font-semibold">Real-time Deployment</p>
                <p className="text-sm text-white/50">One-click provisioning to AWS with built-in state management.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#10b981]/20 flex items-center justify-center mt-0.5">
                <Shield size={16} className="text-[#10b981]" />
              </div>
              <div>
                <p className="font-semibold">SOC2 Compliance</p>
                <p className="text-sm text-white/50">Enterprise-grade security and automated compliance checks out of the box.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="flex items-center gap-2 justify-center mb-4 lg:hidden">
              <div className="w-10 h-10 rounded-lg bg-[#10b981] flex items-center justify-center">
                <Cloud size={22} className="text-white" />
              </div>
              <span className="text-2xl font-bold">CloudCanva</span>
            </div>
            <h2 className="text-2xl font-bold">
              {step === "signup" ? "Create your account" : "Verify your email"}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {step === "signup"
                ? "Start designing cloud infrastructure in minutes."
                : "Enter the verification code sent to your email."}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {step === "signup" ? (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  placeholder="At least 8 chars, 1 uppercase, 1 number"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11 bg-[#0f1b2d] hover:bg-[#1a2d47] text-white" disabled={loading}>
                {loading ? "Creating account..." : (
                  <span className="flex items-center gap-2">
                    Create Account <ArrowRight size={16} />
                  </span>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleConfirm} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Verification Code</label>
                <Input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="h-11 text-center text-lg tracking-widest"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11 bg-[#0f1b2d] hover:bg-[#1a2d47] text-white" disabled={loading}>
                {loading ? "Verifying..." : "Verify & Continue"}
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href="/signin" className="text-[#10b981] font-medium hover:underline">Sign in</a>
          </p>

          <p className="text-center text-xs text-muted-foreground">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
