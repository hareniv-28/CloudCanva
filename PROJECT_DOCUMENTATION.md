# CloudCanva — Project Documentation

## 1. Project Overview

**CloudCanva** is an AI-powered visual cloud infrastructure design and Terraform code generation platform. It enables users to design AWS architectures through a drag-and-drop canvas interface, use AI (Amazon Bedrock with Claude) to generate architectures from natural language prompts, validate designs against AWS quotas and security best practices, and export production-ready Terraform code as a downloadable zip file.

Think of it as **"Figma for AWS infrastructure"** — users visually compose their cloud architecture and get deployable Infrastructure-as-Code output.

---

## 2. Core Features

| Feature | Description |
|---------|-------------|
| **Visual Canvas Editor** | Drag-and-drop React Flow canvas for composing AWS resources (VPC, EC2, RDS, S3, etc.) with visual connections between them |
| **AI Architecture Generation** | Natural language → infrastructure. Users type "Build me a three-tier web app" and get a full architecture laid out on canvas |
| **Terraform Code Generation** | Converts the visual design into valid `.tf` files using Jinja2 templates, packaged as a downloadable zip |
| **Template Gallery** | Pre-built architecture patterns (e-commerce, VPC networking, basic EC2) users can apply instantly |
| **Project Management** | Save, load, list, and delete projects. Projects persist across sessions via DynamoDB + S3 |
| **Multi-Region Support** | 6 AWS regions supported with region-specific AMI IDs and availability zones |
| **AWS Quota Checking** | Static and live quota validation to prevent deployments that would exceed AWS limits |
| **IAM Policy Generation** | Auto-generates the minimum IAM policy needed to deploy the designed infrastructure |
| **IAM Permission Validation** | Simulates required actions against the user's IAM role to confirm deployment will succeed |
| **Architecture Validation** | Checks for missing references, incomplete properties, and security risks before export |
| **Security Guardrails** | Automatically restricts SSH/DB ports from open internet access; warns about risky configurations |
| **Authentication** | AWS Cognito-based sign-up/sign-in with JWT token verification |

---

## 3. Tech Stack

### 3.1 Frontend

| Technology | Role |
|-----------|------|
| Next.js 15 | React framework (App Router) |
| React 19 | UI library |
| TypeScript 5 | Type safety |
| @xyflow/react 12 + reactflow 11 | Graph/canvas visualization |
| AWS Amplify 6 | Cognito authentication |
| Tailwind CSS 3.4 | Styling |
| Shadcn/ui + Radix UI | Component library |
| React Hook Form 7 + Zod 4 | Form handling and validation |
| Dagre | Automatic graph layout algorithm |
| Axios | HTTP client with auth interceptor |
| Lucide React | Icons |

### 3.2 Backend

| Technology | Role |
|-----------|------|
| FastAPI | Python REST API framework |
| Uvicorn | ASGI server |
| Jinja2 | Terraform template rendering |
| Boto3 | AWS SDK (S3, DynamoDB, Bedrock, EC2, IAM, STS) |
| python-jose[cryptography] | JWT verification (RS256) |
| python-dotenv | Environment variable loading |

### 3.3 Cloud Services (AWS)

| Service | Purpose |
|---------|---------|
| Cognito | User authentication and authorization |
| DynamoDB | Project metadata storage (fast queries by user) |
| S3 | Canvas data + Terraform zip storage |
| Bedrock (Claude Sonnet 4) | AI architecture generation |
| EC2 API | Live quota checking |
| IAM API | Permission simulation (SimulatePrincipalPolicy) |
| STS | Role assumption for credential delegation |

---

## 4. System Architecture


