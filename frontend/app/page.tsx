"use client";
import { useState } from "react";
import Canvas from "@/components/Canvas";
import { ReactFlowProvider } from "@xyflow/react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TemplateGallery } from "@/components/TemplateGallery";
import { ThemeProvider } from "next-themes";
import { AiArchitectureGenerator } from "@/components/AiArchitectureGenerator";
import { Toaster } from "@/components/ui/toaster";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { Cloud } from "lucide-react";

import "@/lib/cognito";

const Index = () => {
  const [aiNodes, setAiNodes] = useState<any[] | null>(null);
  const [aiEdges, setAiEdges] = useState<any[] | null>(null);
  const [selectedRegion, setSelectedRegion] = useState("eu-north-1");
  const { user, signOut } = useAuth();

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    if (typeof window !== "undefined") {
      localStorage.setItem("cloudcanva-region", region);
    }
  };

  const handleAiGenerated = (nodes: any[], edges: any[]) => {
    setAiNodes(nodes);
    setAiEdges(edges);
  };

  return (
    <AuthGuard>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="h-screen flex flex-col overflow-hidden">
        <header className="border-b px-5 py-2.5 flex items-center bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 z-10 shadow-md">
            {/* Left: Logo */}
            <div className="flex items-center gap-2 mr-auto">
              <img src="/logo.png" alt="CloudCanva" className="w-8 h-8 rounded-full border border-slate-400 object-contain" />
              <h1 className="font-bold text-2xl tracking-tight text-white">CloudCanva</h1>
            </div>

            {/* Right: All controls evenly spaced, same height */}
            <div className="flex items-center gap-4">
              <AiArchitectureGenerator
                onArchitectureGenerated={handleAiGenerated}
              />
              <TemplateGallery onTemplateApplied={handleAiGenerated} />
              <a
                href="/projects"
                className="text-xs font-medium text-slate-900 px-3 h-9 flex items-center rounded-md bg-slate-300 border border-slate-400 hover:bg-slate-200 transition-colors"
              >
                My Projects
              </a>
              <select
                value={selectedRegion}
                onChange={(e) => handleRegionChange(e.target.value)}
                className="text-xs bg-slate-300 text-slate-900 font-medium rounded-md px-2.5 h-9 border border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="eu-north-1">EU North (Stockholm)</option>
                <option value="us-east-1">US East (Virginia)</option>
                <option value="us-west-2">US West (Oregon)</option>
                <option value="eu-west-1">EU West (Ireland)</option>
                <option value="ap-south-1">AP South (Mumbai)</option>
                <option value="ap-northeast-1">AP NE (Tokyo)</option>
              </select>
              <div className="flex items-center gap-2 px-3 h-9 rounded-md bg-slate-300 border border-slate-400">
                <div className="w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">
                    {(user?.signInDetails?.loginId || user?.username || "U")[0].toUpperCase()}
                  </span>
                </div>
                <span className="text-xs text-slate-900 font-medium hidden sm:inline max-w-[130px] truncate">
                  {user?.signInDetails?.loginId || user?.username}
                </span>
              </div>
              <button
                onClick={signOut}
                className="text-xs text-slate-900 font-medium px-3 h-9 rounded-md bg-slate-300 border border-slate-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
              >
                Sign out
              </button>
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-hidden">
            <ReactFlowProvider>
              <Canvas
                aiNodes={aiNodes}
                aiEdges={aiEdges}
                selectedRegion={selectedRegion}
                onAiApplied={() => {
                  setAiNodes(null);
                  setAiEdges(null);
                }}
              />
            </ReactFlowProvider>
          </main>
        </div>
        <Toaster />
      </ThemeProvider>
    </AuthGuard>
  );
};

export default Index;
