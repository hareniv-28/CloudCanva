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

resource "aws_vpc" "aws_network_1" {
  cidr_block                       = "10.0.0.0/16"
  enable_dns_support               = true
  enable_dns_hostnames           = false
  instance_tenancy                 = "default"

  tags = {
    Name = "test-vpc"
  }
}


resource "aws_subnet" "aws_Subnet_2" {
  vpc_id            = aws_vpc.aws_network_1.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"

  map_public_ip_on_launch = false

  tags = {
    Name = "public-subnet"
  }

  lifecycle {
    create_before_destroy = true
  } 
}


resource "aws_instance" "aws_compute_3" {
    ami  = "ami-0e35ddab05955cf57"
    instance_type = "t3.micro"


    subnet_id = aws_subnet.aws_Subnet_2.id


    tags = {
        Name = "web-server"
    }
}

