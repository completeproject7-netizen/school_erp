import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  GraduationCap, Loader2, Sparkles, ArrowRight, Mail, Lock, Eye, EyeOff,
  CheckCircle2, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { forgotPasswordRequest } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetBusy, setResetBusy] = useState(false);

  const quickLoginOptions = [
    { label: "Administrator", email: "admin@educore.school", password: "admin123", description: "Full campus access" },
    { label: "Teacher", email: "teacher01@educore.school", password: "TeacherReset123!", description: "Manage classes and grades" },
    { label: "Student", email: "student001@educore.school", password: "StudentReset123!", description: "View courses and attendance" },
    { label: "Admission", email: "admissions@educore.school", password: "admit123", description: "Handle applications and enrollments" },
    { label: "Staff", email: "staff@educore.school", password: "staff123", description: "Access staff workspace" },
  ] as const;

  const applyQuickLogin = (option: (typeof quickLoginOptions)[number]) => {
    setEmail(option.email);
    setPassword(option.password);
    setShowPw(false);
    setShowForgot(false);
  };

  if (user) return <Navigate to="/dashboard" />;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await login(email, password);

      toast.success(`Welcome back, ${u.name.split(" ")[0]}`);
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (resetPassword !== resetConfirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setResetBusy(true);
    try {
      await forgotPasswordRequest(resetEmail || email, resetPassword);
      toast.success("Password updated. You can sign in with your new password.");
      setShowForgot(false);
      setResetEmail("");
      setResetPassword("");
      setResetConfirmPassword("");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setResetBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden text-sidebar-foreground"
      style={{
        // Scoped white / blue / black theme for the login page
        ["--sidebar" as string]: "oklch(1 0 0)",                     // white background
        ["--sidebar-foreground" as string]: "oklch(0.18 0.02 260)",  // near-black text
        ["--sidebar-primary" as string]: "oklch(0.5 0.2 255)",       // vivid blue
        ["--sidebar-primary-foreground" as string]: "oklch(0.99 0 0)",
        ["--sidebar-accent" as string]: "oklch(0.97 0.01 255)",      // very light blue/white surface
        ["--sidebar-accent-foreground" as string]: "oklch(0.18 0.02 260)",
        ["--sidebar-border" as string]: "oklch(0.9 0.015 255)",
        ["--accent" as string]: "oklch(0.5 0.2 255)",                // blue accent
        ["--accent-foreground" as string]: "oklch(0.99 0 0)",
        backgroundColor: "var(--sidebar)",
      }}
    >
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 size-[40rem] rounded-full bg-[var(--sidebar-primary)] opacity-20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 size-[40rem] rounded-full bg-accent opacity-15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(var(--sidebar-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--sidebar-foreground) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative grid lg:grid-cols-[1.05fr_1fr] min-h-screen">
        {/* Brand panel */}
        <div className="hidden lg:flex flex-col justify-between p-12 xl:p-16">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-gradient-to-br from-[var(--sidebar-primary)] to-accent flex items-center justify-center shadow-lg shadow-[var(--sidebar-primary)]/30">
              <GraduationCap className="size-5 text-sidebar-primary-foreground" />
            </div>
            <div>
            <p className="font-display font-semibold text-lg tracking-tight">EduCore</p>
              <p className="text-xs text-sidebar-foreground/60">School & College ERP</p>
            </div>
          </div>

          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-sidebar-border bg-sidebar-accent/40 px-3 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="size-3.5 text-accent" />
              Trusted by schools & colleges worldwide
            </div>
            <h2 className="mt-5 font-display text-4xl xl:text-5xl font-semibold leading-[1.05] tracking-tight">
              From classrooms<br />
              <span className="bg-gradient-to-r from-accent to-sidebar-foreground bg-clip-text text-transparent italic">
                to convocation.
              </span>
            </h2>
            <p className="mt-5 text-base text-sidebar-foreground/70 leading-relaxed">
              EduCore unifies admissions, academics, attendance, fees and faculty operations for
              K–12 schools and higher-ed colleges in a single, beautifully simple workspace.
            </p>

            <ul className="mt-8 space-y-3 stagger">
              {[
                "Tailored dashboards for every role on campus",
                "Real-time attendance, gradebook & fee tracking",
                "Secure single sign-on for schools and colleges",
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-sidebar-foreground/80">
                  <CheckCircle2 className="size-4 text-accent flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between text-xs text-sidebar-foreground/50">
            <p>© 2026 EduCore Systems</p>
            <div className="flex items-center gap-4">
              <span>Privacy</span>
              <span>Terms</span>
              <span>Support</span>
            </div>
          </div>
        </div>

        {/* Auth panel */}
        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden mb-8 flex items-center gap-3">
              <div className="size-10 rounded-xl bg-gradient-to-br from-[var(--sidebar-primary)] to-accent flex items-center justify-center">
                <GraduationCap className="size-5 text-sidebar-primary-foreground" />
              </div>
              <p className="font-semibold text-lg">EduCore</p>
            </div>

            <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/30 backdrop-blur-xl p-7 shadow-2xl shadow-black/30">
              <div className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
                <p className="text-sm text-sidebar-foreground/60 mt-1">
                  Sign in to continue to your workspace.
                </p>
              </div>

              <div className="mb-5 rounded-2xl border border-sidebar-border bg-sidebar/70 p-4">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-accent" />
                  <p className="text-sm font-semibold text-sidebar-foreground">Quick demo sign-in</p>
                </div>
                <p className="mt-1 text-xs text-sidebar-foreground/65">
                  Tap a role to auto-fill the demo email and password.
                </p>
                <div className="mt-3 grid gap-2">
                  {quickLoginOptions.map((option) => (
                    <Button
                      key={option.label}
                      type="button"
                      variant="outline"
                      onClick={() => applyQuickLogin(option)}
                      className="h-auto justify-between border-sidebar-border bg-sidebar/90 px-3 py-2 text-left hover:bg-sidebar-accent"
                    >
                      <span>
                        <span className="block text-sm font-semibold text-sidebar-foreground">{option.label}</span>
                        <span className="block text-xs text-sidebar-foreground/65">{option.description}</span>
                      </span>
                      <span className="text-xs text-accent">Use</span>
                    </Button>
                  ))}
                </div>
              </div>

              <form onSubmit={onSubmit} className="space-y-4">

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sidebar-foreground/80 text-xs font-medium uppercase tracking-wider">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-sidebar-foreground/40" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@school.edu"
                      required
                      className="h-11 pl-9 bg-sidebar/60 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus-visible:ring-[var(--sidebar-primary)]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sidebar-foreground/80 text-xs font-medium uppercase tracking-wider">
                      Password
                    </Label>
                    <button
                      type="button"
                      onClick={() => setShowForgot((current) => !current)}
                      className="text-xs text-accent hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-sidebar-foreground/40" />
                    <Input
                      id="password"
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 pl-9 pr-10 bg-sidebar/60 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus-visible:ring-[var(--sidebar-primary)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
                    >
                      {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full h-11 bg-gradient-to-r from-[var(--sidebar-primary)] to-accent text-sidebar-primary-foreground hover:opacity-90 transition-opacity font-medium group"
                >
                  {busy ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="size-4 ml-1 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </Button>
              </form>

              {showForgot && (
                <form onSubmit={onResetPassword} className="mt-4 rounded-2xl border border-sidebar-border bg-sidebar/70 p-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-sidebar-foreground">Reset your password</p>
                    <p className="mt-1 text-xs text-sidebar-foreground/70">
                      Email delivery is not configured yet, so this resets the password directly for the account you enter.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reset-email" className="text-sidebar-foreground/80 text-xs font-medium uppercase tracking-wider">
                      Email
                    </Label>
                    <Input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="you@school.edu"
                      required
                      className="h-11 bg-sidebar/60 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reset-password" className="text-sidebar-foreground/80 text-xs font-medium uppercase tracking-wider">
                      New password
                    </Label>
                    <Input
                      id="reset-password"
                      type="password"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      required
                      className="h-11 bg-sidebar/60 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reset-confirm-password" className="text-sidebar-foreground/80 text-xs font-medium uppercase tracking-wider">
                      Confirm password
                    </Label>
                    <Input
                      id="reset-confirm-password"
                      type="password"
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      required
                      className="h-11 bg-sidebar/60 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={resetBusy}
                    className="w-full h-11 bg-gradient-to-r from-[var(--sidebar-primary)] to-accent text-sidebar-primary-foreground hover:opacity-90 transition-opacity font-medium"
                  >
                    {resetBusy ? <Loader2 className="size-4 animate-spin" /> : "Update password"}
                  </Button>
                </form>
              )}

              <div className="my-6 rounded-2xl border border-sidebar-border bg-sidebar/70 p-4 text-xs text-sidebar-foreground/70">
                <p className="font-medium text-sidebar-foreground/90">Use your school or campus credentials to sign in.</p>
                <p className="mt-2">If you do not have an account yet, ask your administrator to create one in the user management panel.</p>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-sidebar-foreground/50">
              Protected by enterprise-grade security ·{" "}
              <Users className="inline size-3 -mt-0.5" /> 12,000+ schools
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
