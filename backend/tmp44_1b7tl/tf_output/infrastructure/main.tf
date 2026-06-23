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

resource "aws_vpc" "vpc_1" {
  cidr_block                       = "10.0.0.0/16"
  enable_dns_support               = true
  enable_dns_hostnames           = true
  instance_tenancy                 = "default"

  tags = {
    Name = ""
  }
}


resource "aws_subnet" "subnet_private_1" {
  vpc_id            = aws_vpc.vpc_1.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "eu-north-1a"

  map_public_ip_on_launch = false

  tags = {
    Name = ""
  }

  lifecycle {
    create_before_destroy = true
  } 
}


resource "aws_subnet" "subnet_private_2" {
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


resource "aws_route_table" "rt_private" {
  vpc_id = aws_vpc.vpc_1.id



  tags = {
    Name = ""
  }
}


resource "aws_db_subnet_group" "rds_1_subnet_group" {
  name       = "rds-1-subnet-group"
  subnet_ids = [
    aws_subnet.subnet_private_1.id,
    aws_subnet.subnet_private_2.id,
  ]

  tags = {
    Name = "rds-1-subnet-group"
  }
}

resource "aws_db_instance" "rds_1" {
  identifier          = "rds-1"
  engine              = "mysql"
  instance_class      = "db.t3.micro"
  allocated_storage   = 20
  db_name             = "appdb"
  username            = "admin"
  password            = "changeme123!"
  skip_final_snapshot = true
  db_subnet_group_name = aws_db_subnet_group.rds_1_subnet_group.name


  tags = {
    Name = ""
  }
}


resource "aws_security_group" "sg_rds" {
  vpc_id      = aws_vpc.vpc_1.id
  description = "Security group for RDS MySQL"

  tags = {
  }

  lifecycle {
    create_before_destroy = true
  }
}



resource "aws_vpc_security_group_ingress_rule" "wagpwjdr_ingress_rule" {
  security_group_id = aws_security_group.sg_rds.id
  ip_protocol       = "tcp"
  from_port         = 3306
  to_port           = 3306
  cidr_ipv4         = "10.0.1.0/24"
  
  description       = "MySQL access from private subnets only"

  tags = {
  }
}


resource "aws_vpc_security_group_egress_rule" "qirmbulh_egress_rule" {
  security_group_id = aws_security_group.sg_rds.id
  ip_protocol       = "-1"
  from_port         = 0
  to_port           = 0
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = "Allow all outbound"

  tags = {
  }
}

