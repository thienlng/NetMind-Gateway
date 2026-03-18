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
    ...(isAdmin ? [{ label: "Total Users", value: users?.length ?? "—", icon: Users, color: "text-blue-500" }] : []),
    { label: "Models", value: models?.length ?? "—", icon: Cpu, color: "text-purple-500" },
    { label: "Projects", value: projects?.length ?? "—", icon: FolderOpen, color: "text-green-500" },
    { label: "API Keys", value: keys?.length ?? "—", icon: Key, color: "text-orange-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, {user?.full_name}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {projects?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No projects yet.</p>
            ) : (
              <ul className="space-y-2">
                {projects?.slice(0, 5).map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{p.project_name}</span>
                    <span className="text-muted-foreground text-xs font-mono">
                      [{p.project_alias}]
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">My Recent Keys</CardTitle>
          </CardHeader>
          <CardContent>
            {keys?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No keys yet.</p>
            ) : (
              <ul className="space-y-2">
                {keys?.slice(0, 5).map((k) => (
                  <li key={k.id} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-xs">{k.key_display}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      k.type === "service"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
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
