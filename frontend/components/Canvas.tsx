"use client";


import ValidationPanel from "./ValidationPanel";
import { QuotaCheck } from "./QuotaCheck";
import { IAMPolicyGenerator } from "./IAMPolicyGenerator";

import api from "@/lib/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  Panel,
  Connection,
  Edge,
  Node,
  ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import ServiceNode from "@/components/ServiceNode";
import ServicePanel from "@/components/ServicePanel";
import PropertiesPanel from "@/components/propertiesPanel/PropertiesPanel";
import { getLayoutedElements } from "@/lib/layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Save,
  Minimize,
  Maximize,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getPropertiesByType } from "@/components/getPropertiesByType";
import ResizableNode from "./ResizableNode";
import { udpateConnections } from "./dependencyResolver";
import {
  handleDependencyCleanup,
  handleNodeDependencyCleanup,
} from "./dependencyCleaner";

const nodeTypes = {
  service: ServiceNode,
  resizable: ResizableNode,
};

interface elasticIP_association {
  provider: string;
  type: string;
  id: string;
  refs: {
    instance: string;
    eip: string;
  };
  depends_on: Array<{ type: string; id: string }>;
}

interface CanvasProps {
  aiNodes?: any[] | null;
  aiEdges?: any[] | null;
  selectedRegion?: string;
  onAiApplied?: () => void;
}