### 4.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js 15)                        │
│                                                                      │
│  ┌─────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ Sign In │  │  Canvas Page │  │ AI Generator │  │  Projects   │ │
│  │ Sign Up │  │ (React Flow) │  │   Dialog     │  │  Dashboard  │ │
│  └────┬────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │
│       │               │                  │                  │        │
│       ▼               ▼                  ▼                  ▼        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Axios API Client (Bearer Token Injection)         │   │
│  └──────────────────────────────────┬───────────────────────────┘   │
└─────────────────────────────────────┼───────────────────────────────┘
                                      │ HTTP/REST
                                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       BACKEND (FastAPI / Python)                      │
│                                                                      │
│  ┌──────────┐  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │  Auth    │  │ Template Registry │  │  Terraform Orchestrator  │  │
│  │ (JWT)    │  │  (20 Jinja2 .j2) │  │  (generates .tf blocks)  │  │
│  └──────────┘  └──────────────────┘  └──────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                     API Endpoints                             │   │
│  │  /generate  /ai/generate  /projects  /validate               │   │
│  │  /check-quotas  /check-quotas-live  /generate-iam-policy     │   │
│  │  /validate-iam-permissions  /regions                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
              │              │               │
              ▼              ▼               ▼
     ┌────────────┐  ┌───────────┐  ┌───────────────┐
     │  DynamoDB  │  │    S3     │  │   Bedrock     │
     │ (metadata) │  │ (files)   │  │  (Claude AI)  │
     └────────────┘  └───────────┘  └───────────────┘
```

### 4.2 Authentication Flow

```
┌──────────┐     ┌───────────┐     ┌──────────────┐     ┌─────────┐
│  User    │────▶│  Amplify  │────▶│   Cognito    │────▶│  JWT    │
│ (Browser)│     │ (Frontend)│     │  User Pool   │     │ Tokens  │
└──────────┘     └───────────┘     └──────────────┘     └────┬────┘
                                                              │
                                                              ▼
┌──────────┐     ┌───────────┐     ┌──────────────┐     ┌─────────┐
│  FastAPI │◀────│  Bearer   │◀────│  Axios       │◀────│ Access  │
│ Endpoint │     │  Header   │     │ Interceptor  │     │ Token   │
└──────────┘     └───────────┘     └──────────────┘     └─────────┘
      │
      ▼
