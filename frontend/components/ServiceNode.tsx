"use client";
import { Handle, Position, NodeResizer } from "@xyflow/react";
import {
  Cloud,
  Database,
  Server,
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
import { cn } from "@/lib/utils";

interface ServiceNodeProps {
  data: {
    label: string;
    type: string;
    provider: string;
    rawLabel?: string;
    serviceName?: string;
  };
  selected: boolean;
  id: string;
}

const serviceIcons: Record<string, any> = {
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

const iconColors: Record<string, string> = {
  compute: "text-orange-400",
  storage: "text-green-400",
  database: "text-purple-400",
  network: "text-blue-400",
  container: "text-teal-400",
  kubernetes: "text-indigo-400",
  elastic: "text-yellow-400",
  InternetGateway: "text-emerald-400",
  Subnet: "text-cyan-400",
  SecurityGroup: "text-red-400",
  RouteTable: "text-pink-400",
  LoadBalancer: "text-amber-400",
  TargetGroup: "text-violet-400",
};

export default function ServiceNode({ data, selected, id }: ServiceNodeProps) {
  const ServiceIcon = serviceIcons[data.type] || Cloud;
  const iconColor = iconColors[data.type] || "text-blue-400";

  return (
    <div
      className={cn("service-node", selected && "ring-2 ring-blue-400")}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        minWidth: 170,
        minHeight: 120,
      }}
    >
      <NodeResizer
        minWidth={170}
        minHeight={120}
        isVisible={selected}
        lineClassName="border-primary/30"
        handleClassName="bg-background border-primary"
      />

      <div className="service-node-header">
        <ServiceIcon size={18} className={iconColor} />
        <span className="text-xs font-bold tracking-wide">{data.label}</span>
      </div>

      <div className="service-node-content flex flex-col items-center justify-center flex-1">
        <ServiceIcon size={36} className={cn("mb-2", iconColor)} />
        <span className="text-base font-bold text-white leading-tight text-center">
          {data.serviceName || data.label}
        </span>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">
          {data.type}
        </span>
      </div>

      <Handle type="target" position={Position.Top} id="1" />
      <Handle type="source" position={Position.Bottom} id="2" />
      <Handle type="target" position={Position.Left} id="3" />
      <Handle type="source" position={Position.Right} id="4" />
    </div>
  );
}
