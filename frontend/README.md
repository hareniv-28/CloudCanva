# CloudCanva

**AI-Powered Cloud Architecture Platform**

Design AWS infrastructure visually, generate architecture with AI, validate configurations, and export deployment-ready Terraform code.

---

## Features

### 1. Visual Infrastructure Design
Drag and drop AWS services onto an interactive canvas and connect them to define architecture relationships.

**Supported Services:** VPC, EC2, Subnet, Security Group, Internet Gateway, Route Table, Elastic IP, S3, Load Balancer, Target Group, ECS, EKS

### 2. AI-Powered Architecture Generation (Amazon Bedrock)
Describe infrastructure in plain English → AI generates complete architecture with proper configurations, dependencies, and security rules.

### 3. Security Guardrails
- AI never exposes SSH (port 22) or database ports to `0.0.0.0/0`
- Post-processing auto-fixes risky security group rules
- Validation warns about insecure configurations before export

### 4. Terraform Code Export
Visual architecture is converted into deployment-ready Terraform code using Jinja2 templates, validated, and exported as a downloadable zip.

### 5. Multi-Region Support
Select from 6 AWS regions. AMIs, availability zones, and provider config auto-adjust per region.

### 6. Quota Check
- Static warnings about AWS default limits (5 VPCs, 5 EIPs, etc.)
- Optional live account check with user-provided credentials

### 7. IAM Policy Generator
Auto-generates the minimum IAM permissions needed to deploy the designed architecture. Users can also validate their existing IAM role against the design.

### 8. User Management & Project Storage
- Amazon Cognito for authentication (signup, signin, email verification, forgot password)
- S3 + DynamoDB for per-user project storage (save, list, download, delete)

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Next.js, TypeScript, Tailwind CSS, React Flow |
| Backend | FastAPI, Python, Jinja2 |
| AI | Amazon Bedrock (Claude Sonnet 4) |
| Auth | Amazon Cognito, AWS Amplify |
| Storage | Amazon S3, DynamoDB |
| IaC | Terraform |
| Hosting | Amazon EC2 |

---

## Getting Started

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Environment Variables (`frontend/.env.local`)
```
NEXT_PUBLIC_COGNITO_USER_POOL_ID=<your-pool-id>
NEXT_PUBLIC_COGNITO_CLIENT_ID=<your-client-id>
NEXT_PUBLIC_COGNITO_REGION=<your-region>
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## AI Prompt Examples

**Simple:**
```
A VPC with one public subnet and an EC2 instance
```

**Medium:**
```
A VPC with two subnets in different AZs, an internet gateway, a route table, security group allowing HTTP and SSH, and one EC2 web server
```

**Complex:**
```
A production web application with a VPC, two public subnets in different availability zones, two private subnets in different availability zones, an internet gateway, a public route table connected to the internet gateway, a private route table, two security groups - one for web allowing HTTP HTTPS and SSH from VPC only, one for database allowing MySQL only from the public subnet CIDR, an Elastic IP, two EC2 web servers in the public subnets, one EC2 database server in a private subnet with the Elastic IP attached to the first web server
```

---

## Security Guardrails

| Rule | What it does |
|------|-------------|
| SSH (port 22) | Auto-restricted to VPC CIDR (`10.0.0.0/16`), never `0.0.0.0/0` |
| Database ports (3306, 5432) | Auto-restricted to app subnet CIDR (`10.0.1.0/24`) |
| HTTP/HTTPS (80, 443) | Allowed from `0.0.0.0/0` (expected for web) |
| All ports open | Flagged as critical security risk |
| DB in public subnet | AI always places databases in private subnets |

---

## Validation Checks

- Missing AMI on EC2 instances
- Missing CIDR block on VPC/Subnet
- Subnet not linked to a VPC
- Security Group not linked to a VPC
- Internet Gateway not attached to VPC
- Security warnings for open sensitive ports

---

## Deploy Terraform (via CloudShell)

```bash
# Install Terraform
curl -o terraform.zip https://releases.hashicorp.com/terraform/1.9.8/terraform_1.9.8_linux_amd64.zip && unzip -o terraform.zip && sudo mv terraform /usr/local/bin/

# Upload main.tf, then:
cd infra
mv ~/main.tf .
terraform init
terraform validate
terraform plan
terraform apply