┌──────────────┐
│ auth.py      │
│ • Fetch JWKS │
│ • Verify RS256│
│ • Check exp  │
│ • Return user│
└──────────────┘
```

---

## 5. Backend API Reference

### 5.1 Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | Health check |
| GET | `/regions` | No | Returns supported regions with AMI IDs and AZs |
| POST | `/generate` | Yes | Generates Terraform code from canvas design, uploads to S3, returns zip |
| POST | `/ai/generate` | Yes | AI-powered architecture generation from natural language prompt |
| GET | `/projects` | Yes | Lists all projects for authenticated user |
| GET | `/projects/{name}/download` | Yes | Returns presigned S3 URL for project zip |
| DELETE | `/projects/{name}` | Yes | Deletes project from DynamoDB and S3 |
| POST | `/validate` | Yes | Validates architecture for missing properties and security risks |
| POST | `/check-quotas` | Yes | Static quota warnings against AWS default limits |
| POST | `/check-quotas-live` | Yes | Live quota check using user's AWS credentials |
| POST | `/generate-iam-policy` | Yes | Generates minimum IAM policy for deployment |
| POST | `/validate-iam-permissions` | Yes | Simulates IAM actions to verify deployment permissions |

### 5.2 Backend Modules

| Module | Responsibility |
|--------|---------------|
| `main.py` | FastAPI application, all route handlers, AI generation, validation logic, quota checking |
| `auth.py` | Cognito JWT verification, JWKS caching, `get_current_user` dependency |
| `project_store.py` | DynamoDB + S3 CRUD operations for projects |
| `template_registry.py` | Jinja2 environment setup, maps resource types to template files |
| `generators/orcherastor.py` | TerraformOrchestrator — iterates services, coordinates template rendering |
| `generators/generic_template_generator.py` | Loads and renders individual Jinja2 templates with service config |

### 5.3 Authentication Details

- **Token Type**: Cognito access tokens (JWT, RS256 signed)
- **JWKS Caching**: Keys fetched from Cognito and cached for 1 hour
- **Validation Steps**:
  1. Extract `kid` from token header
  2. Match against cached JWKS keys
  3. Verify RS256 signature, expiration, issuer
  4. Confirm `token_use == "access"`
- **Dev Mode**: Set `SKIP_AUTH=true` to bypass authentication (returns mock user)
- **Dependency Injection**: `Depends(get_current_user)` protects all authenticated endpoints

---

## 6. Frontend Architecture

### 6.1 Pages (Next.js App Router)

| Route | Description |
|-------|-------------|
| `/` | Main canvas editor (requires authentication) |
| `/signin` | Cognito-based login page |
| `/signup` | Cognito-based registration page |
| `/forgot-password` | Password reset flow |
| `/projects` | User project dashboard (list, download, delete) |

### 6.2 Key Components

| Component | Purpose |
|-----------|---------|
| `Canvas.tsx` | Main React Flow canvas — manages nodes, edges, save/load/export |
| `ServicePanel.tsx` | Left sidebar with draggable AWS service items |
| `ServiceNode.tsx` | Individual resource node on canvas |
| `propertiesPanel/` | Right sidebar property editor (dynamic forms per resource type) |
| `AiArchitectureGenerator.tsx` | AI prompt dialog with example prompts |
| `TemplateGallery.tsx` | Pre-built architecture templates |
| `TerraformPreview.tsx` | Shows generated .tf code before download |
| `QuotaCheck.tsx` | Static and live AWS quota validation |
| `IAMPolicyGenerator.tsx` | Policy generation and permission validation |
| `ValidationPanel.tsx` | Architecture validation with error/warning display |
| `AuthGuard.tsx` | Route protection — redirects unauthenticated users |
| `UserDashboard.tsx` | Project list with download/delete actions |
| `dependencyResolver.tsx` | Resolves inter-resource dependencies |
| `dependencyCleaner.tsx` | Cleans stale references when nodes are deleted |
| `base-node.tsx` | Base node component for canvas resources |
| `labeled-group-node.tsx` | Group node for VPC/subnet grouping |
| `ResizableNode.tsx` | Resizable node variant |
| `TextNode.tsx` | Text annotation node |
| `ThemeToggle.tsx` | Dark/light mode switch |

### 6.3 State Management

```
AuthContext (React Context)
├── user (Cognito AuthUser object)
├── isAuthenticated (boolean)
├── isLoading (boolean)
├── getAccessToken() → string (for API requests)
└── signOut() → void

Canvas Component (local state)
├── nodes[] (React Flow nodes — AWS resources)
├── edges[] (React Flow edges — connections)
├── selectedNode (currently selected for property editing)
├── selectedRegion (AWS region)
└── UI states (panel widths, collapsed states, modals)
```

### 6.4 API Integration

The frontend uses an Axios instance (`lib/api.ts`) with a request interceptor that:
1. Fetches the current Cognito session via AWS Amplify
2. Extracts the access token
3. Attaches `Authorization: Bearer {token}` to every outbound request
4. Falls back gracefully if user is not authenticated

---

## 7. Terraform Generation Pipeline

### 7.1 Pipeline Flow

```
Canvas Data (nodes + edges + properties)
        │
        ▼
┌────────────────────┐
│ POST /generate     │  ← Receives JSON with connected_services array
└────────┬───────────┘
         │
         ▼
