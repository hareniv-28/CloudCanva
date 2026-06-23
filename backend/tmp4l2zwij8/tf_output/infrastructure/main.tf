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
    Name = "igw-main"
  }
}


resource "aws_subnet" "subnet_pub_1" {
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


resource "aws_subnet" "subnet_pub_2" {
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


resource "aws_subnet" "subnet_priv_1" {
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


resource "aws_subnet" "subnet_priv_2" {
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


  route {
    cidr_block = "0.0.0.0/0"

    gateway_id = aws_internet_gateway.igw_1.id

  }

  tags = {
    Name = ""
  }
}


resource "aws_instance" "ec2_web_1" {
    ami  = "ami-09a9858973b288bdd"
    instance_type = "t3.micro"


    subnet_id = aws_subnet.subnet_pub_1.id

    tags = {
        Name = ""
    }
}


resource "aws_instance" "ec2_web_2" {
    ami  = "ami-09a9858973b288bdd"
    instance_type = "t3.micro"


    subnet_id = aws_subnet.subnet_pub_2.id

    tags = {
        Name = ""
    }
}


resource "aws_instance" "ec2_web_3" {
    ami  = "ami-09a9858973b288bdd"
    instance_type = "t3.micro"


    subnet_id = aws_subnet.subnet_pub_1.id

    tags = {
        Name = ""
    }
}


resource "aws_instance" "ec2_db_1" {
    ami  = "ami-09a9858973b288bdd"
    instance_type = "t3.medium"


    subnet_id = aws_subnet.subnet_priv_1.id

    tags = {
        Name = ""
    }
}


resource "aws_security_group" "sg_web" {
  vpc_id      = aws_vpc.vpc_1.id
  description = "Allow HTTP HTTPS and SSH from anywhere"

  tags = {
  }

  lifecycle {
    create_before_destroy = true
  }
}



resource "aws_vpc_security_group_ingress_rule" "rbnejghb_ingress_rule" {
  security_group_id = aws_security_group.sg_web.id
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = ""

  tags = {
  }
}


resource "aws_vpc_security_group_ingress_rule" "gglzcbae_ingress_rule" {
  security_group_id = aws_security_group.sg_web.id
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = ""

  tags = {
  }
}


resource "aws_vpc_security_group_ingress_rule" "kewpeehv_ingress_rule" {
  security_group_id = aws_security_group.sg_web.id
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = ""

  tags = {
  }
}


resource "aws_vpc_security_group_egress_rule" "yxpzixkh_egress_rule" {
  security_group_id = aws_security_group.sg_web.id
  ip_protocol       = "-1"
  from_port         = 0
  to_port           = 0
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = ""

  tags = {
  }
}


resource "aws_security_group" "sg_db" {
  vpc_id      = aws_vpc.vpc_1.id
  description = "Allow MySQL only from app subnet"

  tags = {
  }

  lifecycle {
    create_before_destroy = true
  }
}



resource "aws_vpc_security_group_ingress_rule" "vnucvpqb_ingress_rule" {
  security_group_id = aws_security_group.sg_db.id
  ip_protocol       = "tcp"
  from_port         = 3306
  to_port           = 3306
  cidr_ipv4         = "10.0.1.0/24"
  
  description       = ""

  tags = {
  }
}


resource "aws_vpc_security_group_egress_rule" "rkblouxv_egress_rule" {
  security_group_id = aws_security_group.sg_db.id
  ip_protocol       = "-1"
  from_port         = 0
  to_port           = 0
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = ""

  tags = {
  }
}

