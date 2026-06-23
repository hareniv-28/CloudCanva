"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AuthGuard } from "@/components/AuthGuard";
import { Layers, FolderOpen, Download, Trash2, ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import "@/lib/cognito";

interface Project {
  project_name: string;
  created_at: string;
  node_count: number;
  s3_key: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const res = await api.get("/projects");
      setProjects(res.data.projects || []);
    } catch (err: any) {
      setError("Failed to load projects");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(projectName: string) {
    try {
      const res = await api.get(
        `/projects/${encodeURIComponent(projectName)}/download`
      );
      window.open(res.data.download_url, "_blank");
    } catch (err) {
      console.error("Download failed:", err);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/projects/${encodeURIComponent(deleteTarget)}`);
      setProjects((prev) => prev.filter((p) => p.project_name !== deleteTarget));
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AuthGuard>
      <div className="h-screen flex flex-col bg-[#0f172a]">
        <header className="border-b border-slate-700 p-4 flex justify-between items-center bg-[#1e293b] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
              <Layers size={16} className="text-white" />
            </div>
            <h1 className="font-bold text-xl text-white">My Projects</h1>
          </div>
          <Button variant="outline" onClick={() => router.push("/")} className="gap-1.5 bg-slate-700 text-white border-slate-600 hover:bg-slate-600">
            <ArrowLeft size={14} />
            Back to Canvas
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6">
          {loading && <p className="text-slate-400">Loading projects...</p>}
          {error && <p className="text-red-400">{error}</p>}

          {!loading && projects.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg">No projects yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Export an architecture from the canvas to see it here.
              </p>
              <Button className="mt-4 bg-sky-500 hover:bg-sky-600 text-white" onClick={() => router.push("/")}>
                Go to Canvas
              </Button>
            </div>
          )}

          {projects.length > 0 && (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.project_name}
                  className="border border-slate-700 rounded-lg p-4 flex items-center justify-between bg-[#1e293b] hover:bg-[#263348] transition-colors duration-150"
                >
                  <div className="flex items-center gap-3">
                    <FolderOpen size={20} className="text-sky-400" />
                    <div>
                      <h3 className="font-medium text-white">{project.project_name}</h3>
                      <p className="text-sm text-slate-400">
                        {new Date(project.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {project.node_count} nodes
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleDownload(project.project_name)}
                      className="gap-1.5 bg-sky-500 text-white hover:bg-sky-600 border-0"
                    >
                      <Download size={14} />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setDeleteTarget(project.project_name)}
                      className="gap-1.5 bg-orange-500 text-white hover:bg-orange-600 border-0"
                    >
                      <Trash2 size={14} />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </main>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <DialogContent className="bg-[#0f172a] border border-slate-600 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Delete Project</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-slate-400 py-4">
              Are you sure you want to delete <strong className="text-white">"{deleteTarget}"</strong>? This cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)} className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600">
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting} className="bg-red-600 hover:bg-red-700">
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}