┌────────────────────────────┐
│ TerraformOrchestrator      │
│ • Iterates connected_services
│ • Adds AWS provider block  │
│ • Renders each service     │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ GenericTemplateGenerator    │
│ • Looks up Jinja2 template │
│ • Renders with service props│
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ TemplateRegistry            │
│ • Maps type → .j2 file     │
│ • Jinja2 Environment        │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ Output                      │
│ • main.tf per infra group  │
│ • Packaged as .zip          │
│ • Uploaded to S3            │
│ • Returned as FileResponse  │
└────────────────────────────┘
```

### 7.2 Supported AWS Resources (20 Jinja2 Templates)

| Category | Resources |
|----------|-----------|
| **Compute** | EC2 Instance, ECS Cluster, EKS Cluster |
| **Networking** | VPC, Subnet, Internet Gateway, NAT Gateway, Route Table, Route Table Association |
| **Security** | Security Group, Ingress Rule, Egress Rule |
| **Storage** | S3 Bucket, RDS Instance |
| **Load Balancing** | Application Load Balancer, Target Group |
| **Elastic IP** | Elastic IP, EIP Association |
| **Provider** | AWS Provider (region configuration) |

### 7.3 Template Example (EC2)

```hcl
resource "aws_instance" "{{ id.replace('-', '_') }}" {
    ami           = "{{ ami }}"
    instance_type = "{{ instance_type }}"

    {% if refs is defined and refs.security_group is defined and refs.security_group %}
    vpc_security_group_ids = [aws_security_group.{{ refs.security_group.replace('-', '_') }}.id]
    {% endif %}

    {% if refs is defined and refs.subnet is defined and refs.subnet %}
    subnet_id = aws_subnet.{{ refs.subnet.replace('-', '_') }}.id
    {% endif %}

    tags = {
        Name = "{{ name | default('') }}"
    }
}
```

### 7.4 Template Example (VPC)

```hcl
resource "aws_vpc" "{{ id.replace('-', '_') }}" {
  cidr_block           = "{{ cidr_block }}"
  enable_dns_support   = {{ enable_dns_support | default(true) | lower }}
  enable_dns_hostnames = {{ enable_dns_hostnames | default(true) | lower }}
  instance_tenancy     = "{{ instance_tenancy | default('default') }}"

  tags = {
    Name = "{{ name }}"
  }
}
```

---

## 8. AI Generation Pipeline (Amazon Bedrock)

### 8.1 Flow

1. User enters a natural language prompt (e.g., "Build an e-commerce app with VPC, load balancer, and RDS")
2. Backend constructs a detailed system prompt including:
   - Output JSON schema specification
   - Region-specific AMI IDs and availability zones
   - Reference rules (subnet→VPC, EC2→subnet, SG→VPC)
   - Security rules (no SSH/DB ports open to 0.0.0.0/0)
3. Calls `eu.anthropic.claude-sonnet-4-6` via Amazon Bedrock
4. Parses the JSON response
5. **Post-processing** applies deterministic fixes:
   - Adds missing `refs.vpc` on subnets, security groups, internet gateways
   - Adds missing `refs.subnet` on EC2 instances
   - Replaces wrong-region AMI IDs with correct ones
   - Restricts insecure port configurations
6. Returns `{nodes, edges}` to frontend for canvas rendering

### 8.2 AI Response Format

```json
{
  "summary": "One-line description of the architecture",
  "nodes": [
    {
      "id": "unique-id",
      "type": "service",
      "position": { "x": 200, "y": 100 },
      "data": {
        "label": "EC2",
        "type": "compute",
        "provider": "aws",
        "rawLabel": "aws_instance",
        "serviceName": "Web Server",
        "properties": {
          "name": "web-server",
          "ami": "ami-09a9858973b288bdd",
          "instance_type": "t3.micro",
          "refs": { "subnet": "subnet-1", "security_group": "sg-1" }
        }
      }
    }
  ],
  "edges": [
    { "id": "edge-1", "source": "node-1", "target": "node-2" }
  ]
}
```

### 8.3 Security Post-Processing

The backend automatically enforces these security rules on AI-generated architectures:

| Rule | Implementation |
|------|---------------|
| SSH (port 22) restricted | Changes `0.0.0.0/0` → `10.0.0.0/16` (VPC CIDR only) |
| Database ports restricted | Ports 3306, 5432, 6379, 27017 → `10.0.1.0/24` (app subnet only) |
| HTTP/HTTPS allowed | Ports 80, 443 may remain open to `0.0.0.0/0` |
| Egress default | All outbound traffic allowed (`0.0.0.0/0`) |

### 8.4 Fallback Mechanism

If Amazon Bedrock is unavailable or returns an error, the system falls back to `mock_ai_generate()` which provides hardcoded architectures for common prompt patterns:
- "ecommerce" / "web app" / "three-tier" → Scalable three-tier with ALB, EC2, RDS
- "vpc" / "network" / "subnet" → VPC with public/private subnets and IGW
- Default → Basic EC2 setup with VPC, subnet, and security group

---

## 9. Data Storage Architecture

### 9.1 Design Decision: DynamoDB + S3

| Storage | What It Stores | Why |
|---------|---------------|-----|
| DynamoDB | Project metadata (user, name, timestamps, S3 key, node count) | Fast queries by user email; sub-millisecond reads |
| S3 | Full canvas JSON + generated Terraform zips | No size limit (DynamoDB has 400KB cap); cheap file storage |

**Rationale**: Canvas JSON with many nodes can exceed DynamoDB's 400KB item limit. S3 handles large files cheaply. DynamoDB provides efficient "get all projects for user X" queries that S3 cannot do. Together: DynamoDB = index/catalog, S3 = file system.

### 9.2 DynamoDB Table Schema

**Table Name**: `CloudCanva-Projects`

| Key | Type | Description |
|-----|------|-------------|
| `user_email` | Partition Key (String) | Groups all projects by user |
| `project_name` | Sort Key (String) | Unique project name within user scope |

**Attributes**:
| Field | Type | Description |
|-------|------|-------------|
| `s3_key` | String | Path to data in S3 |
| `node_count` | Number | Quick stat for UI display |
| `created_at` | String (ISO) | Creation timestamp |
| `updated_at` | String (ISO) | Last modification timestamp |

### 9.3 S3 Bucket Structure

```
s3://cloudcanva-terraform-exports-{identifier}/
└── users/
    └── {user_email}/
        ├── {project_name}.zip              (generated Terraform code)
        └── projects/
            └── {project_name}/
                └── canvas.json             (full node/edge/properties data)
