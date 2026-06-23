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

resource "aws_vpc" "aws_network_1" {
  cidr_block                       = "10.0.0.0/16"
  enable_dns_support               = true
  enable_dns_hostnames           = false
  instance_tenancy                 = "default"

  tags = {
    Name = "MYVPC"
  }
}


resource "aws_subnet" "aws_Subnet_2" {
  vpc_id            = aws_vpc.aws_network_1.id
  cidr_block        = "10.0.0.0/16"
  availability_zone = "eu-north-1a"

  map_public_ip_on_launch = true

  tags = {
    Name = "MYSUB"
  }

  lifecycle {
    create_before_destroy = true
  } 
}


resource "aws_instance" "aws_compute_5" {
    ami  = "ami-0e35ddab05955cf57"
    instance_type = "t3.micro"


    subnet_id = aws_subnet.aws_Subnet_2.id

    tags = {
        Name = "MYEC@"
    }
}


resource "aws_route_table" "aws_RouteTable_6" {
  vpc_id = aws_vpc.aws_network_1.id


  route {
    cidr_block = "0.0.0.0/0"

    gateway_id = aws_internet_gateway.aws_InternetGateway_7.id

  }

  tags = {
    Name = "MYroundtable"
  }
}


resource "aws_internet_gateway" "aws_InternetGateway_7" {
  vpc_id = aws_vpc.aws_network_1.id

  tags = {
    Name = "igw-main"
  }
}


resource "aws_eip" "aws_elastic_7" {
  domain = "vpc"




  tags = {
    Name = "MYEIP"
  }

  lifecycle {
    create_before_destroy = true
  }
}


resource "aws_eip_association" "aws_elastic_7_aws_compute_5" {
  instance_id   = aws_instance.aws_compute_5.id
  allocation_id = aws_eip.aws_elastic_7.id
}


resource "aws_security_group" "aws_SecurityGroup_4" {
  vpc_id      = aws_vpc.aws_network_1.id
  description = "My web security"

  tags = {
  }

  lifecycle {
    create_before_destroy = true
  }
}



resource "aws_vpc_security_group_ingress_rule" "wcnffbpg_ingress_rule" {
  security_group_id = aws_security_group.aws_SecurityGroup_4.id
  ip_protocol       = "tcp"
  from_port         = 75
  to_port           = 80
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = ""

  tags = {
  }
}

