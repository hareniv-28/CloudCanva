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


resource "aws_subnet" "subnet_1" {
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


resource "aws_route_table" "rt_1" {
  vpc_id = aws_vpc.vpc_1.id



  tags = {
    Name = ""
  }
}


resource "aws_instance" "ec2_1" {
    ami  = "ami-09a9858973b288bdd"
    instance_type = "t3.micro"

    vpc_security_group_ids = [aws_security_group.sg_1.id]

    subnet_id = aws_subnet.subnet_1.id

    tags = {
        Name = ""
    }
}


resource "aws_s3_bucket" "s3_1" {
  bucket = "app-logs-bucket"

  tags = {
    Name = "app-logs-bucket"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "s3_1_versioning" {
  bucket = aws_s3_bucket.s3_1.id

  versioning_configuration {
    status = "Enabled"
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



resource "aws_vpc_security_group_ingress_rule" "xezhmywa_ingress_rule" {
  security_group_id = aws_security_group.sg_1.id
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = ""

  tags = {
  }
}


resource "aws_vpc_security_group_ingress_rule" "dddhwiwg_ingress_rule" {
  security_group_id = aws_security_group.sg_1.id
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = ""

  tags = {
  }
}


resource "aws_vpc_security_group_ingress_rule" "hgqzkhca_ingress_rule" {
  security_group_id = aws_security_group.sg_1.id
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
  cidr_ipv4         = "10.0.0.0/16"
  
  description       = ""

  tags = {
  }
}


resource "aws_vpc_security_group_egress_rule" "ctdoqiuj_egress_rule" {
  security_group_id = aws_security_group.sg_1.id
  ip_protocol       = "-1"
  from_port         = 0
  to_port           = 0
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = ""

  tags = {
  }
}

