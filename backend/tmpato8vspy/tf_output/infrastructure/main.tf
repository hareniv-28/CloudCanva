terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}


provider "aws" {
    region = "ap-south-1"
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


resource "aws_subnet" "subnet_1" {
  vpc_id            = aws_vpc.vpc_1.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"

  map_public_ip_on_launch = true

  tags = {
    Name = ""
  }

  lifecycle {
    create_before_destroy = true
  } 
}


resource "aws_route_table" "rt_1" {
  vpc_id = aws_vpc.vpc_1.id


  route {
    cidr_block = "0.0.0.0/0"

  }

  tags = {
    Name = ""
  }
}


resource "aws_instance" "ec2_1" {
    ami  = "ami-0c02fb55956c7d316"
    instance_type = "t2.micro"



    tags = {
        Name = ""
    }
}


resource "aws_eip" "eip_1" {




  tags = {
    Name = ""
  }

  lifecycle {
    create_before_destroy = true
  }
}


resource "aws_security_group" "sg_1" {
  vpc_id      = aws_vpc.vpc_1.id
  description = "Security group for EC2 instance"

  tags = {
  }

  lifecycle {
    create_before_destroy = true
  }
}



resource "aws_vpc_security_group_ingress_rule" "valxsuac_ingress_rule" {
  security_group_id = aws_security_group.sg_1.id
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = ""

  tags = {
  }
}


resource "aws_vpc_security_group_ingress_rule" "pxetcyxk_ingress_rule" {
  security_group_id = aws_security_group.sg_1.id
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = ""

  tags = {
  }
}


resource "aws_vpc_security_group_egress_rule" "trkqlonu_egress_rule" {
  security_group_id = aws_security_group.sg_1.id
  ip_protocol       = "-1"
  from_port         = 0
  to_port           = 0
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = ""

  tags = {
  }
}