```

### 9.4 Project CRUD Operations

| Operation | DynamoDB | S3 |
|-----------|----------|-----|
| **Save** | Upsert metadata (preserves `created_at`) | Upload `canvas.json` |
| **List** | Query by `user_email` partition key | — |
| **Load** | Get item → extract `s3_key` | Download `canvas.json` |
| **Delete** | Delete item | Delete object |
| **Export** | Write metadata + `s3_key` | Upload `.zip` |

---

## 10. Quota and IAM Validation

### 10.1 Static Quota Checking

Compares designed resource counts against known AWS default limits:

| Resource | AWS Default Limit |
|----------|-------------------|
| VPCs | 5 per region |
| Elastic IPs | 5 per region |
| EC2 Instances | 20 per region |
| Subnets | 200 per VPC |
| Security Groups | 500 per VPC |
| Internet Gateways | 5 per region |

Returns three severity levels: `info`, `warning` (approaching limit), `error` (at/over limit).

### 10.2 Live Quota Checking

Users provide their AWS credentials (IAM role ARN or access keys). The system:
1. Assumes the role or uses direct keys
2. Queries actual resource counts via EC2 API (`describe_vpcs`, `describe_addresses`, `describe_instances`)
3. Adds design resource counts to current usage
4. Reports if total would exceed limits

### 10.3 IAM Policy Generation

Maps each resource type to its required IAM actions:

| Resource Type | Required Actions (sample) |
|---------------|--------------------------|
| VPC | `ec2:CreateVpc`, `ec2:DeleteVpc`, `ec2:DescribeVpcs`, `ec2:ModifyVpcAttribute` |
| EC2 Instance | `ec2:RunInstances`, `ec2:TerminateInstances`, `ec2:DescribeInstances` |
| Security Group | `ec2:CreateSecurityGroup`, `ec2:DeleteSecurityGroup`, `ec2:DescribeSecurityGroups` |
| S3 Bucket | `s3:CreateBucket`, `s3:DeleteBucket`, `s3:ListBucket` |
| Load Balancer | `elasticloadbalancing:CreateLoadBalancer`, `elasticloadbalancing:DeleteLoadBalancer` |

Generates a complete IAM policy document with all necessary permissions for the designed architecture.

### 10.4 IAM Permission Validation

Uses `SimulatePrincipalPolicy` to test the user's actual permissions:
- Processes actions in batches of 50 (API limit)
- Reports `allowed` vs `denied` for each action
- Returns a `can_deploy` boolean indicating if deployment will succeed

---

## 11. Security

| Feature | Implementation |
|---------|---------------|
| JWT verification | RS256 with Cognito JWKS key rotation |
| Security guardrails (AI) | Post-processing restricts SSH/DB ports from 0.0.0.0/0 |
| Security guardrails (validation) | Warns about open sensitive ports before export |
| User isolation | Projects stored under user's email partition key |
| Presigned URLs | S3 downloads expire after 10 minutes |
| IAM least privilege | Generates minimum required policy for deployment |
| CORS | Configured (currently open — should restrict for production) |
| Dev auth bypass | `SKIP_AUTH=true` only for local development |

---

## 12. Multi-Region Configuration

| Region | Location | Amazon Linux AMI | Ubuntu AMI | Availability Zones |
|--------|----------|------------------|------------|-------------------|
| eu-north-1 | Stockholm (default) | ami-09a9858973b288bdd | ami-0014ce3e52a6bbf4d | a, b, c |
| us-east-1 | Virginia | ami-0c02fb55956c7d316 | ami-0aa7d40eeae50c9a9 | a, b, c |
| us-west-2 | Oregon | ami-0ceecbb0f30a902a6 | ami-017fecd1353bcc96e | a, b, c |
| eu-west-1 | Ireland | ami-0905a3c97561e0b69 | ami-0694d931cee176e7d | a, b, c |
| ap-south-1 | Mumbai | ami-0f1dcc636b69a6438 | ami-03f4878755434977f | a, b, c |
| ap-northeast-1 | Tokyo | ami-0d52744d6551d851e | ami-0d52744d6551d851e | a, c, d |

The frontend provides a region selector dropdown, and all AI-generated and manually-configured architectures use the correct AMI IDs and AZs for the selected region.

---

## 13. Environment Configuration

### 13.1 Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_COGNITO_USER_POOL_ID=<your-region_pool-id>
NEXT_PUBLIC_COGNITO_CLIENT_ID=<your-cognito-app-client-id>
```

