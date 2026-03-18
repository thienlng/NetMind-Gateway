import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Plus, Trash2, Shield, User, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { projectsApi, usersApi, modelsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function ProjectDetailPage() {
  const [, params] = useRoute("/projects/:id");
  const projectId = params?.id ?? "";
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addModelOpen, setAddModelOpen] = useState(false);
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [editForm, setEditForm] = useState({ project_name: "", project_alias: "" });
  const [selectedUserId, setSelectedUserId] = useState("");
  const [memberRole, setMemberRole] = useState("member");
  const [selectedModelId, setSelectedModelId] = useState("");
  const [error, setError] = useState("");

  const { data: project, isLoading: pLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectsApi.get(projectId),
    enabled: !!projectId,
  });

  const { data: members = [], isLoading: mLoading } = useQuery({
    queryKey: ["project-members", projectId],
    queryFn: () => projectsApi.listMembers(projectId),
    enabled: !!projectId,
  });

  const { data: projectModels = [], isLoading: pmLoading } = useQuery({
    queryKey: ["project-models", projectId],
    queryFn: () => projectsApi.listModels(projectId),
    enabled: !!projectId,
  });

  const { data: allModels = [] } = useQuery({ queryKey: ["models"], queryFn: modelsApi.list });

  // Check if current user is owner of this project
  const isProjectOwner = useMemo(() => {
    if (!user || isAdmin) return isAdmin;
    return members.some((m) => m.user_id === user.id && m.role === "owner");
  }, [user, isAdmin, members]);

  const { data: allUsers = [] } = useQuery({ queryKey: ["users"], queryFn: usersApi.list, enabled: isProjectOwner });

  const updateProjectMutation = useMutation({
    mutationFn: () => projectsApi.update(projectId, editForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      setEditProjectOpen(false);
      setError("");
    },
    onError: (e: Error) => setError(e.message),
  });

  const addMemberMutation = useMutation({
    mutationFn: () => projectsApi.addMember(projectId, selectedUserId, memberRole),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-members", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      setAddMemberOpen(false);
      setSelectedUserId("");
      setMemberRole("member");
      setError("");
    },
    onError: (e: Error) => setError(e.message),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => projectsApi.removeMember(projectId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-members", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      projectsApi.updateMember(projectId, userId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project-members", projectId] }),
  });

  const addModelMutation = useMutation({
    mutationFn: () => projectsApi.addModel(projectId, selectedModelId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-models", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      setAddModelOpen(false);
      setSelectedModelId("");
      setError("");
    },
    onError: (e: Error) => setError(e.message),
  });

  const removeModelMutation = useMutation({
    mutationFn: (modelId: string) => projectsApi.removeModel(projectId, modelId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-models", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  if (pLoading) return <div className="text-muted-foreground text-sm">Loading project…</div>;
  if (!project) return <div className="text-sm text-muted-foreground">Project not found.</div>;

  const memberUserIds = new Set(members.map((m) => m.user_id));
  const projectModelIds = new Set(projectModels.map((pm) => pm.model_id));
  const availableUsers = allUsers.filter((u) => !memberUserIds.has(u.id));
  const availableModels = allModels.filter((m) => !projectModelIds.has(m.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/projects">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{project.project_name}</h1>
          <p className="text-sm font-mono text-muted-foreground">[{project.project_alias}]</p>
        </div>
        {isProjectOwner && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditForm({ project_name: project.project_name, project_alias: project.project_alias });
              setEditProjectOpen(true);
            }}
          >
            <Pencil className="w-4 h-4 mr-2" /> Edit
          </Button>
        )}
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
          <TabsTrigger value="models">Models ({projectModels.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">Manage project members and their roles</p>
            {isProjectOwner && (
              <Button size="sm" onClick={() => { setError(""); setAddMemberOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Add Member
              </Button>
            )}
          </div>
          <Card>
            <CardContent className="p-0">
              {mLoading ? (
                <p className="text-sm text-muted-foreground p-4">Loading…</p>
              ) : members.length === 0 ? (
                <p className="text-sm text-center text-muted-foreground p-8">No members yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Added</th>
                      {isProjectOwner && <th className="px-4 py-3"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((mem) => (
                      <tr key={mem.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                              {mem.user?.full_name.charAt(0).toUpperCase() ?? "?"}
                            </div>
                            <div>
                              <p className="font-medium">{mem.user?.full_name ?? "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">@{mem.user?.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {isProjectOwner ? (
                            <Select
                              value={mem.role}
                              onValueChange={(v) => updateMemberMutation.mutate({ userId: mem.user_id, role: v })}
                            >
                              <SelectTrigger className="h-7 w-28 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="owner">Owner</SelectItem>
                                <SelectItem value="member">Member</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                              mem.role === "owner"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                            }`}>
                              {mem.role === "owner" ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                              {mem.role}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(mem.added_at).toLocaleDateString()}
                        </td>
                        {isProjectOwner && (
                          <td className="px-4 py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              onClick={() => removeMemberMutation.mutate(mem.user_id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">Models available in this project</p>
            {isProjectOwner && (
              <Button size="sm" onClick={() => { setError(""); setAddModelOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Add Model
              </Button>
            )}
          </div>
          <Card>
            <CardContent className="p-0">
              {pmLoading ? (
                <p className="text-sm text-muted-foreground p-4">Loading…</p>
              ) : projectModels.length === 0 ? (
                <p className="text-sm text-center text-muted-foreground p-8">No models in this project yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Model</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Display Name</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Added</th>
                      {isProjectOwner && <th className="px-4 py-3"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {projectModels.map((pm) => (
                      <tr key={pm.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-xs">{pm.model?.model_name ?? pm.model_id}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{pm.model?.general_model_name ?? "—"}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(pm.added_at).toLocaleDateString()}
                        </td>
                        {isProjectOwner && (
                          <td className="px-4 py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              onClick={() => removeModelMutation.mutate(pm.model_id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={addMemberOpen} onOpenChange={(v) => { if (!v) { setError(""); } setAddMemberOpen(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user…" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.full_name} (@{u.username})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={memberRole} onValueChange={setMemberRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberOpen(false)}>Cancel</Button>
            <Button onClick={() => addMemberMutation.mutate()} disabled={!selectedUserId || addMemberMutation.isPending}>
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addModelOpen} onOpenChange={(v) => { if (!v) { setError(""); } setAddModelOpen(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Model</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Model</Label>
              <Select value={selectedModelId} onValueChange={setSelectedModelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model…" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.general_model_name ?? m.model_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModelOpen(false)}>Cancel</Button>
            <Button onClick={() => addModelMutation.mutate()} disabled={!selectedModelId || addModelMutation.isPending}>
              Add Model
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editProjectOpen} onOpenChange={(v) => { if (!v) { setError(""); } setEditProjectOpen(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input
                value={editForm.project_name}
                onChange={(e) => setEditForm((f) => ({ ...f, project_name: e.target.value }))}
                placeholder="Project name"
              />
            </div>
            <div className="space-y-2">
              <Label>Project Alias</Label>
              <Input
                value={editForm.project_alias}
                onChange={(e) => setEditForm((f) => ({ ...f, project_alias: e.target.value }))}
                placeholder="project_alias"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">Lowercase letters, digits, and underscores. Must start with a letter.</p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProjectOpen(false)}>Cancel</Button>
            <Button
              onClick={() => updateProjectMutation.mutate()}
              disabled={!editForm.project_name || !editForm.project_alias || updateProjectMutation.isPending}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
