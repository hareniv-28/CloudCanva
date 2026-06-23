import { Node } from "@xyflow/react";

export interface ServiceNodeData {
  label: string;
  type: string;
  provider: string;
  properties: Record<string, any>;
  rawLabel?: string;
  serviceName?: string;
  connections?: string[];
  [key: string]: unknown;
}

export interface ServiceNode extends Node<ServiceNodeData> {}
