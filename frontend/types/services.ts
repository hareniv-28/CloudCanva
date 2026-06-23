export type ServiceProviderType = "aws";

export type AwsServiceType =
  | "EC2"
  | "S3"
  | "VPC"
  | "RDS"
  | "EKS"
  | "ECS"
  | "SecurityGroup"
  | "RouteTable"
  | "LoadBalancer"
  | "TargetGroup"
  | "InternetGateway"
  | "ElasticIP"
  | "Subnet";

export type ServiceType =
  | "compute"
  | "storage"
  | "database"
  | "network"
  | "container"
  | "kubernetes"
  | "elastic"
  | "SecurityGroup"
  | "RouteTable"
  | "LoadBalancer"
  | "TargetGroup"
  | "InternetGateway"
  | "Subnet";

export interface Service {
  label: string;
  type: ServiceType;
  rawLabel?: string;
}

export interface ServiceData {
  [provider: string]: Service[];
}
