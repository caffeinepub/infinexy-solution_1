import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { saveToken } from "../lib/storage";
import type { Session } from "../lib/types";

interface Props {
  onLogin: (session: Session) => void;
}

export default function LoginPage({ onLogin }: Props) {
  const { actor } = useActor();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) {
      toast.error("Connecting to server, please wait...");
      return;
    }
    setLoading(true);
    try {
      const { token, role, mustChangePassword } = await actor.login(
        username.trim(),
        password,
      );
      saveToken(token);
      const session: Session = {
        token,
        role: role === "admin" ? "admin" : "executive",
        username: username.trim(),
        name: username.trim(),
        mustChangePassword: mustChangePassword ?? false,
      };
      onLogin(session);
      toast.success(`Welcome back, ${username.trim()}!`);
    } catch {
      toast.error("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "oklch(0.96 0.01 265)" }}
    >
      <div className="w-full max-w-md px-4">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white border border-border shadow-sm mb-4 overflow-hidden">
            <img
              src="/assets/uploads/screenshot_2026-03-13_121927-019d2ed7-50ab-74aa-a693-521347dd215f-1.png"
              alt="Company Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Profit Customer Gained
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Profit Management Dashboard
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-lg border border-border p-8">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-4 h-4 text-card-foreground/60" />
            <h2 className="text-lg font-semibold text-card-foreground">
              Sign In
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="username"
                className="text-card-foreground/80 text-sm font-medium"
              >
                Username
              </Label>
              <Input
                id="username"
                data-ocid="login.input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                className="bg-white border-border text-card-foreground placeholder:text-card-foreground/40"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-card-foreground/80 text-sm font-medium"
              >
                Password
              </Label>
              <Input
                id="password"
                data-ocid="login.input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="bg-white border-border text-card-foreground placeholder:text-card-foreground/40"
              />
            </div>

            <Button
              type="submit"
              data-ocid="login.submit_button"
              className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-foreground"
          >
            Built with love using caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