### 13.2 Backend (`backend/.env`)

```env
AWS_REGION=eu-north-1
S3_BUCKET=cloudcanva-terraform-exports-<identifier>
DYNAMODB_TABLE=CloudCanva-Projects
COGNITO_REGION=<your-cognito-region>
COGNITO_USER_POOL_ID=<your-region_pool-id>
COGNITO_APP_CLIENT_ID=<your-cognito-app-client-id>
SKIP_AUTH=false
```

---

## 14. Project Directory Structure

```
CloudCanva/
├── .env.example                         # Template for all env vars
├── PROJECT_DOCUMENTATION.md             # This document
│
├── backend/
│   ├── main.py                          # FastAPI app + all endpoints (~850 lines)
│   ├── auth.py                          # Cognito JWT verification middleware
│   ├── project_store.py                 # DynamoDB + S3 CRUD operations
│   ├── template_registry.py            # Jinja2 template lookup (20 templates)
│   ├── requirements.txt                 # Python dependencies
│   ├── .env                             # Backend environment variables
│   ├── generators/
│   │   ├── orcherastor.py              # TerraformOrchestrator class
│   │   └── generic_template_generator.py  # Template renderer
│   └── templates/aws/
│       ├── provider.tf.j2              # AWS provider block
│       ├── ec2.tf.j2                   # EC2 instance
│       ├── vpc.tf.j2                   # VPC
│       ├── subnet.tf.j2               # Subnet
│       ├── internet_gateway.tf.j2     # Internet Gateway
│       ├── nat_gateway.tf.j2          # NAT Gateway
│       ├── rds.tf.j2                  # RDS database
│       ├── eks.tf.j2                  # EKS cluster
│       ├── ecs/ecs.tf.j2             # ECS cluster
│       ├── eip/
│       │   ├── elastic_ip.tf.j2      # Elastic IP
│       │   └── eip_association.tf.j2 # EIP Association
│       ├── routing/
│       │   ├── route_table.tf.j2     # Route table
│       │   └── route_table_association.tf.j2
│       ├── security_group/
│       │   ├── security_group.tf.j2  # Security Group
│       │   ├── vpc_security_group_ingress_rule.tf.j2
│       │   └── vpc_security_group_egress_rule.tf.j2
│       ├── s3/bucket.tf.j2           # S3 bucket
│       └── load_balancer/
│           ├── load_balancer.tf.j2   # ALB
│           └── target_group.tf.j2    # Target Group
│
├── frontend/
│   ├── app/                            # Next.js App Router
│   │   ├── page.tsx                   # Main canvas page
│   │   ├── layout.tsx                 # Root layout + AuthProvider
│   │   ├── globals.css                # Global styles
│   │   ├── signin/                    # Login page
│   │   ├── signup/                    # Registration page
│   │   ├── forgot-password/           # Password reset
│   │   └── projects/                  # Projects dashboard
│   ├── components/                     # React components (24 files)
│   │   ├── Canvas.tsx                 # Core canvas editor
│   │   ├── ServiceNode.tsx            # Resource node component
│   │   ├── ServicePanel.tsx           # Service catalog sidebar
│   │   ├── AiArchitectureGenerator.tsx
│   │   ├── TemplateGallery.tsx
│   │   ├── TerraformPreview.tsx
│   │   ├── QuotaCheck.tsx
│   │   ├── IAMPolicyGenerator.tsx
│   │   ├── ValidationPanel.tsx
│   │   ├── AuthGuard.tsx
│   │   ├── UserDashboard.tsx
│   │   ├── propertiesPanel/           # Property editors per resource type
│   │   └── ui/                        # Shadcn component library
│   ├── context/AuthContext.tsx        # Auth state provider
│   ├── lib/
│   │   ├── api.ts                    # Axios instance + auth interceptor
│   │   ├── cognito.ts                # AWS Amplify configuration
│   │   └── utils.ts                  # Utility functions
│   ├── data/                          # AWS service catalog data
│   ├── types/                         # TypeScript type definitions
│   ├── hooks/                         # Custom React hooks
│   ├── public/                        # Static assets (logo, etc.)
│   ├── package.json                   # Node.js dependencies
│   └── tailwind.config.ts            # Tailwind CSS configuration
```

