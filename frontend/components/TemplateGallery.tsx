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
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Server, Database, Cloud } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  nodes: any[];
  edges: any[];
}

const templates: Template[] = [
  {
    id: "three-tier",
    name: "Three-Tier Web App",
    description: "VPC, ALB, EC2 instances, and RDS database",
    icon: <Server className="h-8 w-8 text-primary" />,
    nodes: [
      { id: "tpl-vpc-1", type: "service", position: { x: 300, y: 50 }, data: { label: "VPC", type: "network", provider: "aws", rawLabel: "vpc", serviceName: "App VPC", properties: { name: "app-vpc", cidr_block: "10.0.0.0/16", enable_dns_support: true, enable_dns_hostname: true, tags: {} } } },
      { id: "tpl-subnet-pub", type: "service", position: { x: 150, y: 200 }, data: { label: "Subnet", type: "Subnet", provider: "aws", rawLabel: "subnet", serviceName: "Public Subnet", properties: { name: "public-subnet", cidr_block: "10.0.1.0/24", availability_zone: "us-east-1a", map_public_ip_on_launch: true, refs: { vpc: "tpl-vpc-1" }, tags: {} } } },
      { id: "tpl-subnet-priv", type: "service", position: { x: 450, y: 200 }, data: { label: "Subnet", type: "Subnet", provider: "aws", rawLabel: "subnet", serviceName: "Private Subnet", properties: { name: "private-subnet", cidr_block: "10.0.2.0/24", availability_zone: "us-east-1a", map_public_ip_on_launch: false, refs: { vpc: "tpl-vpc-1" }, tags: {} } } },
      { id: "tpl-alb", type: "service", position: { x: 150, y: 350 }, data: { label: "LoadBalancer", type: "LoadBalancer", provider: "aws", rawLabel: "load_balancer", serviceName: "App ALB", properties: { name: "app-alb", load_balancer_type: "application", internal: false, refs: { subnets: ["tpl-subnet-pub", "tpl-subnet-priv"], security_groups: [] }, tags: {} } } },
      { id: "tpl-ec2", type: "service", position: { x: 300, y: 500 }, data: { label: "EC2", type: "compute", provider: "aws", rawLabel: "aws_instance", serviceName: "Web Server", properties: { name: "web-server", ami: "ami-0c02fb55956c7d316", instance_type: "t3.medium", tags: {}, refs: { subnet: "tpl-subnet-pub", security_group: "" } } } },
      { id: "tpl-rds", type: "service", position: { x: 500, y: 500 }, data: { label: "RDS", type: "database", provider: "aws", rawLabel: "rds_instance", serviceName: "App Database", properties: { name: "app-db", engine: "postgresql", instance_class: "db.t3.medium", allocated_storage: 20, tags: {} } } },
    ],
    edges: [
      { id: "tpl-e1", source: "tpl-alb", target: "tpl-ec2" },
      { id: "tpl-e2", source: "tpl-ec2", target: "tpl-rds" },
    ],
  },
  {
    id: "static-site",
    name: "Static Website",
    description: "S3 bucket with CloudFront-ready setup",
    icon: <Cloud className="h-8 w-8 text-primary" />,
    nodes: [
      { id: "tpl-vpc-1", type: "service", position: { x: 250, y: 50 }, data: { label: "VPC", type: "network", provider: "aws", rawLabel: "vpc", serviceName: "Site VPC", properties: { name: "site-vpc", cidr_block: "10.0.0.0/16", enable_dns_support: true, enable_dns_hostname: true, tags: {} } } },
      { id: "tpl-subnet-1", type: "service", position: { x: 250, y: 150 }, data: { label: "Subnet", type: "Subnet", provider: "aws", rawLabel: "subnet", serviceName: "Site Subnet", properties: { name: "site-subnet", cidr_block: "10.0.1.0/24", availability_zone: "us-east-1a", map_public_ip_on_launch: true, refs: { vpc: "tpl-vpc-1" }, tags: {} } } },
      { id: "tpl-s3", type: "service", position: { x: 250, y: 350 }, data: { label: "S3", type: "storage", provider: "aws", rawLabel: "s3_bucket", serviceName: "Website Bucket", properties: { bucket: "my-static-website", region: "us-east-1", acl: "public-read", versioning: { enabled: true }, tags: {} } } },
      { id: "tpl-ec2", type: "service", position: { x: 450, y: 350 }, data: { label: "EC2", type: "compute", provider: "aws", rawLabel: "aws_instance", serviceName: "Build Server", properties: { name: "build-server", ami: "ami-0c02fb55956c7d316", instance_type: "t3.micro", tags: {}, refs: { subnet: "tpl-subnet-1" } } } },
    ],
    edges: [
      { id: "tpl-e1", source: "tpl-ec2", target: "tpl-s3" },
    ],
  },
  {
    id: "database-cluster",
    name: "Database Cluster",
    description: "VPC with RDS, security groups, and private subnets",
    icon: <Database className="h-8 w-8 text-primary" />,
    nodes: [
      { id: "tpl-vpc-1", type: "service", position: { x: 250, y: 50 }, data: { label: "VPC", type: "network", provider: "aws", rawLabel: "vpc", serviceName: "DB VPC", properties: { name: "db-vpc", cidr_block: "10.0.0.0/16", enable_dns_support: true, enable_dns_hostname: true, tags: {} } } },
      { id: "tpl-subnet-1", type: "service", position: { x: 100, y: 200 }, data: { label: "Subnet", type: "Subnet", provider: "aws", rawLabel: "subnet", serviceName: "DB Subnet AZ1", properties: { name: "db-subnet-az1", cidr_block: "10.0.1.0/24", availability_zone: "us-east-1a", map_public_ip_on_launch: false, refs: { vpc: "tpl-vpc-1" }, tags: {} } } },
      { id: "tpl-subnet-2", type: "service", position: { x: 400, y: 200 }, data: { label: "Subnet", type: "Subnet", provider: "aws", rawLabel: "subnet", serviceName: "DB Subnet AZ2", properties: { name: "db-subnet-az2", cidr_block: "10.0.2.0/24", availability_zone: "us-east-1b", map_public_ip_on_launch: false, refs: { vpc: "tpl-vpc-1" }, tags: {} } } },
      { id: "tpl-sg", type: "service", position: { x: 250, y: 350 }, data: { label: "SecurityGroup", type: "SecurityGroup", provider: "aws", rawLabel: "security_group", serviceName: "DB Security Group", properties: { name: "db-sg", description: "Allow PostgreSQL", refs: { vpc: "tpl-vpc-1" }, ingress: [{ protocol: "tcp", from_port: 5432, to_port: 5432, cidr_blocks: ["10.0.0.0/16"], description: "PostgreSQL" }], egress: [{ protocol: "-1", from_port: 0, to_port: 0, cidr_blocks: ["0.0.0.0/0"], description: "All outbound" }], tags: {} } } },
      { id: "tpl-rds", type: "service", position: { x: 250, y: 500 }, data: { label: "RDS", type: "database", provider: "aws", rawLabel: "rds_instance", serviceName: "Primary DB", properties: { name: "primary-db", engine: "postgresql", instance_class: "db.t3.medium", allocated_storage: 50, tags: {} } } },
    ],
    edges: [
      { id: "tpl-e1", source: "tpl-rds", target: "tpl-sg" },
    ],
  },
];

