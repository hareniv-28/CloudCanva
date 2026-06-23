"use client";
import { cn } from "@/lib/utils";
import { ServiceType } from "@/types/service";
import {
  Server,
  Database,
  Cloud,
  Box,
  CircuitBoard,
  Globe,
  Shield,
  Network,
  Route,
  Scale,
  Target,
  Zap,
} from "lucide-react";
import { useState } from "react";

interface ServiceItemProps {
  label: string;
  type: ServiceType;
  provider: string;
  rawLabel?: string;
  onDragStart: (
    event: React.DragEvent<HTMLDivElement>,
    nodeType: string
  ) => void;
}

const serviceIcons = {
  compute: Server,
  storage: Database,
  database: Database,
  network: Cloud,
  container: Box,
  kubernetes: CircuitBoard,
  elastic: Zap,
  InternetGateway: Globe,
  Subnet: Network,
  SecurityGroup: Shield,
  RouteTable: Route,
  LoadBalancer: Scale,
  TargetGroup: Target,
};


export default function ServiceItem({
  label,
  type,
  provider,
  rawLabel,
  onDragStart,
}: ServiceItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const Icon = serviceIcons[type as keyof typeof serviceIcons] || Cloud;

  const iconColors: Record<string, string> = {
    compute: "text-orange-500",
    storage: "text-green-500",
    database: "text-purple-500",
    network: "text-blue-500",
    container: "text-teal-500",
    kubernetes: "text-indigo-500",
    elastic: "text-yellow-500",
    InternetGateway: "text-emerald-500",
    Subnet: "text-cyan-500",
    SecurityGroup: "text-red-500",
    RouteTable: "text-pink-500",
    LoadBalancer: "text-amber-500",
    TargetGroup: "text-violet-500",
  };

  const iconColor = iconColors[type] || "text-blue-500";

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(true);
    onDragStart(event, JSON.stringify({ label, type, provider, rawLabel }));

    const dragImage = document.createElement("div");
    dragImage.classList.add("service-drag-preview");
    dragImage.innerHTML = `<div class="flex items-center gap-2 p-2 bg-card rounded-md shadow-md border"><span>${label}</span></div>`;
    document.body.appendChild(dragImage);
    dragImage.style.position = "absolute";
    dragImage.style.top = "-1000px";

    if (event.dataTransfer.setDragImage) {
      event.dataTransfer.setDragImage(dragImage, 20, 20);
    }

    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      className={cn(
        "service-item flex items-center gap-2 px-3 py-2.5 rounded-md cursor-grab",
        "border border-slate-500 transition-all duration-150",
        "bg-slate-900 hover:bg-slate-700 hover:border-slate-300",
        isDragging ? "opacity-50 border-primary" : ""
      )}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      draggable
    >
      <Icon size={16} className={iconColor} />
      <span className="text-sm font-medium text-white">{label}</span>
    </div>
  );
}