---

## 15. End-to-End User Workflow

```
1. User signs up / signs in via Cognito (/signin or /signup)
         │
         ▼
2. Lands on main canvas page (/)
         │
         ▼
3. Designs architecture via ONE of:
   ├── a) Drag AWS services from ServicePanel onto canvas
   ├── b) AI Generator: type prompt → architecture appears on canvas
   └── c) Template Gallery: pick pre-built pattern
         │
         ▼
4. Edits properties of each resource
   (AMI, CIDR, instance type, subnet refs, etc.)
         │
         ▼
5. Connects resources visually (edges = dependencies)
         │
         ▼
6. Validates architecture
   (checks missing refs, security, completeness)
         │
         ▼
7. (Optional) Checks AWS quotas — static or live
         │
         ▼
8. (Optional) Generates/validates IAM policy
         │
         ▼
9. Exports as Terraform → downloads .zip with main.tf
         │
         ▼
10. Saves project for later (stored in DynamoDB + S3)
         │
         ▼
11. Deploys locally:
    $ cd tf_output/infrastructure
    $ terraform init
    $ terraform plan
    $ terraform apply
```

---

## 16. Running the Project Locally

### 16.1 Prerequisites

- Python 3.8+
- Node.js 18+
- AWS account with Cognito, DynamoDB, S3, and Bedrock access
- AWS credentials configured locally

