import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Pencil, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { modelsApi } from "@/lib/api";
import type { Model } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";

export default function ModelsPage() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [editModel, setEditModel] = useState<Model | null>(null);
  const [form, setForm] = useState({ general_model_name: "", release_date: "", context_length: "" });
  const [syncResult, setSyncResult] = useState<{ synced: number; errors: string[] } | null>(null);
  const [error, setError] = useState("");

  const { data: models = [], isLoading } = useQuery({ queryKey: ["models"], queryFn: modelsApi.list });

  const syncMutation = useMutation({
    mutationFn: modelsApi.sync,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["models"] });
      setSyncResult(data);
    },
    onError: (e: Error) => setError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => modelsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["models"] }); setEditModel(null); },
    onError: (e: Error) => setError(e.message),
  });

  const openEdit = (m: Model) => {
    setEditModel(m);
    setForm({
      general_model_name: m.general_model_name ?? "",
      release_date: m.release_date ?? "",
      context_length: m.context_length?.toString() ?? "",
    });
    setError("");
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModel) return;
    updateMutation.mutate({
      id: editModel.id,
      data: {
        general_model_name: form.general_model_name || undefined,
        release_date: form.release_date || undefined,
        context_length: form.context_length ? Number(form.context_length) : undefined,
      },
    });
  };

  if (isLoading) return <div className="text-muted-foreground text-sm">Loading models…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Models</h1>
          <p className="text-sm text-white/70 mt-1 font-light">{models.length} models available</p>
        </div>
        {isAdmin && (
          <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} size="sm" variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            Sync from LiteLLM
          </Button>
        )}
      </div>

      {syncResult && (
        <div className={`flex items-start gap-2 text-sm p-3 rounded-lg ${
          syncResult.errors.length > 0 ? "bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300" : "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300"
        }`}>
          {syncResult.errors.length === 0 ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
          <div>
            <p className="font-medium">Synced {syncResult.synced} models</p>
            {syncResult.errors.map((err, i) => <p key={i} className="text-xs mt-1">{err}</p>)}
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/20 bg-white/5">
                  <th className="text-left px-4 py-3 font-semibold text-white uppercase text-xs tracking-wide">Model Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-white uppercase text-xs tracking-wide">Display Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-white uppercase text-xs tracking-wide">Input/Output Cost</th>
                  <th className="text-left px-4 py-3 font-semibold text-white uppercase text-xs tracking-wide">TPM / RPM</th>
                  <th className="text-left px-4 py-3 font-semibold text-white uppercase text-xs tracking-wide">Context</th>
                  {isAdmin && <th className="px-4 py-3"></th>}
                </tr>
              </thead>
              <tbody>
                {models.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-white/60">
                      No models yet. {isAdmin && "Sync from LiteLLM to get started."}
                    </td>
                  </tr>
                ) : models.map((m) => (
                  <tr key={m.id} className="border-b border-white/10 last:border-0 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-medium text-white">{m.model_name}</p>
                    </td>
                    <td className="px-4 py-3 text-white/80">{m.general_model_name ?? <span className="text-white/40 italic">—</span>}</td>
                    <td className="px-4 py-3 text-xs text-white/80 font-mono">
                      {m.input_cost_per_token != null ? `$${m.input_cost_per_token} / $${m.output_cost_per_token}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-white/80">
                      {m.tpm != null ? `${m.tpm.toLocaleString()} / ${m.rpm}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-white/80">
                      {m.context_length != null ? m.context_length.toLocaleString() : "—"}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(m)} className="h-7 w-7 p-0">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editModel} onOpenChange={(v) => { if (!v) setEditModel(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Model Info</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs font-mono text-muted-foreground">{editModel?.model_name}</p>
            </div>
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={form.general_model_name} onChange={(e) => setForm((f) => ({ ...f, general_model_name: e.target.value }))} placeholder="e.g. GPT-4o" />
            </div>
            <div className="space-y-2">
              <Label>Release Date</Label>
              <Input type="date" value={form.release_date} onChange={(e) => setForm((f) => ({ ...f, release_date: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Context Length</Label>
              <Input type="number" value={form.context_length} onChange={(e) => setForm((f) => ({ ...f, context_length: e.target.value }))} placeholder="e.g. 128000" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditModel(null)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
