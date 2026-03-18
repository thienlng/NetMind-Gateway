import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, RefreshCw, Copy, Check, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { keysApi, projectsApi } from "@/lib/api";
import type { Key } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";

export default function KeysPage() {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newKeyData, setNewKeyData] = useState<{ raw_key: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    key_name: "",
    project_id: "",
    user_id: "self",
    type: "personal",
    max_budget: "",
    tpm_limit: "",
    rpm_limit: "",
    models: [] as string[],
  });

  const { data: keys = [], isLoading } = useQuery({ queryKey: ["keys"], queryFn: keysApi.list });
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: projectsApi.list });

  // Fetch models for selected project
  const { data: projectModels = [] } = useQuery({
    queryKey: ["project-models", form.project_id],
    queryFn: () => projectsApi.listModels(form.project_id),
    enabled: !!form.project_id,
  });

  // Fetch members for selected project to check ownership
  const { data: projectMembers = [] } = useQuery({
    queryKey: ["project-members", form.project_id],
    queryFn: () => projectsApi.listMembers(form.project_id),
    enabled: !!form.project_id,
  });

  // Check if current user is owner of the selected project
  const isProjectOwner = useMemo(() => {
    if (!user || isAdmin) return isAdmin;
    return projectMembers.some(
      (m) => m.user_id === user.id && m.role === "owner"
    );
  }, [user, isAdmin, projectMembers]);

  const createMutation = useMutation({
    mutationFn: () =>
      keysApi.create({
        key_name: form.key_name,
        project_id: form.project_id,
        user_id: form.user_id && form.user_id !== "self" ? form.user_id : undefined,
        type: form.type,
        max_budget: form.max_budget ? Number(form.max_budget) : undefined,
        tpm_limit: form.tpm_limit ? Number(form.tpm_limit) : undefined,
        rpm_limit: form.rpm_limit ? Number(form.rpm_limit) : undefined,
        models: form.models,
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["keys"] });
      setOpen(false);
      if (data.raw_key) setNewKeyData({ raw_key: data.raw_key });
      resetForm();
    },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: keysApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["keys"] }),
  });

  const regenerateMutation = useMutation({
    mutationFn: keysApi.regenerate,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["keys"] });
      if (data.raw_key) setNewKeyData({ raw_key: data.raw_key });
    },
    onError: (e: Error) => setError(e.message),
  });

  const resetForm = () => {
    setForm({ key_name: "", project_id: "", user_id: "self", type: "personal", max_budget: "", tpm_limit: "", rpm_limit: "", models: [] });
    setError("");
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleShow = (id: string) => setShowKeys((s) => ({ ...s, [id]: !s[id] }));

  if (isLoading) return <div className="text-muted-foreground text-sm">Loading keys…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-sm text-muted-foreground mt-1">{keys.length} keys total</p>
        </div>
        <Button onClick={() => { resetForm(); setOpen(true); }} size="sm">
          <Plus className="w-4 h-4 mr-2" /> New Key
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Alias</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Key</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Spend</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {keys.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No keys yet.</td>
                  </tr>
                ) : keys.map((k) => (
                  <tr key={k.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-xs text-foreground max-w-[200px] truncate" title={k.key_alias}>{k.key_alias}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                          {showKeys[k.id] ? k.key_token : k.key_display}
                        </code>
                        <button onClick={() => toggleShow(k.id)} className="text-muted-foreground hover:text-foreground">
                          {showKeys[k.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${k.type === "service"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        }`}>
                        {k.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">${Number(k.spend).toFixed(4)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(k.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => regenerateMutation.mutate(k.id)}
                          title="Regenerate"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => deleteMutation.mutate(k.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Key Name</Label>
              <Input value={form.key_name} onChange={(e) => setForm((f) => ({ ...f, key_name: e.target.value }))} placeholder="e.g. my_api_key" required />
            </div>
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={form.project_id} onValueChange={(v) => setForm((f) => ({ ...f, project_id: v, models: [] }))}>
                <SelectTrigger><SelectValue placeholder="Select project…" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v, user_id: "self" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal</SelectItem>
                  {isProjectOwner && <SelectItem value="service">Service</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            {form.type === "personal" && isProjectOwner && form.project_id && (
              <div className="space-y-2">
                <Label>Assign to Member</Label>
                <Select value={form.user_id} onValueChange={(v) => setForm((f) => ({ ...f, user_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Current User (Myself)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">Current User (Myself)</SelectItem>
                    {projectMembers
                      .filter((m) => m.user_id !== user?.id)
                      .map((m) => (
                        <SelectItem key={m.user_id} value={m.user_id}>
                          {m.user?.username ?? "Unknown User"} ({m.role})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {form.project_id && projectModels.length > 0 && (
              <div className="space-y-2">
                <Label>Models</Label>
                <ScrollArea className="h-32 rounded-md border p-2">
                  <div className="space-y-2">
                    {projectModels.map((pm) => (
                      <label key={pm.model_id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/30 p-1 rounded">
                        <Checkbox
                          checked={form.models.includes(pm.model?.model_name ?? "")}
                          onCheckedChange={(checked) => {
                            const modelName = pm.model?.model_name ?? "";
                            setForm((f) => ({
                              ...f,
                              models: checked
                                ? [...f.models, modelName]
                                : f.models.filter((m) => m !== modelName),
                            }));
                          }}
                        />
                        <span className="text-sm">{pm.model?.general_model_name ?? pm.model?.model_name ?? "Unknown"}</span>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
                <p className="text-xs text-muted-foreground">
                  {form.models.length === 0 ? "All models allowed" : `${form.models.length} model${form.models.length > 1 ? "s" : ""} selected`}
                </p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Max Budget ($)</Label>
                <Input type="number" step="0.01" value={form.max_budget} onChange={(e) => setForm((f) => ({ ...f, max_budget: e.target.value }))} placeholder="Unlimited" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">TPM Limit</Label>
                <Input type="number" value={form.tpm_limit} onChange={(e) => setForm((f) => ({ ...f, tpm_limit: e.target.value }))} placeholder="—" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">RPM Limit</Label>
                <Input type="number" value={form.rpm_limit} onChange={(e) => setForm((f) => ({ ...f, rpm_limit: e.target.value }))} placeholder="—" />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!form.key_name || !form.project_id || createMutation.isPending}>
              Create Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!newKeyData} onOpenChange={(v) => { if (!v) setNewKeyData(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Copy your key now — it will not be shown again.
            </p>
            <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
              <code className="flex-1 text-xs font-mono break-all">{newKeyData?.raw_key}</code>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={() => copyKey(newKeyData?.raw_key ?? "")}>
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setNewKeyData(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
