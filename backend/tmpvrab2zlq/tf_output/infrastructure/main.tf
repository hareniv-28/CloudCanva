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


resource "aws_subnet" "subnet_private_1" {
  vpc_id            = aws_vpc.vpc_1.id
  cidr_block        = "10.0.3.0/24"
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
  cidr_block        = "10.0.4.0/24"
  availability_zone = "eu-north-1b"

  map_public_ip_on_launch = false

  tags = {
    Name = ""
  }

  lifecycle {
    create_before_destroy = true
  } 
}


resource "aws_route_table" "rt_public" {
  vpc_id = aws_vpc.vpc_1.id



  tags = {
    Name = ""
  }
}


resource "aws_eip" "eip_1" {
  domain = "vpc"




  tags = {
    Name = ""
  }

  lifecycle {
    create_before_destroy = true
  }
}


resource "aws_lb" "alb_1" {
  name               = "Hithere-lb"
  internal           = false
  load_balancer_type = "application"



  tags = {
    Name = "Hithere-lb"
  }
}


resource "aws_lb_target_group" "tg_1" {
  name     = ""
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


resource "aws_instance" "ec2_web_1" {
    ami  = "ami-09a9858973b288bdd"
    instance_type = "t3.micro"

    vpc_security_group_ids = [aws_security_group.sg_web.id]

    subnet_id = aws_subnet.subnet_public_1.id

    tags = {
        Name = ""
    }
}


resource "aws_instance" "ec2_web_2" {
    ami  = "ami-09a9858973b288bdd"
    instance_type = "t3.micro"

    vpc_security_group_ids = [aws_security_group.sg_web.id]

    subnet_id = aws_subnet.subnet_public_2.id

    tags = {
        Name = ""
    }
}


resource "aws_instance" "ec2_web_3" {
    ami  = "ami-09a9858973b288bdd"
    instance_type = "t3.micro"

    vpc_security_group_ids = [aws_security_group.sg_web.id]

    subnet_id = aws_subnet.subnet_public_1.id

    tags = {
        Name = ""
    }
}


resource "aws_db_instance" "rds_1" {
  identifier          = "rds-1"
  engine              = "postgres"
  engine_version      = "15.3"
  instance_class      = "db.t3.micro"
  allocated_storage   = 20
  db_name             = "appdb"
  username            = "dbadmin"
  password            = "changeme123"
  skip_final_snapshot = true


  vpc_security_group_ids = [aws_security_group.sg_db.id]

  tags = {
    Name = ""
  }
}


resource "aws_security_group" "sg_web" {
  vpc_id      = aws_vpc.vpc_1.id
  description = "Allow HTTP and HTTPS from anywhere, SSH from VPC only"

  tags = {
  }

  lifecycle {
    create_before_destroy = true
  }
}



resource "aws_vpc_security_group_ingress_rule" "njfmwnnx_ingress_rule" {
  security_group_id = aws_security_group.sg_web.id
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
  cidr_ipv4         = "0"
  
  description       = ""

  tags = {
  }
}


resource "aws_vpc_security_group_ingress_rule" "mckknplu_ingress_rule" {
  security_group_id = aws_security_group.sg_web.id
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_ipv4         = "0"
  
  description       = ""

  tags = {
  }
}


resource "aws_vpc_security_group_ingress_rule" "nottpcmm_ingress_rule" {
  security_group_id = aws_security_group.sg_web.id
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
  cidr_ipv4         = "1"
  
  description       = ""

  tags = {
  }
}


resource "aws_vpc_security_group_egress_rule" "ggascgem_egress_rule" {
  security_group_id = aws_security_group.sg_web.id
  ip_protocol       = "-1"
  from_port         = 0
  to_port           = 0
  cidr_ipv4         = "0"
  
  description       = ""

  tags = {
  }
}


resource "aws_security_group" "sg_db" {
  vpc_id      = aws_vpc.vpc_1.id
  description = "Allow PostgreSQL only from web subnet"

  tags = {
  }

  lifecycle {
    create_before_destroy = true
  }
}



resource "aws_vpc_security_group_ingress_rule" "fgwjahps_ingress_rule" {
  security_group_id = aws_security_group.sg_db.id
  ip_protocol       = "tcp"
  from_port         = 5432
  to_port           = 5432
  cidr_ipv4         = "1"
  
  description       = ""

  tags = {
  }
}


resource "aws_vpc_security_group_egress_rule" "utwmluca_egress_rule" {
  security_group_id = aws_security_group.sg_db.id
  ip_protocol       = "-1"
  from_port         = 0
  to_port           = 0
  cidr_ipv4         = "0"
  
  description       = ""

  tags = {
  }
}

