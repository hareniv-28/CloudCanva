"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, ArrowRight, Lightbulb } from "lucide-react";
import api from "@/lib/api";

interface AiArchitectureGeneratorProps {
  onArchitectureGenerated: (nodes: any[], edges: any[]) => void;
}

const examplePrompts = [
  "Build a scalable ecommerce app with authentication and database",
  "Create a three-tier web app with load balancer and RDS",
  "Set up a VPC with public and private subnets and NAT gateway",
  "Deploy a web server with auto-scaling and monitoring",
];

export function AiArchitectureGenerator({
  onArchitectureGenerated,
}: AiArchitectureGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<{
    nodes: any[];
    edges: any[];
    summary: string;
  } | null>(null);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please describe the infrastructure you want to build.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setGeneratedPreview(null);

    try {
      const response = await api.post("/ai/generate", {
        prompt: prompt.trim(),
        region: typeof window !== "undefined" ? (localStorage.getItem("cloudcanva-region") || "eu-north-1") : "eu-north-1",
      });
      const { nodes, edges, summary } = response.data;
      setGeneratedPreview({ nodes, edges, summary });
    } catch (error) {
      // Fallback: use mock when backend isn't available
      const mockResult = generateMockArchitecture(prompt);
      setGeneratedPreview(mockResult);
      toast({
        title: "Using mock generation",
        description: "Backend not available. Showing sample architecture.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (generatedPreview) {
      onArchitectureGenerated(generatedPreview.nodes, generatedPreview.edges);
      toast({
        title: "Architecture applied",
        description: "Generated infrastructure added to canvas.",
      });
      setOpen(false);
      setPrompt("");
      setGeneratedPreview(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-slate-300 text-slate-900 border-slate-400 hover:bg-slate-200 font-medium">
          <Sparkles className="h-4 w-4" />
          AI Generate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto bg-[#0f172a] border border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-sky-400" />
            AI Architecture Generator
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Describe your infrastructure in plain English. AI will generate the
            architecture for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-slate-700 bg-[#1e293b] p-1">
            <Textarea
              placeholder="Example: Build a scalable web application with load balancer, EC2 instances, and RDS database..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="resize-none bg-transparent border-0 text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {!generatedPreview && (
            <div className="rounded-lg border border-slate-700 bg-[#1e293b] p-4 space-y-3">
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Lightbulb className="h-3 w-3 text-amber-400" />
                Try an example:
              </p>
              <div className="flex flex-wrap gap-2">
                {examplePrompts.map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(example)}
                    className="text-xs px-3 py-1.5 rounded-md border border-slate-600 bg-slate-800 hover:bg-slate-700 hover:border-sky-500 transition-colors text-left text-slate-300"
                  >
                    {example.length > 45 ? example.substring(0, 45) + "..." : example}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="w-full bg-sky-500 hover:bg-sky-600 text-white border-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Architecture
              </>
            )}
          </Button>

          {generatedPreview && (
            <div className="space-y-4 rounded-lg border border-slate-700 bg-[#1e293b] p-4">
              <h4 className="font-medium text-sm text-sky-400">Generated Architecture</h4>
              <p className="text-sm text-slate-300">
                {generatedPreview.summary}
              </p>
              <div className="rounded-md border border-slate-600 bg-slate-800/50 p-3 space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Services ({generatedPreview.nodes.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {generatedPreview.nodes.map((node: any, i: number) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30"
                    >
                      {node.data?.label}
                    </span>
                  ))}
                </div>
              </div>
              {generatedPreview.edges.length > 0 && (
                <div className="rounded-md border border-slate-600 bg-slate-800/50 p-3 space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Connections ({generatedPreview.edges.length})
                  </p>
                  <div className="text-xs text-slate-300">
                    {generatedPreview.edges.map((edge: any, i: number) => (
                      <span key={i} className="block">
                        {edge.source} → {edge.target}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {generatedPreview && (
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setGeneratedPreview(null)} className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600">
              Regenerate
            </Button>
            <Button onClick={handleApply} className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white border-0">
              Apply to Canvas
              <ArrowRight className="h-4 w-4" />
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Mock generator for development (replace with real Bedrock later)
function generateMockArchitecture(prompt: string) {
  const p = prompt.toLowerCase();

  if (p.includes("ecommerce") || p.includes("web app") || p.includes("three-tier")) {
    return {
      summary: "Scalable three-tier architecture with VPC, ALB, EC2, and RDS.",
      nodes: [
        { id: "ai-vpc-1", type: "service", position: { x: 250, y: 50 }, data: { label: "VPC", type: "network", provider: "aws", rawLabel: "vpc", serviceName: "Main VPC", properties: { name: "main-vpc", cidr_block: "10.0.0.0/16", enable_dns_support: true, enable_dns_hostname: true, tags: {} } } },
        { id: "ai-subnet-1", type: "service", position: { x: 100, y: 200 }, data: { label: "Subnet", type: "Subnet", provider: "aws", rawLabel: "subnet", serviceName: "Public Subnet", properties: { name: "public-subnet", cidr_block: "10.0.1.0/24", map_public_ip_on_launch: true, refs: { vpc: "ai-vpc-1" }, tags: {} } } },
        { id: "ai-subnet-2", type: "service", position: { x: 400, y: 200 }, data: { label: "Subnet", type: "Subnet", provider: "aws", rawLabel: "subnet", serviceName: "Private Subnet", properties: { name: "private-subnet", cidr_block: "10.0.2.0/24", map_public_ip_on_launch: false, refs: { vpc: "ai-vpc-1" }, tags: {} } } },
        { id: "ai-alb-1", type: "service", position: { x: 100, y: 350 }, data: { label: "LoadBalancer", type: "LoadBalancer", provider: "aws", rawLabel: "load_balancer", serviceName: "App ALB", properties: { name: "app-alb", load_balancer_type: "application", internal: false, tags: {} } } },
        { id: "ai-ec2-1", type: "service", position: { x: 250, y: 500 }, data: { label: "EC2", type: "compute", provider: "aws", rawLabel: "aws_instance", serviceName: "Web Server", properties: { name: "web-server", ami: "ami-0c55b159cbfafe1f0", instance_type: "t3.medium", tags: { Role: "web" }, refs: {} } } },
        { id: "ai-rds-1", type: "service", position: { x: 450, y: 500 }, data: { label: "RDS", type: "database", provider: "aws", rawLabel: "rds_instance", serviceName: "App Database", properties: { name: "app-db", engine: "postgresql", instance_class: "db.t3.medium", allocated_storage: 20, tags: {} } } },
        { id: "ai-sg-1", type: "service", position: { x: 550, y: 350 }, data: { label: "SecurityGroup", type: "SecurityGroup", provider: "aws", rawLabel: "security_group", serviceName: "Web SG", properties: { name: "web-sg", description: "Web server security group", refs: { vpc: "ai-vpc-1" }, ingress: [{ protocol: "tcp", from_port: 80, to_port: 80, cidr_blocks: ["0.0.0.0/0"], description: "HTTP" }], egress: [{ protocol: "-1", from_port: 0, to_port: 0, cidr_blocks: ["0.0.0.0/0"], description: "All outbound" }], tags: {} } } },
      ],
      edges: [
        { id: "ai-e1", source: "ai-alb-1", target: "ai-ec2-1" },
        { id: "ai-e2", source: "ai-ec2-1", target: "ai-rds-1" },
        { id: "ai-e3", source: "ai-ec2-1", target: "ai-sg-1" },
      ],
    };
  }

  if (p.includes("vpc") || p.includes("network") || p.includes("subnet")) {
    return {
      summary: "VPC with public/private subnets, internet gateway, and route table.",
      nodes: [
        { id: "ai-vpc-1", type: "service", position: { x: 250, y: 50 }, data: { label: "VPC", type: "network", provider: "aws", rawLabel: "vpc", serviceName: "Main VPC", properties: { name: "main-vpc", cidr_block: "10.0.0.0/16", enable_dns_support: true, enable_dns_hostname: true, tags: {} } } },
        { id: "ai-igw-1", type: "service", position: { x: 100, y: 200 }, data: { label: "InternetGateway", type: "InternetGateway", provider: "aws", rawLabel: "internet_gateway", serviceName: "Main IGW", properties: { name: "main-igw", tags: {}, refs: { vpc: "ai-vpc-1" } } } },
        { id: "ai-subnet-1", type: "service", position: { x: 100, y: 350 }, data: { label: "Subnet", type: "Subnet", provider: "aws", rawLabel: "subnet", serviceName: "Public Subnet", properties: { name: "public-subnet", cidr_block: "10.0.1.0/24", map_public_ip_on_launch: true, refs: { vpc: "ai-vpc-1" }, tags: {} } } },
        { id: "ai-subnet-2", type: "service", position: { x: 400, y: 350 }, data: { label: "Subnet", type: "Subnet", provider: "aws", rawLabel: "subnet", serviceName: "Private Subnet", properties: { name: "private-subnet", cidr_block: "10.0.2.0/24", map_public_ip_on_launch: false, refs: { vpc: "ai-vpc-1" }, tags: {} } } },
        { id: "ai-rt-1", type: "service", position: { x: 250, y: 500 }, data: { label: "RouteTable", type: "RouteTable", provider: "aws", rawLabel: "route_table", serviceName: "Public RT", properties: { name: "public-rt", tags: {}, refs: { internet_gateway: "ai-igw-1" }, routes: [] } } },
      ],
      edges: [
        { id: "ai-e1", source: "ai-igw-1", target: "ai-vpc-1" },
        { id: "ai-e2", source: "ai-subnet-1", target: "ai-rt-1" },
      ],
    };
  }

  // Default: simple EC2 setup
  return {
    summary: "Basic AWS setup with VPC, subnet, EC2, and security group.",
    nodes: [
      { id: "ai-vpc-1", type: "service", position: { x: 200, y: 50 }, data: { label: "VPC", type: "network", provider: "aws", rawLabel: "vpc", serviceName: "Main VPC", properties: { name: "main-vpc", cidr_block: "10.0.0.0/16", enable_dns_support: true, enable_dns_hostname: true, tags: {} } } },
      { id: "ai-subnet-1", type: "service", position: { x: 200, y: 200 }, data: { label: "Subnet", type: "Subnet", provider: "aws", rawLabel: "subnet", serviceName: "Public Subnet", properties: { name: "public-subnet", cidr_block: "10.0.1.0/24", map_public_ip_on_launch: true, refs: { vpc: "ai-vpc-1" }, tags: {} } } },
      { id: "ai-ec2-1", type: "service", position: { x: 200, y: 400 }, data: { label: "EC2", type: "compute", provider: "aws", rawLabel: "aws_instance", serviceName: "App Server", properties: { name: "app-server", ami: "ami-0c55b159cbfafe1f0", instance_type: "t3.micro", tags: {}, refs: {} } } },
      { id: "ai-sg-1", type: "service", position: { x: 450, y: 300 }, data: { label: "SecurityGroup", type: "SecurityGroup", provider: "aws", rawLabel: "security_group", serviceName: "App SG", properties: { name: "app-sg", description: "Allow SSH and HTTP", refs: { vpc: "ai-vpc-1" }, ingress: [{ protocol: "tcp", from_port: 22, to_port: 22, cidr_blocks: ["0.0.0.0/0"], description: "SSH" }], egress: [{ protocol: "-1", from_port: 0, to_port: 0, cidr_blocks: ["0.0.0.0/0"], description: "All outbound" }], tags: {} } } },
    ],
    edges: [
      { id: "ai-e1", source: "ai-ec2-1", target: "ai-sg-1" },
    ],
  };
}
