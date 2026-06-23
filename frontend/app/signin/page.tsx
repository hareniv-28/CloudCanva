"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "aws-amplify/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Cloud, ArrowRight, Sparkles, Rocket, Shield, CloudCog } from "lucide-react";
import "@/lib/cognito";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn({ username: email, password });
      if (result.isSignedIn) {
        window.location.href = "/";
      } else if (result.nextStep?.signInStep === "CONFIRM_SIGN_UP") {
        setError("Please verify your email first. Check your inbox for a code.");
      } else {
        setError(`Additional step required: ${result.nextStep?.signInStep}`);
      }
    } catch (err: any) {
      setError(err.message || "Sign in failed");
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
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="text-muted-foreground text-sm mt-1">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Password</label>
                <a href="/forgot-password" className="text-xs text-[#10b981] hover:underline">
                  Forgot password?
                </a>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
                required
              />
            </div>
            <Button type="submit" className="w-full h-11 bg-[#0f1b2d] hover:bg-[#1a2d47] text-white" disabled={loading}>
              {loading ? "Signing in..." : (
                <span className="flex items-center gap-2">
                  Sign In <ArrowRight size={16} />
                </span>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <a href="/signup" className="text-[#10b981] font-medium hover:underline">Create one</a>
          </p>
        </div>
      </div>
    </div>
  );
}
