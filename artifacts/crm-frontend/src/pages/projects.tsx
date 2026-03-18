import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Users, Cpu, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { projectsApi } from "@/lib/api";
import type { Project } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";

export default function ProjectsPage() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [form, setForm] = useState({ project_name: "", project_alias: "" });
  const [error, setError] = useState("");

  const { data: projects = [], isLoading } = useQuery({ queryKey: ["projects"], queryFn: projectsApi.list });

  const createMutation = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects"] }); setOpen(false); resetForm(); },
    onError: (e: Error) => setError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ project_name: string; project_alias: string }> }) =>
      projectsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects"] }); setOpen(false); resetForm(); },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: projectsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  const resetForm = () => { setForm({ project_name: "", project_alias: "" }); setEditProject(null); setError(""); };

  const openCreate = () => { resetForm(); setOpen(true); };
  const openEdit = (p: Project) => {
    setEditProject(p);
    setForm({ project_name: p.project_name, project_alias: p.project_alias });
    setError("");
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (editProject) {
      updateMutation.mutate({ id: editProject.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const autoAlias = (name: string) =>
    name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

  if (isLoading) return <div className="text-muted-foreground text-sm">Loading projects…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">{projects.length} projects</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate} size="sm">
            <Plus className="w-4 h-4 mr-2" /> New Project
          </Button>
        )}
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-sm">No projects yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Card key={p.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">{p.project_name}</h3>
                      {p.my_role && (
                        <Badge variant="secondary" className="capitalize text-[10px] px-1.5 py-0 h-4">
                          {p.my_role}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">[{p.project_alias}]</p>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)} className="h-7 w-7 p-0">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(p.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {p.member_count} members</span>
                  <span className="flex items-center gap-1"><Cpu className="w-3.5 h-3.5" /> {p.model_count} models</span>
                </div>
                <Link href={`/projects/${p.id}`}>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    View Details <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editProject ? "Edit Project" : "Create Project"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input
                value={form.project_name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({
                    ...f,
                    project_name: name,
                    project_alias: f.project_alias || autoAlias(name),
                  }));
                }}
                required
                placeholder="My Project"
              />
            </div>
            <div className="space-y-2">
              <Label>Alias <span className="text-muted-foreground text-xs">(lowercase, underscores)</span></Label>
              <Input
                value={form.project_alias}
                onChange={(e) => setForm((f) => ({ ...f, project_alias: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }))}
                required
                placeholder="my_project"
                pattern="[a-z][a-z0-9_]*"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editProject ? "Save Changes" : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