# Cleanup
terraform destroy
```

---

## Project Structure

```
CCanva/
├── frontend/
│   ├── app/              # Pages (signin, signup, projects, home)
│   ├── components/       # Canvas, ServiceNode, Panels, Dialogs
│   ├── context/          # AuthContext
│   ├── lib/              # cognito.ts, api.ts
│   └── data/             # services.ts
├── backend/
│   ├── main.py           # FastAPI endpoints
│   ├── auth.py           # Cognito JWT verification
│   ├── generators/       # Orchestrator, Template Generator
│   ├── templates/        # Jinja2 Terraform templates
│   └── template_registry.py
```

---

## AWS Services Used

| Service | Purpose |
|---------|---------|
| Amazon Bedrock | AI architecture generation |
| Amazon Cognito | User authentication |
| Amazon S3 | Terraform zip storage |
| Amazon DynamoDB | Project metadata |
| Amazon EC2 | Backend hosting |
| AWS Amplify | Frontend auth SDK |

---

## Test Cases (AI Generation → Export → terraform validate → terraform apply)

### Edge Case Tests

| # | Test Case | What it validates |
|---|-----------|-------------------|
| 1 | RDS with single subnet | RDS needs 2 AZ subnets for subnet group |
| 2 | Load Balancer with one subnet | LB needs at least 2 subnets |
| 3 | ECS Cluster | ECS template generation |
| 4 | Multiple Security Groups | Multiple SGs with different port rules |
| 5 | Elastic IP + EC2 | EIP association |
| 6 | NAT Gateway | NAT needs EIP + public subnet |
| 7 | Private Route Table (no IGW) | Route table without internet access |
| 8 | S3 Bucket | Storage template generation |
| 9 | Full complex architecture | All services combined |
| 10 | Vague prompt | AI interpretation |

### Test Prompts Used

**1. RDS (needs 2 AZ subnets):**
```
A VPC with a private subnet and an RDS MySQL database
```

**2. Load Balancer (needs 2 subnets):**
```
A VPC with one public subnet and a load balancer with two EC2 instances
```

**3. ECS Cluster:**
```
A VPC with a public subnet and an ECS cluster
```

**4. Multiple Security Groups:**
```
A VPC with three security groups - one for web on port 80, one for SSH on port 22, one for database on port 5432
```

**5. Elastic IP + EC2:**
```
A VPC with a public subnet, one EC2 instance, and an Elastic IP attached to it
```

**6. NAT Gateway:**
```
A VPC with a public subnet, a private subnet, an internet gateway, and a NAT gateway in the public subnet
```

**7. Private Route Table:**
```
A VPC with two private subnets and a route table with no internet access
```

**8. S3 Bucket:**
```
A VPC with an EC2 instance and an S3 bucket for storing logs
```

**9. Full Complex (all services):**
```
A VPC with two public subnets, two private subnets across different AZs, an internet gateway, a route table connected to the IGW, a load balancer in public subnets, a target group, two EC2 web servers, an RDS PostgreSQL database in private subnets, security groups for web and database, and an Elastic IP
```

**10. Vague/Creative:**
```
Infrastructure for a startup SaaS application
```

**11. Production SaaS (maximum complexity):**
```
A production SaaS application with a VPC, three public subnets across three different availability zones, two private subnets in two different AZs, an internet gateway, a public route table connected to the internet gateway, a private route table, an application load balancer spanning all three public subnets, a target group for web servers, three EC2 web servers behind the load balancer in public subnets, one RDS PostgreSQL database in the private subnets, an S3 bucket for application logs, an Elastic IP attached to the first web server, a security group for web servers allowing HTTP HTTPS and SSH from VPC only, a security group for the database allowing PostgreSQL only from the web subnet CIDR, and a security group for the load balancer allowing HTTP and HTTPS from anywhere
```

### Bugs Found & Fixed During Testing

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| `Template 'aws_load_balancer' not found` | Missing template mapping | Added LB template + registry entry |
| `Template 'aws_target_group' not found` | Missing template mapping | Added TG template + registry entry |
| RDS fails: "doesn't cover enough AZs" | RDS needs subnets in 2+ AZs | Post-processing auto-assigns 2 subnets |
| LB fails: "subnets must be specified" | LB needs subnet refs | Post-processing auto-assigns subnets |
| CIDR value `"0"` instead of `"0.0.0.0/0"` | String vs array handling | Template checks `is string` |
| `admin` is reserved username | RDS default username | Changed default to `dbadmin` |
| Region mismatch (eu-north-1 AZ in us-east-1) | Region not passed to AI | Fixed frontend to pass selected region |
| S3 versioning wrong syntax | Old Terraform syntax | Updated to `versioning_configuration` block |
| Route table missing gateway_id | Template logic gap | Fixed template fallback logic |
| EIP connected to Subnet instead of EC2 | Frontend allowed invalid connection | Added validation in handleConnect |