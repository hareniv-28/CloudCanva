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


resource "aws_subnet" "subnet_public_2" {
  vpc_id            = aws_vpc.vpc_1.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "eu-north-1b"

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


resource "aws_lb" "alb_1" {
  name               = "public-lb"
  internal           = false
  load_balancer_type = "application"

  subnets = [
    aws_subnet.subnet_public_1.id,
    aws_subnet.subnet_public_2.id,
  ]

  security_groups = [
    aws_security_group.sg_alb.id,
  ]

  tags = {
    Name = "public-lb"
  }
}


resource "aws_lb_target_group" "tg_1" {
  name     = "tg-1"
  port     = 80
  protocol = "HTTP"

  vpc_id = aws_vpc.vpc_1.id

  health_check {
    path                = "/"
    protocol            = "HTTP"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
  }

  tags = {
    Name = ""
  }
}


resource "aws_instance" "ec2_1" {
    ami  = "ami-09a9858973b288bdd"
    instance_type = "t3.micro"


    subnet_id = aws_subnet.subnet_public_1.id

    tags = {
        Name = ""
    }
}


resource "aws_instance" "ec2_2" {
    ami  = "ami-09a9858973b288bdd"
    instance_type = "t3.micro"


    subnet_id = aws_subnet.subnet_public_2.id

    tags = {
        Name = ""
    }
}


resource "aws_security_group" "sg_alb" {
  vpc_id      = aws_vpc.vpc_1.id
  description = "Security group for ALB"

  tags = {
  }

  lifecycle {
    create_before_destroy = true
  }
}



resource "aws_vpc_security_group_ingress_rule" "acanmrda_ingress_rule" {
  security_group_id = aws_security_group.sg_alb.id
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = ""

  tags = {
  }
}


resource "aws_vpc_security_group_ingress_rule" "bbtisjmh_ingress_rule" {
  security_group_id = aws_security_group.sg_alb.id
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = ""

  tags = {
  }
}


resource "aws_vpc_security_group_egress_rule" "nrfgltni_egress_rule" {
  security_group_id = aws_security_group.sg_alb.id
  ip_protocol       = "-1"
  from_port         = 0
  to_port           = 0
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = ""

  tags = {
  }
}


resource "aws_security_group" "sg_ec2" {
  vpc_id      = aws_vpc.vpc_1.id
  description = "Security group for EC2 instances"

  tags = {
  }

  lifecycle {
    create_before_destroy = true
  }
}



resource "aws_vpc_security_group_ingress_rule" "pokiwrcl_ingress_rule" {
  security_group_id = aws_security_group.sg_ec2.id
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = ""

  tags = {
  }
}


resource "aws_vpc_security_group_ingress_rule" "cebjalog_ingress_rule" {
  security_group_id = aws_security_group.sg_ec2.id
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
  cidr_ipv4         = "10.0.0.0/16"
  
  description       = ""

  tags = {
  }
}


resource "aws_vpc_security_group_egress_rule" "mjlmyqtq_egress_rule" {
  security_group_id = aws_security_group.sg_ec2.id
  ip_protocol       = "-1"
  from_port         = 0
  to_port           = 0
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = ""

  tags = {
  }
}

