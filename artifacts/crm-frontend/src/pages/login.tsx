import { useState } from "react";
import { useLocation } from "wouter";
import { Brain } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(26, 38, 43, 0.8) 0%, rgba(66, 52, 40, 0.8) 100%), url('/background.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      <Card className="w-full max-w-sm bg-white/5 backdrop-blur-xl border-white/15 text-white shadow-2xl rounded-2xl relative overflow-hidden">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 text-white font-semibold text-xl mb-2 tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-sm">
              <Brain className="w-5 h-5" />
            </div>
            <div className="w-px h-4 bg-white/40"></div>
            <span className="font-light opacity-70 text-base">Viettel Networks</span>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight mb-2">NetMind Gateway</CardTitle>
            <CardDescription className="text-white/70 font-light">Sign in to your account</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white/70 font-normal">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                autoFocus
                className="bg-transparent border-white/15 text-white placeholder:text-white/40 focus-visible:ring-[#d4b895] focus-visible:border-[#d4b895] rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/70 font-normal">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-transparent border-white/15 text-white placeholder:text-white/40 focus-visible:ring-[#d4b895] focus-visible:border-[#d4b895] rounded-lg"
              />
            </div>
            {error && (
              <p className="text-sm text-red-400 bg-red-950/40 border border-red-500/20 px-3 py-2 rounded-md font-light">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full mt-4"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Discovery session"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