export default function Canvas({ aiNodes, aiEdges, selectedRegion = "eu-north-1", onAiApplied }: CanvasProps) {

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { theme, resolvedTheme } = useTheme();
  const edgeColor = resolvedTheme === "dark" ? "#ffffff" : "#000000";
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(240);
  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  const [leftResizing, setLeftResizing] = useState(false);
  const [rightResizing, setRightResizing] = useState(false);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [projectNames, setProjectNames] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showProjectList, setShowProjectList] = useState(false);
  const { toast } = useToast();
  const [hasMounted, setHasMounted] = useState(false);

  const [elasticIP_association, setElasticIPAssociation] = useState<
    elasticIP_association[]
  >([]);

  const { getViewport, setViewport, screenToFlowPosition, getNode } =
    useReactFlow();

  const userEmail = "firstone";

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  
  // Save to localStorage after mount
  useEffect(() => {
    if (hasMounted) {
      const eip_association = elasticIP_association;
      localStorage.setItem(
        "canvasData",
        JSON.stringify({ nodes, edges, eip_association })
      );
    }
  }, [nodes, edges, hasMounted]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem("canvasData");
    if (savedData) {
      const {
        nodes: savedNodes,
        edges: savedEdges,
        eip_association,
      } = JSON.parse(savedData);
      setNodes(savedNodes);
      setEdges(savedEdges);
      setElasticIPAssociation(eip_association || []);
    }
    setHasMounted(true);
  }, []);
  useEffect(() => {
    if (aiNodes && aiEdges) {
      // Build connections arrays from edges
      const connectionsMap: Record<string, string[]> = {};
      aiEdges.forEach((edge: any) => {
        if (!connectionsMap[edge.source]) connectionsMap[edge.source] = [];
        if (!connectionsMap[edge.target]) connectionsMap[edge.target] = [];
        connectionsMap[edge.source].push(edge.target);
        connectionsMap[edge.target].push(edge.source);
      });

      // Apply connections to nodes
      const nodesWithConnections = aiNodes.map((node: any) => ({
        ...node,
        data: {
          ...node.data,
          connections: connectionsMap[node.id] || [],
        },
      }));

      setNodes(nodesWithConnections as any);
      setEdges(aiEdges as any);
      setElasticIPAssociation([]);
      if (onAiApplied) onAiApplied();
    }
  }, [aiNodes, aiEdges]);

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const dataStr = event.dataTransfer.getData("application/json");
      if (!dataStr) return;

      try {
        const data = JSON.parse(dataStr);
        const position = screenToFlowPosition({
          x: event.clientX || 0,
          y: event.clientY || 0,
        });

        const newNode = {
          id: `${data.provider}-${data.type}-${nodes.length + 1}`,
          type: "service",
          position,
          data: {
            label: data.label,
            type: data.type,
            provider: data.provider,
            properties: getPropertiesByType(data.label, data.provider),
            rawLabel: data.rawLabel,
            serviceName: data.label,
          },
        };

        setNodes((nds) => nds.concat(newNode));
        toast({
          title: "Service added",
          description: `Added ${data.label} to the canvas.`,
        });
      } catch (error) {
        console.error("Error parsing drag data:", error);
        toast({
          title: "Error adding service",
          description: "Failed to add service to canvas.",
          variant: "destructive",
        });
      }
    },
    [screenToFlowPosition, nodes, setNodes, toast]
  );

  const handleConnect = useCallback(
    (params: Connection | Edge) => {
      const source = getNode(params.source);
      const destination = getNode(params.target);

      if (!source || !destination) return;

      const source_type = source?.data.label;
      const destination_type = destination?.data.label;
      const source_raw_type = source?.data.rawLabel;
      const destination_raw_type = destination?.data.rawLabel;

      // Track connections
      udpateConnections(source, destination.id, updateNodeData);
      udpateConnections(destination, source.id, updateNodeData);

      // EC2 + SecurityGroup
      if (source_type === "EC2" && destination_type === "SecurityGroup") {
        const updatedData = {
          ...source.data,
          properties: {
            ...source.data.properties,
            refs: {
              ...(source.data.properties?.refs || {}),
              securityGroup: destination.id,
            },
          },
        };
        updateNodeData(source.id, updatedData);
      } else if (source_type === "SecurityGroup" && destination_type === "EC2") {
        const updatedData = {
          ...destination.data,
          properties: {
            ...destination.data.properties,
            refs: {
              ...(destination.data.properties?.refs || {}),
              securityGroup: source.id,
            },
          },
        };
        updateNodeData(destination.id, updatedData);
      }
      // VPC connections — set refs.vpc on Subnet, InternetGateway, SecurityGroup, RouteTable
      else if (source_type === "VPC" || destination_type === "VPC") {
        const vpcNode = source_type === "VPC" ? source : destination;
        const otherNode = source_type === "VPC" ? destination : source;
        const otherType = otherNode.data.label;

        if (["Subnet", "InternetGateway", "SecurityGroup", "RouteTable"].includes(otherType)) {
          const updatedData = {
            ...otherNode.data,
            properties: {
              ...otherNode.data.properties,
              refs: {
                ...(otherNode.data.properties?.refs || {}),
                vpc: vpcNode.id,
              },
            },
          };
          updateNodeData(otherNode.id, updatedData);
        }
      }
      // EC2 + Subnet — set refs.subnet on EC2
      else if (
        (source_type === "EC2" && destination_type === "Subnet") ||
        (source_type === "Subnet" && destination_type === "EC2")
      ) {
        const ec2Node = source_type === "EC2" ? source : destination;
        const subnetNode = source_type === "Subnet" ? source : destination;
        const updatedData = {
          ...ec2Node.data,
          properties: {
            ...ec2Node.data.properties,
            refs: {
              ...(ec2Node.data.properties?.refs || {}),
              subnet: subnetNode.id,
            },
          },
        };
        updateNodeData(ec2Node.id, updatedData);
      }
      // ElasticIP association
      else if (source_type === "ElasticIP" || destination_type === "ElasticIP") {
        const otherType = source_type === "ElasticIP" ? destination_type : source_type;
        
        // EIP can only be associated with EC2 instances
        if (otherType !== "EC2") {
          toast({
            title: "Invalid connection",
            description: "Elastic IP can only be associated with an EC2 instance.",
            variant: "destructive",
          });
          return;
        }

        const eipId =
          source.data.label === "ElasticIP" ? source.id : destination.id;

        const isAssociated = elasticIP_association.some(
          (assoc) => assoc.refs.eip === eipId
        );

        if (isAssociated) {
          toast({
            title: "Elastic IP already in use",
            description: `ElasticIP ${eipId} is already associated with another instance.`,
            variant: "destructive",
          });
          return;
        }

        const data = {
          provider: "aws",
          type: "eip_association",
          id: `${source.id}-${destination.id}`,
          refs: {
            instance: source_type === "ElasticIP" ? destination.id : source.id,
            eip: source_type === "ElasticIP" ? source.id : destination.id,
          },
          depends_on: [
            { type: source_raw_type, id: source.id },
            { type: destination_raw_type, id: destination.id },
          ],
        };
        setElasticIPAssociation((prev) => [...prev, data]);
      }
      // RouteTable + InternetGateway
      else if (source_type === "RouteTable" || destination_type === "RouteTable") {
        const routeTableId =
          source.data.label === "RouteTable" ? source.id : destination.id;
        const otherNode = source.data.label === "RouteTable" ? destination : source;
        const routeTableNode = getNode(routeTableId);
        if (routeTableNode) {
          const updatedRefs = { ...(routeTableNode.data.properties?.refs || {}) };
          
          if (otherNode.data.label === "InternetGateway") {
            updatedRefs.internet_gateway = otherNode.id;
          } else if (otherNode.data.label === "VPC") {
            updatedRefs.vpc = otherNode.id;
          }
          
          const updatedData = {
            ...routeTableNode.data,
            properties: {
              ...routeTableNode.data.properties,
              refs: updatedRefs,
            },
          };
          updateNodeData(routeTableId, updatedData);
        }
      }
      // TargetGroup + EC2
      else if (source_type === "TargetGroup" || destination_type === "TargetGroup") {
        const targetGroupId =
          source.data.label === "TargetGroup" ? source.id : destination.id;
        const instanceId =
          source.data.label === "EC2" ? source.id : destination.id;
        const targetGroupNode = getNode(targetGroupId);
        if (targetGroupNode) {
          const updatedData = {
            ...targetGroupNode.data,
            properties: {
              ...targetGroupNode.data.properties,
              refs: {
                ...(targetGroupNode.data.properties?.refs || {}),
                targets: [
                  ...(targetGroupNode.data.properties?.refs?.targets || []),
                  instanceId,
                ],
              },
            },
          };
          updateNodeData(targetGroupId, updatedData);
        }
      }
      // LoadBalancer + Subnet/SecurityGroup
      else if (source_type === "LoadBalancer" || destination_type === "LoadBalancer") {
        const loadBalancerId =
          source.data.label === "LoadBalancer" ? source.id : destination.id;
        const otherId =
          source.data.label === "LoadBalancer" ? destination.id : source.id;
        const otherNode = getNode(otherId);
        const loadBalancerNode = getNode(loadBalancerId);
        if (loadBalancerNode && otherNode) {
          const updatedData = {
            ...loadBalancerNode.data,
            properties: {
              ...loadBalancerNode.data.properties,
              refs: {
                ...(loadBalancerNode.data.properties?.refs || {}),
                ...(otherNode.data.label === "Subnet" && {
                  subnets: [
                    ...(loadBalancerNode.data.properties?.refs?.subnets || []),
                    otherId,
                  ],
                }),
                ...(otherNode.data.label === "SecurityGroup" && {
                  security_groups: [
                    ...(loadBalancerNode.data.properties?.refs?.security_groups || []),
                    otherId,
                  ],
                }),
              },
            },
          };
          updateNodeData(loadBalancerId, updatedData);
        }
      }

      setEdges((eds) => addEdge(params, eds));
      toast({
        title: "Connection established",
        description: `Connected ${source.data.label} to ${destination.data.label}.`,
      });
    },
    [setEdges, getNode, elasticIP_association, toast]
  );

  const onNodeDragStop = useCallback(
    (_event: any, draggedNode: Node) => {
      const potentialParents = nodes.filter((n) => n.id !== draggedNode.id);
      const draggedX = draggedNode.position.x;
      const draggedY = draggedNode.position.y;

      const CanParent = potentialParents
        .map((parent) => {
          const parentX = parent.position.x;
          const parentY = parent.position.y;
          const parentWidth = Number(parent.measured?.width || 100);
          const parentHeight = Number(parent.measured?.height || 80);

          const isInside =
            draggedX > parentX &&
            draggedX < parentX + parentWidth &&
            draggedY > parentY &&
            draggedY < parentY + parentHeight;

          if (!isInside) return null;

          const distance =
            Math.abs(draggedX - parentX) +
            Math.abs(parentX + parentWidth - draggedX) +
            Math.abs(draggedY - parentY) +
            Math.abs(parentY + parentHeight - draggedY);

          return { parent, distance };
        })
        .filter(Boolean)
        .sort((a, b) => a!.distance - b!.distance);

      const parent = CanParent?.[0]?.parent;

      if (parent) {
        if (draggedNode.data.label === "ElasticIP") return;

       if (!(parent.data.label === "VPC" || parent.data.label === "Subnet")) {
  setNodes((nds) =>
    nds.map((n) =>
      n.id === draggedNode.id
        ? { ...n, position: selectedNode?.position || draggedNode.position }
        : n
    )
  );
  return;
}


        let vpcId = "";
        let subnetId = "";
        for (const item of CanParent) {
          if (!vpcId && item.parent.data.label === "VPC") vpcId = item.parent.id;
          else if (!subnetId && item.parent.data.label === "Subnet") subnetId = item.parent.id;
          if (vpcId && subnetId) break;
        }

        setNodes((nds) =>
          nds.map((n) =>
            n.id === draggedNode.id
              ? {
                  ...n,
                  parentId: parent.id,
                  extent: "parent",
                  data: {
                    ...n.data,
                    properties: {
                      ...n.data?.properties,
                      refs: {
                        ...(n.data?.properties?.refs || {}),
                        ...(vpcId && { vpc: vpcId }),
                        ...(subnetId && { subnet: subnetId }),
                      },
                    },
                  },
                }
              : n
          )
        );
      }
    },
    [nodes, setNodes, selectedNode]
  );

  // Panel resizing
  const startLeftResizing = useCallback((event: React.MouseEvent) => {
    setLeftResizing(true);
    event.preventDefault();
  }, []);

  const startRightResizing = useCallback((event: React.MouseEvent) => {
    setRightResizing(true);
    event.preventDefault();
  }, []);

  const stopResizing = useCallback(() => {
    setLeftResizing(false);
    setRightResizing(false);
  }, []);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (leftResizing) {
        setLeftPanelWidth(Math.max(200, Math.min(event.clientX, 400)));
      } else if (rightResizing) {
        setRightPanelWidth(Math.max(200, Math.min(window.innerWidth - event.clientX, 500)));
      }
    },
    [leftResizing, rightResizing]
  );

  const toggleLeftPanel = useCallback(() => {
    setLeftPanelCollapsed(!leftPanelCollapsed);
  }, [leftPanelCollapsed]);

  const toggleRightPanel = useCallback(() => {
    setRightPanelCollapsed(!rightPanelCollapsed);
  }, [rightPanelCollapsed]);

  const updateNodeData = useCallback(
    (nodeId: string, data: any) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...data,
                serviceName:
                  data.properties?.name ||
                  data.properties?.bucket ||
                  data?.label,
              },
            };
          }
          return node;
        })
      );

      setSelectedNode((prev) => {
        if (prev && prev.id === nodeId) {
          return {
            ...prev,
            data: {
              ...data,
              serviceName: data.name || data.label,
            },
          };
        }
        return prev;
      });
    },
    [setNodes]
  );

  const generateId = (length = 8) => {
    const letters = "abcdefghijklmnopqrstuvwxyz";
    let id = "";
    for (let i = 0; i < length; i++) {
      id += letters[Math.floor(Math.random() * letters.length)];
    }
    return id;
  };

  const handleSave = async () => {
    if (!userEmail) return;

    const diagramName = prompt("Enter a name for your project:");
    if (!diagramName) return;

    try {
      await api.post("/api/save-diagram", {
        userEmail,
        project_name: diagramName,
        nodes,
        edges,
        elasticIP_association,
      });

      toast({
        title: "Diagram saved",
        description: `Successfully saved ${diagramName}`,
      });
    } catch (err) {
      console.error("Failed to save diagram:", err);
      toast({
        title: "Error",
        description: "Failed to save diagram.",
        variant: "destructive",
      });
    }
  };

  const loadDiagram = async () => {
    try {
      const res = await api.get(`/api/load-diagram?email=${userEmail}`);
      const names = res.data.map((project: any) => project.project_name);
      setProjectNames(names);
      setShowProjectList(true);
    } catch (err) {
      console.error("Error loading project names:", err);
      toast({
        title: "Error",
        description: "Failed to load project names.",
        variant: "destructive",
      });
    }
  };

  const loadSpecificDiagram = async (projectName: string) => {
    try {
      const res = await api.get(
        `/api/load-diagram-name?name=${projectName}&email=${userEmail}`
      );
      const { nodes, edges, elasticIP_association } = res.data[0];
      setNodes(nodes);
      setEdges(edges);
      setElasticIPAssociation(elasticIP_association || []);
      setShowProjectList(false);
      setSelectedProject(projectName);
      toast({
        title: "Diagram loaded",
        description: `Successfully loaded ${projectName}`,
      });
    } catch (err) {
      console.error("Error loading diagram:", err);
      toast({
        title: "Error",
        description: "Failed to load diagram.",
        variant: "destructive",
      });
    }
  };

  function handleNodeDelete(deletedNodes: Node[]) {
    setElasticIPAssociation((prev) =>
      prev.filter(
        (assoc) =>
          !deletedNodes.some(
            (node) =>
              node.id === assoc.refs.eip || node.id === assoc.refs.instance
          )
      )
    );
  }

  function handleEdgeDelete(deletedEdges: Edge[]) {
    deletedEdges.forEach((edge) => {
      const sourceNode = getNode(edge.source);
      const targetNode = getNode(edge.target);

      const isElasticIP = (node: Node | undefined) =>
        node?.data?.label === "ElasticIP";

      if (isElasticIP(sourceNode) || isElasticIP(targetNode)) {
        setElasticIPAssociation((prev) =>
          prev.filter(
            (assoc) =>
              !(
                (assoc.refs.eip === edge.source &&
                  assoc.refs.instance === edge.target) ||
                (assoc.refs.eip === edge.target &&
                  assoc.refs.instance === edge.source)
              )
          )
        );
      }

      handleDependencyCleanup(
        edge.source,
        edge.target,
        getNode,
        updateNodeData
      );
    });
  }

  function generateConfig() {
    const name = "infrastructure";
    let services: any[] = [];

    nodes.forEach((node: Node) => {
      if (node.data.label === "SecurityGroup") return;
      services.push({
        id: node.id,
        provider: node.data.provider,
        type: node.data.rawLabel,
        ...(typeof node.data.properties === "object" && node.data.properties
          ? node.data.properties
          : {}),
      });
    });

    // Add EIP associations
    elasticIP_association.forEach((eip_association) => {
      services.push(eip_association);
    });

    // Add Security Groups with ingress/egress rules
    const securityGroupNodes = nodes.filter(
      (node: Node) => node.data.label === "SecurityGroup"
    );

    securityGroupNodes.forEach((node: Node) => {
      const ingressRules = node.data.properties.ingress || [];
      const egressRules = node.data.properties.egress || [];

      services.push({
        provider: node.data.provider,
        type: node.data.rawLabel,
        id: node.id,
        refs: node.data.properties.refs,
        description: node.data.properties.description,
        tags: node.data.properties.tags,
      });

      ingressRules.forEach((rule: any) => {
        services.push({
          provider: node.data.provider,
          type: "vpc_security_group_ingress_rule",
          id: generateId(),
          refs: { security_group: node.id },
          ...rule,
        });
      });

      egressRules.forEach((rule: any) => {
        services.push({
          provider: node.data.provider,
          type: "vpc_security_group_egress_rule",
          id: generateId(),
          refs: { security_group: node.id },
          ...rule,
        });
      });
    });

    return {
      connected_services: [{ name, services }],
    };
  }

 const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportProjectName, setExportProjectName] = useState("");
  const [exporting, setExporting] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);

  async function handleExport() {
    setShowExportDialog(true);
  }

  async function handleExportConfirm() {
    if (!exportProjectName.trim()) return;
    setExporting(true);

    const exportData = generateConfig();
    try {
        const response = await api.post("/generate", {
            ...exportData,
            project_name: exportProjectName.trim(),
            region: selectedRegion,
        }, {
            responseType: "blob",
        });
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${exportProjectName.trim()}.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast({ title: "Export successful", description: `Project "${exportProjectName.trim()}" exported and saved.` });
        setShowExportDialog(false);
        setExportProjectName("");
    } catch (error) {
        console.error("Error exporting:", error);
        toast({ title: "Error", description: "Failed to export diagram.", variant: "destructive" });
    } finally {
        setExporting(false);
    }
  }



  function handleClearCanvas() {
    setShowClearDialog(true);
  }

  function confirmClearCanvas() {
    setNodes([]);
    setEdges([]);
    setElasticIPAssociation([]);
    setSelectedNode(null);
    localStorage.removeItem("canvasData");
    toast({ title: "Canvas cleared", description: "All nodes and connections removed." });
    setShowClearDialog(false);
  }


  async function validateInfra() {
    const config = generateConfig();
    try {
      const response = await api.post("/validate", {

        config,
      });
      if (response.data.success) {
        toast({ title: "Validation successful", description: "Your infrastructure is valid." });
      } else {
        toast({ title: "Validation failed", description: "Check your architecture.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Validation failed", description: "Could not reach validation service.", variant: "destructive" });
    }
  }

  return (
    <div
      className="flex h-full relative"
      onMouseMove={handleMouseMove as any}
      onMouseUp={stopResizing}
      onMouseLeave={stopResizing}
    >
      {/* Left panel (Services) */}
      <div
        className={`flex-shrink-0 border-r bg-card transition-all duration-300 ease-in-out ${
          leftPanelCollapsed ? "w-0 opacity-0 overflow-hidden" : ""
        }`}
        style={{ width: leftPanelCollapsed ? 0 : `${leftPanelWidth}px` }}
      >
        <ServicePanel
          onDragStart={(event, data) => {
            event.dataTransfer.setData("application/json", data);
          }}
        />
      </div>

      {/* Left panel toggle */}
      <button
        className="absolute left-0 top-4 z-10 bg-card/80 rounded-r-md p-1 shadow-md hover:bg-primary/20 transition-all"
        onClick={toggleLeftPanel}
      >
        {leftPanelCollapsed ? <Maximize size={16} /> : <Minimize size={16} />}
      </button>

      {/* Left resizer */}
      {!leftPanelCollapsed && (
        <div
          className="flex-shrink-0 h-full w-1 bg-transparent hover:bg-primary/30 cursor-col-resize transition-all"
          onMouseDown={startLeftResizing}
        />
      )}

      {/* Main canvas */}
      <div className="flex-1 h-full" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          nodeTypes={nodeTypes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          fitView
          snapToGrid
          snapGrid={[20, 20]}
          deleteKeyCode={["Backspace", "Delete"]}
          defaultEdgeOptions={{
            animated: false,
            style: { stroke: edgeColor, strokeWidth: 2.5 },
          }}
          onNodesDelete={handleNodeDelete}
          onEdgesDelete={handleEdgeDelete}
          onNodeDragStop={onNodeDragStop}
        >
          <Controls />
          <MiniMap zoomable pannable />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />

          <Panel position="top-center">
            <div className="flex gap-4 items-center bg-slate-800 shadow-lg rounded-lg px-8 py-3 border border-slate-600 min-w-[400px] justify-center">
                <Button variant="outline" size="sm" onClick={handleExport} className="bg-slate-300 text-slate-900 border-slate-400 hover:bg-slate-200 font-medium h-9 px-5">
                    <Save size={14} className="mr-1.5" />
                    Export
                </Button>
                <Button variant="outline" size="sm" onClick={validateInfra} className="bg-slate-300 text-slate-900 border-slate-400 hover:bg-slate-200 font-medium h-9 px-5">
                    <Save size={14} className="mr-1.5" />
                    Validate
                </Button>
                <Button variant="outline" size="sm" onClick={handleClearCanvas} className="bg-slate-300 text-red-600 border-slate-400 hover:bg-slate-200 font-medium h-9 px-5">
                    Clear
                </Button>
             </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Right resizer */}
      {!rightPanelCollapsed && (
        <div
          className="flex-shrink-0 h-full w-1 bg-transparent hover:bg-primary/30 cursor-col-resize transition-all"
          onMouseDown={startRightResizing}
        />
      )}

      {/* Right panel toggle */}
      <button
        className="absolute right-0 top-4 z-10 bg-card/80 rounded-l-md p-1 shadow-md hover:bg-primary/20 transition-all"
        onClick={toggleRightPanel}
      >
        {rightPanelCollapsed ? <Maximize size={16} /> : <Minimize size={16} />}
      </button>

      {/* Right panel (Properties) */}
      <div
        className={`flex-shrink-0 border-l border-slate-700 p-3 overflow-y-scroll bg-[#0a0f1a] transition-all duration-300 ease-in-out ${
          rightPanelCollapsed ? "w-0 opacity-0 overflow-hidden" : ""
        }`}
        style={{ width: rightPanelCollapsed ? 0 : `${rightPanelWidth}px` }}
      >
        <PropertiesPanel
  selectedNode={selectedNode}
  onNodeUpdate={updateNodeData}
/>
<ValidationPanel nodes={nodes} edges={edges} />
<QuotaCheck getConfig={generateConfig} />
<IAMPolicyGenerator getConfig={generateConfig} />

      </div>

      {/* Clear Canvas Confirmation Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent className="sm:max-w-[400px] bg-[#0f172a] border border-slate-600 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-400">
              Clear Canvas
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-300">Clear entire canvas? This cannot be undone.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowClearDialog(false)} className="bg-slate-700 text-white border-slate-500 hover:bg-slate-600">
              Cancel
            </Button>
            <Button onClick={confirmClearCanvas} className="bg-red-600 text-white hover:bg-red-700 border-0">
              Clear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Project Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-[450px] bg-[#0f172a] border border-slate-600 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-sky-400 flex items-center gap-2">
              <Save size={20} />
              Export Project
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-400">Save your architecture as a Terraform project. You can access it later from My Projects.</p>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Project Name</label>
              <Input
                placeholder="e.g. my-vpc-setup"
                value={exportProjectName}
                onChange={(e) => setExportProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleExportConfirm();
                }}
                className="h-11 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-sky-400"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowExportDialog(false)} className="bg-slate-700 text-white border-slate-500 hover:bg-slate-600">
              Cancel
            </Button>
            <Button onClick={handleExportConfirm} disabled={exporting || !exportProjectName.trim()} className="bg-sky-500 text-white hover:bg-sky-600 border-0">
              {exporting ? "Exporting..." : "Export & Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
