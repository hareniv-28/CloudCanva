import { ServiceData } from "@/types/service";

export const services: ServiceData = {
  aws: [
    { label: "EC2", type: "compute", rawLabel: "aws_instance" },
    { label: "S3", type: "storage", rawLabel: "s3_bucket" },
    { label: "RDS", type: "database", rawLabel: "rds_instance" },
    { label: "VPC", type: "network", rawLabel: "vpc" },
    { label: "ECS", type: "container", rawLabel: "ecs_cluster" },
    { label: "EKS", type: "kubernetes", rawLabel: "eks_cluster" },
    { label: "ElasticIP", type: "elastic", rawLabel: "aws_eip" },
    { label: "InternetGateway", type: "InternetGateway", rawLabel: "internet_gateway" },
    { label: "Subnet", type: "Subnet", rawLabel: "subnet" },
    { label: "SecurityGroup", type: "SecurityGroup", rawLabel: "security_group" },
    { label: "RouteTable", type: "RouteTable", rawLabel: "route_table" },
    { label: "LoadBalancer", type: "LoadBalancer", rawLabel: "load_balancer" },
    { label: "TargetGroup", type: "TargetGroup", rawLabel: "target_group" },
  ],
};

