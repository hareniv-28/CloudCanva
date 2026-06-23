terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}


provider "aws" {
    region = "eu-north-1"
}

resource "aws_vpc" "ai_vpc_1" {
  cidr_block                       = "10.0.0.0/16"
  enable_dns_support               = true
  enable_dns_hostnames           = true
  instance_tenancy                 = "default"

  tags = {
    Name = "main-vpc"
  }
}


resource "aws_subnet" "ai_subnet_1" {
  vpc_id            = aws_vpc.ai_vpc_1.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "eu-north-1a"

  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet"
  }

  lifecycle {
    create_before_destroy = true
  } 
}


resource "aws_subnet" "ai_subnet_2" {
  vpc_id            = aws_vpc.ai_vpc_1.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "eu-north-1b"

  map_public_ip_on_launch = false

  tags = {
    Name = "private-subnet"
  }

  lifecycle {
    create_before_destroy = true
  } 
}


resource "aws_instance" "ai_ec2_1" {
    ami  = "ami-09a9858973b288bdd"
    instance_type = "t3.medium"

    vpc_security_group_ids = [aws_security_group.ai_sg_1.id]

    subnet_id = aws_subnet.ai_subnet_1.id

    tags = {
        Name = "web-server"
    }
}


resource "aws_db_instance" "ai_rds_1" {
  identifier          = "app-db"
  engine              = "postgresql"
  engine_version      = "8.0"
  instance_class      = "db.t3.medium"
  allocated_storage   = 20
  db_name             = "appdb"
  username            = "admin"
  password            = "changeme123"
  skip_final_snapshot = true



  tags = {
    Name = "app-db"
  }
}


resource "aws_security_group" "ai_sg_1" {
  vpc_id      = aws_vpc.ai_vpc_1.id
  description = "Allow HTTP and HTTPS"

  tags = {
  }

  lifecycle {
    create_before_destroy = true
  }
}



resource "aws_vpc_security_group_ingress_rule" "hscfngek_ingress_rule" {
  security_group_id = aws_security_group.ai_sg_1.id
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = "HTTP"

  tags = {
  }
}


resource "aws_vpc_security_group_ingress_rule" "zioxtrkp_ingress_rule" {
  security_group_id = aws_security_group.ai_sg_1.id
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = "HTTPS"

  tags = {
  }
}


resource "aws_vpc_security_group_egress_rule" "jsrqkvlx_egress_rule" {
  security_group_id = aws_security_group.ai_sg_1.id
  ip_protocol       = "-1"
  from_port         = 0
  to_port           = 0
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = "All outbound"

  tags = {
  }
}

