terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}


provider "aws" {
    region = "us-east-1"
}

resource "aws_vpc" "vpc_1" {
  cidr_block                       = "10.0.0.0/16"
  enable_dns_support               = true
  enable_dns_hostnames           = true
  instance_tenancy                 = "default"

  tags = {
    Name = ""
  }
}


resource "aws_internet_gateway" "igw_1" {
  vpc_id = aws_vpc.vpc_1.id

  tags = {
    Name = ""
  }
}


resource "aws_subnet" "subnet_public_1" {
  vpc_id            = aws_vpc.vpc_1.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "eu-north-1a"

  map_public_ip_on_launch = true

  tags = {
    Name = ""
  }

  lifecycle {
    create_before_destroy = true
  } 
}


resource "aws_subnet" "subnet_private_1" {
  vpc_id            = aws_vpc.vpc_1.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "eu-north-1b"

  map_public_ip_on_launch = false

  tags = {
    Name = ""
  }

  lifecycle {
    create_before_destroy = true
  } 
}


resource "aws_route_table" "rt_public_1" {
  vpc_id = aws_vpc.vpc_1.id



  tags = {
    Name = ""
  }
}


resource "aws_route_table" "rt_private_1" {
  vpc_id = aws_vpc.vpc_1.id



  tags = {
    Name = ""
  }
}


resource "aws_eip" "eip_1" {
  domain = "vpc"




  tags = {
    Name = ""
  }

  lifecycle {
    create_before_destroy = true
  }
}


resource "aws_nat_gateway" "nat_1" {
  allocation_id = aws_eip.eip_1.id
  subnet_id     = aws_subnet.subnet_public_1.id

  connectivity_type = "public"


  tags = {
    Name = ""
  }

  lifecycle {
    create_before_destroy = true
  }
}


resource "aws_security_group" "sg_public_1" {
  vpc_id      = aws_vpc.vpc_1.id
  description = "Security group for public subnet resources"

  tags = {
  }

  lifecycle {
    create_before_destroy = true
  }
}



resource "aws_vpc_security_group_ingress_rule" "xmregbcf_ingress_rule" {
  security_group_id = aws_security_group.sg_public_1.id
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = ""

  tags = {
  }
}


resource "aws_vpc_security_group_ingress_rule" "mjhjzicp_ingress_rule" {
  security_group_id = aws_security_group.sg_public_1.id
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = ""

  tags = {
  }
}


resource "aws_vpc_security_group_ingress_rule" "jmosoxec_ingress_rule" {
  security_group_id = aws_security_group.sg_public_1.id
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
  cidr_ipv4         = "10.0.0.0/16"
  
  description       = ""

  tags = {
  }
}


resource "aws_vpc_security_group_egress_rule" "ckgngcjm_egress_rule" {
  security_group_id = aws_security_group.sg_public_1.id
  ip_protocol       = "-1"
  from_port         = 0
  to_port           = 0
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = ""

  tags = {
  }
}


resource "aws_security_group" "sg_private_1" {
  vpc_id      = aws_vpc.vpc_1.id
  description = "Security group for private subnet resources"

  tags = {
  }

  lifecycle {
    create_before_destroy = true
  }
}



resource "aws_vpc_security_group_ingress_rule" "vpibafdq_ingress_rule" {
  security_group_id = aws_security_group.sg_private_1.id
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
  cidr_ipv4         = "10.0.0.0/16"
  
  description       = ""

  tags = {
  }
}


resource "aws_vpc_security_group_ingress_rule" "upwgmdol_ingress_rule" {
  security_group_id = aws_security_group.sg_private_1.id
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
  cidr_ipv4         = "10.0.1.0/24"
  
  description       = ""

  tags = {
  }
}


resource "aws_vpc_security_group_ingress_rule" "nrajlokm_ingress_rule" {
  security_group_id = aws_security_group.sg_private_1.id
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_ipv4         = "10.0.1.0/24"
  
  description       = ""

  tags = {
  }
}


resource "aws_vpc_security_group_egress_rule" "pijwocqe_egress_rule" {
  security_group_id = aws_security_group.sg_private_1.id
  ip_protocol       = "-1"
  from_port         = 0
  to_port           = 0
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = ""

  tags = {
  }
}

