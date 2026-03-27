import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { useActor } from "./hooks/useActor";
import { clearToken, getToken } from "./lib/storage";
import type { Session } from "./lib/types";
import AdminDashboard from "./pages/AdminDashboard";
import ExecutiveDashboard from "./pages/ExecutiveDashboard";
import LoginPage from "./pages/LoginPage";

export default function App() {
  const { actor, isFetching } = useActor();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isFetching || !actor) return;
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    actor
      .validateSession(token)
      .then(({ username, role }) => {
        setSession({
          token,
          role: role === "admin" ? "admin" : "executive",
          username,
          name: username,
          mustChangePassword: false,
        });
      })
      .catch(() => {
        clearToken();
      })
      .finally(() => setLoading(false));
  }, [actor, isFetching]);

  const handleLogin = (s: Session) => {
    setSession(s);
  };

  const handleLogout = async () => {
    const token = getToken();
    if (token && actor) {
      try {
        await actor.logout(token);
      } catch {
        // ignore
      }
    }
    clearToken();
    setSession(null);
  };

  if (loading || isFetching) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <>
        <LoginPage onLogin={handleLogin} />
        <Toaster />
      </>
    );
  }

  if (session.role === "admin") {
    return (
      <>
        <AdminDashboard session={session} onLogout={handleLogout} />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <ExecutiveDashboard session={session} onLogout={handleLogout} />
      <Toaster />
    </>
  );
}
