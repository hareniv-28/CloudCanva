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
    Name = ""
  }
}


resource "aws_internet_gateway" "aws_InternetGateway_4" {
  vpc_id = aws_vpc.aws_network_1.id

  tags = {
    Name = "prod-igw"
  }
}


resource "aws_route_table" "aws_RouteTable_5" {
  vpc_id = aws_vpc.aws_network_1.id


  route {
    cidr_block = "0.0.0.0/0"

    gateway_id = aws_internet_gateway.aws_InternetGateway_4.id

  }

  tags = {
    Name = "public-rt"
  }
}


resource "aws_eip" "aws_elastic_10" {
  domain = "vpc"




  tags = {
    Name = "myEIP"
  }

  lifecycle {
    create_before_destroy = true
  }
}


resource "aws_subnet" "aws_Subnet_8" {
  vpc_id            = aws_vpc.aws_network_1.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "eu-north-1a"

  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet-1"
  }

  lifecycle {
    create_before_destroy = true
  } 
}


resource "aws_subnet" "aws_Subnet_9" {
  vpc_id            = aws_vpc.aws_network_1.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "eu-north-1b"

  map_public_ip_on_launch = false

  tags = {
    Name = "private-subnet-b"
  }

  lifecycle {
    create_before_destroy = true
  } 
}


resource "aws_instance" "aws_compute_9" {
    ami  = "ami-09a9858973b288bdd"
    instance_type = "t3.micro"


    subnet_id = aws_subnet.aws_Subnet_8.id

    tags = {
        Name = "ec2web"
    }
}


resource "aws_instance" "aws_compute_10" {
    ami  = "ami-09a9858973b288bdd"
    instance_type = "t3.micro"


    subnet_id = aws_subnet.aws_Subnet_9.id

    tags = {
        Name = "ec2db"
    }
}


resource "aws_eip_association" "aws_elastic_10_aws_compute_9" {
  instance_id   = aws_instance.aws_compute_9.id
  allocation_id = aws_eip.aws_elastic_10.id
}


resource "aws_security_group" "aws_SecurityGroup_6" {
  vpc_id      = aws_vpc.aws_network_1.id
  description = "web traffic"

  tags = {
  }

  lifecycle {
    create_before_destroy = true
  }
}



resource "aws_vpc_security_group_ingress_rule" "rrjonkbb_ingress_rule" {
  security_group_id = aws_security_group.aws_SecurityGroup_6.id
  ip_protocol       = "tcp"
  from_port         = 75
  to_port           = 80
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = "Hi there "

  tags = {
  }
}


resource "aws_security_group" "aws_SecurityGroup_7" {
  vpc_id      = aws_vpc.aws_network_1.id
  description = "DB access"

  tags = {
  }

  lifecycle {
    create_before_destroy = true
  }
}



resource "aws_vpc_security_group_ingress_rule" "vtvismpr_ingress_rule" {
  security_group_id = aws_security_group.aws_SecurityGroup_7.id
  ip_protocol       = "tcp"
  from_port         = 5432
  to_port           = 5432
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = ""

  tags = {
  }
}

