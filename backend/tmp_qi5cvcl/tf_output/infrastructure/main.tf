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
  enable_dns_hostnames           = false
  instance_tenancy                 = "default"

  tags = {
    Name = "main-vpc"
  }
}


resource "aws_internet_gateway" "ai_igw_1" {
  vpc_id = aws_vpc.ai_vpc_1.id

  tags = {
    Name = "main-igw"
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

