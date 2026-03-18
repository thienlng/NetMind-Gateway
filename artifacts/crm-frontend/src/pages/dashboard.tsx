import { useQuery } from "@tanstack/react-query";
import { Users, Cpu, FolderOpen, Key } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usersApi, modelsApi, projectsApi, keysApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function DashboardPage() {
  const { isAdmin, user } = useAuth();

  const { data: users } = useQuery({ queryKey: ["users"], queryFn: usersApi.list, enabled: isAdmin });
  const { data: models } = useQuery({ queryKey: ["models"], queryFn: modelsApi.list });
  const { data: projects } = useQuery({ queryKey: ["projects"], queryFn: projectsApi.list });
  const { data: keys } = useQuery({ queryKey: ["keys"], queryFn: keysApi.list });

  const stats = [
    ...(isAdmin ? [{ label: "Total Users", value: users?.length ?? "—", icon: Users, color: "text-blue-400" }] : []),
    { label: "Models", value: models?.length ?? "—", icon: Cpu, color: "text-purple-400" },
    { label: "Projects", value: projects?.length ?? "—", icon: FolderOpen, color: "text-green-400" },
    { label: "API Keys", value: keys?.length ?? "—", icon: Key, color: "text-orange-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
        <p className="text-sm text-white/70 mt-1 font-light">
          Welcome back, {user?.full_name}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-white/5 backdrop-blur-xl border-white/15 text-white shadow-xl hover:bg-white/10 transition-colors duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                {stat.label}
              </CardTitle>
              <stat.icon className={`w-4 h-4 ${stat.color} opacity-80`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/5 backdrop-blur-xl border-white/15 text-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recent Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {projects?.length === 0 ? (
              <p className="text-sm text-white/50 font-light">No projects yet.</p>
            ) : (
              <ul className="space-y-3">
                {projects?.slice(0, 5).map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-sm group">
                    <span className="font-medium text-white/90 group-hover:text-white transition-colors">{p.project_name}</span>
                    <span className="text-white/50 text-xs font-mono bg-white/5 px-2 py-1 rounded-md border border-white/10">
                      [{p.project_alias}]
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/5 backdrop-blur-xl border-white/15 text-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-base font-semibold">My Recent Keys</CardTitle>
          </CardHeader>
          <CardContent>
            {keys?.length === 0 ? (
              <p className="text-sm text-white/50 font-light">No keys yet.</p>
            ) : (
              <ul className="space-y-3">
                {keys?.slice(0, 5).map((k) => (
                  <li key={k.id} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-xs text-white/80 bg-white/5 px-2 py-1 rounded-md border border-white/10">{k.key_display}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium tracking-wide ${
                      k.type === "service"
                        ? "bg-purple-500/20 text-purple-200 border-purple-500/30"
                        : "bg-blue-500/20 text-blue-200 border-blue-500/30"
                    }`}>
                      {k.type}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
