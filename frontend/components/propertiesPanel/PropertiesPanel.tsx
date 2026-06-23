import ComputeFields from "./aws/ComputeFields";
import ContainerFields from "./ContainerFields";
import DatabaseFields from "./aws/DatabaseFields";
import StorageFields from "./aws/StorageFields";
import ElasticIPFields from "./aws/ElasticIPFields";
import SubnetFields from "./aws/SubnetFields";
import InternetGatewayFields from "./aws/InternetGateway";
import { Node } from "@xyflow/react";
import SecurityGroupFields from "./aws/Security_group";
import { AwsServiceType } from "@/types/service";
import VPCfields from "./aws/VPCfields";
import RouteTableFields from "./aws/RouteTableFields";
import LoadBalancerFields from "./aws/LoadBalancer";
import TargetGroupFields from "./aws/TargetGroup";

interface PropertiesPanelProps {
  selectedNode: Node | null;
  onNodeUpdate: (nodeId: string, data: any) => void;
}

export default function PropertiesPanel({
  selectedNode,
  onNodeUpdate,
}: PropertiesPanelProps) {
  if (!selectedNode) return null;

  const nodeType = selectedNode?.data.label as AwsServiceType;

  switch (nodeType) {
    case "EC2":
      return (
        <ComputeFields
          selectedNode={selectedNode}
          onNodeUpdate={onNodeUpdate}
        />
      );
    case "S3":
      return (
        <StorageFields
          selectedNode={selectedNode}
          onNodeUpdate={onNodeUpdate}
        />
      );
    case "ElasticIP":
      return (
        <ElasticIPFields
          selectedNode={selectedNode}
          onNodeUpdate={onNodeUpdate}
        />
      );
    case "InternetGateway":
      return (
        <InternetGatewayFields
          selectedNode={selectedNode}
          onNodeUpdate={onNodeUpdate}
        />
      );
    case "RDS":
      return (
        <DatabaseFields
          selectedNode={selectedNode}
          onNodeUpdate={onNodeUpdate}
        />
      );
    case "Subnet":
      return (
        <SubnetFields
          selectedNode={selectedNode}
          onNodeUpdate={onNodeUpdate}
        />
      );
    case "VPC":
      return (
        <VPCfields
          selectedNode={selectedNode}
          onNodeUpdate={onNodeUpdate}
        />
      );
    case "SecurityGroup":
      return (
        <SecurityGroupFields
          selectedNode={selectedNode}
          onNodeUpdate={onNodeUpdate}
        />
      );
    case "RouteTable":
      return (
        <RouteTableFields
          selectedNode={selectedNode}
          onNodeUpdate={onNodeUpdate}
        />
      );
    case "LoadBalancer":
      return (
        <LoadBalancerFields
          selectedNode={selectedNode}
          onNodeUpdate={onNodeUpdate}
        />
      );
    case "TargetGroup":
      return (
        <TargetGroupFields
          selectedNode={selectedNode}
          onNodeUpdate={onNodeUpdate}
        />
      );
    default:
      return (
        <ContainerFields
          selectedNode={selectedNode}
          onNodeUpdate={onNodeUpdate}
        />
      );
  }
}
