"use client";
import { Node, Edge } from "@xyflow/react";
import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useMemo } from "react";

interface ValidationPanelProps {
  nodes: Node[];
  edges: Edge[];
}

interface ValidationError {
  nodeId: string;
  nodeName: string;
  message: string;
  severity: "error" | "warning";
}

export default function ValidationPanel({ nodes, edges }: ValidationPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  const errors = useMemo(() => validateArchitecture(nodes, edges), [nodes, edges]);

  if (nodes.length === 0) return null;

  return (
    <div className="border-t mt-4 pt-4">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors w-full"
      >
        {errors.length === 0 ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
        )}
        Validation ({errors.length} {errors.length === 1 ? "issue" : "issues"})
        {collapsed ? <ChevronDown className="h-3 w-3 ml-auto" /> : <ChevronUp className="h-3 w-3 ml-auto" />}
      </button>

      {!collapsed && (
        <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
          {errors.length === 0 ? (
            <p className="text-xs text-green-600">All checks passed. Architecture looks valid.</p>
          ) : (
            errors.map((error, i) => (
              <div
                key={i}
                className={`text-xs p-2 rounded-md border ${
                  error.severity === "error"
                    ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300"
                    : "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-300"
                }`}
              >
                <span className="font-medium">{error.nodeName}:</span> {error.message}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function validateArchitecture(nodes: Node[], edges: Edge[]): ValidationError[] {
  const errors: ValidationError[] = [];

  nodes.forEach((node) => {
    const label = node.data.label;
    const props = node.data.properties || {};
    const name = node.data.serviceName || label;

    switch (label) {
      case "EC2":
        if (!props.ami) {
          errors.push({ nodeId: node.id, nodeName: name, message: "Missing AMI", severity: "error" });
        }
        if (!props.instance_type) {
          errors.push({ nodeId: node.id, nodeName: name, message: "Missing instance type", severity: "error" });
        }
        if (!props.refs?.subnet && !node.parentId) {
          errors.push({ nodeId: node.id, nodeName: name, message: "Not placed in a subnet", severity: "warning" });
        }
        break;

      case "Subnet":
        if (!props.cidr_block) {
          errors.push({ nodeId: node.id, nodeName: name, message: "Missing CIDR block", severity: "error" });
        }
        if (!props.refs?.vpc && !node.parentId) {
          errors.push({ nodeId: node.id, nodeName: name, message: "Not inside a VPC", severity: "error" });
        }
        break;

      case "VPC":
        if (!props.cidr_block) {
          errors.push({ nodeId: node.id, nodeName: name, message: "Missing CIDR block", severity: "error" });
        }
        break;

      case "SecurityGroup":
        if (!props.refs?.vpc) {
          errors.push({ nodeId: node.id, nodeName: name, message: "No VPC reference", severity: "warning" });
        }
        if ((!props.ingress || props.ingress.length === 0) && (!props.egress || props.egress.length === 0)) {
          errors.push({ nodeId: node.id, nodeName: name, message: "No ingress or egress rules defined", severity: "warning" });
        }
        break;

      case "RDS":
        if (!props.engine) {
          errors.push({ nodeId: node.id, nodeName: name, message: "Missing database engine", severity: "error" });
        }
        break;

      case "LoadBalancer":
        if (!props.name) {
          errors.push({ nodeId: node.id, nodeName: name, message: "Missing load balancer name", severity: "warning" });
        }
        break;

      case "InternetGateway":
        if (!props.refs?.vpc) {
          errors.push({ nodeId: node.id, nodeName: name, message: "Not attached to a VPC", severity: "error" });
        }
        break;
    }
  });

  return errors;
}
