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


  route {
    cidr_block = "0.0.0.0/0"

  }

  tags = {
    Name = ""
  }
}


resource "aws_instance" "ec2_web_1" {
    ami  = "ami-09a9858973b288bdd"
    instance_type = "t3.micro"


    subnet_id = aws_subnet.subnet_public_1.id

    tags = {
        Name = ""
    }
}


resource "aws_instance" "ec2_db_1" {
    ami  = "ami-09a9858973b288bdd"
    instance_type = "t3.small"


    subnet_id = aws_subnet.subnet_private_1.id

    tags = {
        Name = ""
    }
}


resource "aws_security_group" "sg_web_1" {
  vpc_id      = aws_vpc.vpc_1.id
  description = "Security group for web server allowing HTTP, HTTPS and SSH from VPC"

  tags = {
  }

  lifecycle {
    create_before_destroy = true
  }
}



resource "aws_vpc_security_group_ingress_rule" "wtpsgbnh_ingress_rule" {
  security_group_id = aws_security_group.sg_web_1.id
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = ""

  tags = {
  }
}


resource "aws_vpc_security_group_ingress_rule" "mujrymbk_ingress_rule" {
  security_group_id = aws_security_group.sg_web_1.id
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = ""

  tags = {
  }
}


resource "aws_vpc_security_group_ingress_rule" "ywatemxq_ingress_rule" {
  security_group_id = aws_security_group.sg_web_1.id
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
  cidr_ipv4         = "10.0.0.0/16"
  
  description       = ""

  tags = {
  }
}


resource "aws_vpc_security_group_egress_rule" "uetkjyun_egress_rule" {
  security_group_id = aws_security_group.sg_web_1.id
  ip_protocol       = "-1"
  from_port         = 0
  to_port           = 0
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = ""

  tags = {
  }
}


resource "aws_security_group" "sg_db_1" {
  vpc_id      = aws_vpc.vpc_1.id
  description = "Security group for MySQL database allowing access only from public subnet"

  tags = {
  }

  lifecycle {
    create_before_destroy = true
  }
}



resource "aws_vpc_security_group_ingress_rule" "sbejifwn_ingress_rule" {
  security_group_id = aws_security_group.sg_db_1.id
  ip_protocol       = "tcp"
  from_port         = 3306
  to_port           = 3306
  cidr_ipv4         = "10.0.1.0/24"
  
  description       = ""

  tags = {
  }
}


resource "aws_vpc_security_group_egress_rule" "uvjhxuzs_egress_rule" {
  security_group_id = aws_security_group.sg_db_1.id
  ip_protocol       = "-1"
  from_port         = 0
  to_port           = 0
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = ""

  tags = {
  }
}