interface TemplateGalleryProps {
  onTemplateApplied?: (nodes: any[], edges: any[]) => void;
}

export function TemplateGallery({ onTemplateApplied }: TemplateGalleryProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleUseTemplate = () => {
    if (selectedTemplate && onTemplateApplied) {
      onTemplateApplied(selectedTemplate.nodes, selectedTemplate.edges);
      toast({
        title: "Template applied",
        description: `${selectedTemplate.name} has been loaded onto the canvas.`,
      });
      setOpen(false);
      setSelectedTemplate(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-slate-300 text-slate-900 border-slate-400 hover:bg-slate-200 font-medium">Templates</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[#0f172a] border border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Infrastructure Templates</DialogTitle>
          <DialogDescription className="text-slate-400">
            Choose a pre-configured template to get started quickly.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`flex items-center p-4 rounded-lg cursor-pointer border transition-colors ${
                selectedTemplate?.id === template.id
                  ? "border-sky-500 bg-sky-500/10"
                  : "border-slate-700 bg-[#1e293b] hover:border-slate-500"
              }`}
              onClick={() => setSelectedTemplate(template)}
            >
              <div className="mr-4 text-sky-400">{template.icon}</div>
              <div>
                <h4 className="font-medium text-white">{template.name}</h4>
                <p className="text-sm text-slate-400">
                  {template.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button onClick={handleUseTemplate} disabled={!selectedTemplate} className="bg-sky-500 hover:bg-sky-600 text-white border-0">
            Use Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