### 16.2 Backend Setup

```bash
cd backend
pip install -r requirements.txt

# Create .env file (copy from .env.example and fill in values)
cp ../.env.example .env

# Run with auth disabled for development
SKIP_AUTH=true uvicorn main:app --reload --port 8000
```

### 16.3 Frontend Setup

```bash
cd frontend
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
echo "NEXT_PUBLIC_COGNITO_USER_POOL_ID=<your-pool-id>" >> .env.local
echo "NEXT_PUBLIC_COGNITO_CLIENT_ID=<your-client-id>" >> .env.local

# Start development server
npm run dev
# → Starts on http://localhost:3000
```

---

## 17. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **DynamoDB + S3 split** | Canvas JSON can exceed DynamoDB's 400KB limit; S3 handles large files cheaply while DynamoDB provides fast user-scoped queries |
| **Jinja2 templates** | Maintainable, readable Terraform output with proper formatting and conditional blocks (vs. string concatenation) |
| **Post-processing AI output** | AI models sometimes produce incorrect references or wrong-region AMIs; deterministic fixes guarantee valid output |
| **Security-by-default** | AI-generated architectures automatically restrict sensitive ports; validation flags risky configurations before export |
| **Region-aware generation** | All AMI IDs and AZs are pre-mapped per region, preventing cross-region resource errors |
| **Presigned URLs** | Avoids streaming large zips through the backend; S3 handles bandwidth directly |
| **FastAPI + React Flow** | FastAPI provides async performance and automatic API docs; React Flow gives enterprise-grade graph visualization |
| **Cognito for auth** | Managed service removes need for custom auth; integrates natively with AWS Amplify on frontend |

---

## 18. Dependencies

### 18.1 Backend (requirements.txt)

```
jinja2          # Template engine for Terraform generation
fastapi         # REST API framework
uvicorn         # ASGI server
boto3           # AWS SDK (S3, DynamoDB, Bedrock, EC2, IAM, STS)
python-jose[cryptography]  # JWT token verification
requests        # HTTP client (for JWKS fetching)
python-dotenv   # .env file loading
```

### 18.2 Frontend (key dependencies from package.json)

```json
{
  "@xyflow/react": "^12.11.0",    // Canvas graph visualization
  "reactflow": "^11.11.4",        // Alternative graph lib
  "aws-amplify": "^6.17.0",       // Cognito authentication
  "next": "^15.5.19",             // React framework
  "react": "^19.2.7",             // UI library
  "axios": "^1.16.1",             // HTTP client
  "react-hook-form": "^7.77.0",   // Form management
  "zod": "^4.4.3",                // Schema validation
  "dagre": "^0.8.5",              // Graph layout algorithm
  "tailwind-merge": "^3.6.0",     // Tailwind utility merging
  "radix-ui": "^1.4.3",           // Accessible UI primitives
  "lucide-react": "^1.17.0",      // Icons
  "next-themes": "^0.4.6"         // Dark/light mode
}
```

---

## 19. Future Considerations

- Restrict CORS origins for production deployment
- Add Terraform `plan` preview (run `terraform plan` server-side)
- Support additional cloud providers (Azure, GCP)
- Add collaborative editing (multiple users on same canvas)
- Implement version history for projects
- Add cost estimation based on designed resources
- Support Terraform modules and remote state
- Add CI/CD pipeline generation alongside Terraform code

---

*Document generated from CloudCanva source code analysis.*
