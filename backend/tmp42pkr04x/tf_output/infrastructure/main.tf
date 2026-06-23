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
    Name = "saas-vpc"
  }
}


resource "aws_internet_gateway" "igw_1" {
  vpc_id = aws_vpc.vpc_1.id

  tags = {
    Name = ""
    Name = "saas-igw"
  }
}


resource "aws_subnet" "subnet_public_1a" {
  vpc_id            = aws_vpc.vpc_1.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "eu-north-1a"

  map_public_ip_on_launch = true

  tags = {
    Name = ""
    Name = "saas-public-subnet-1a"
  }

  lifecycle {
    create_before_destroy = true
  } 
}


resource "aws_subnet" "subnet_public_1b" {
  vpc_id            = aws_vpc.vpc_1.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "eu-north-1b"

  map_public_ip_on_launch = true

  tags = {
    Name = ""
    Name = "saas-public-subnet-1b"
  }

  lifecycle {
    create_before_destroy = true
  } 
}


resource "aws_subnet" "subnet_private_1a" {
  vpc_id            = aws_vpc.vpc_1.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "eu-north-1a"

  map_public_ip_on_launch = false

  tags = {
    Name = ""
    Name = "saas-private-subnet-1a"
  }

  lifecycle {
    create_before_destroy = true
  } 
}


resource "aws_subnet" "subnet_private_1b" {
  vpc_id            = aws_vpc.vpc_1.id
  cidr_block        = "10.0.4.0/24"
  availability_zone = "eu-north-1b"

  map_public_ip_on_launch = false

  tags = {
    Name = ""
    Name = "saas-private-subnet-1b"
  }

  lifecycle {
    create_before_destroy = true
  } 
}


resource "aws_subnet" "subnet_db_1a" {
  vpc_id            = aws_vpc.vpc_1.id
  cidr_block        = "10.0.5.0/24"
  availability_zone = "eu-north-1a"

  map_public_ip_on_launch = false

  tags = {
    Name = ""
    Name = "saas-db-subnet-1a"
  }

  lifecycle {
    create_before_destroy = true
  } 
}


resource "aws_subnet" "subnet_db_1b" {
  vpc_id            = aws_vpc.vpc_1.id
  cidr_block        = "10.0.6.0/24"
  availability_zone = "eu-north-1b"

  map_public_ip_on_launch = false

  tags = {
    Name = ""
    Name = "saas-db-subnet-1b"
  }

  lifecycle {
    create_before_destroy = true
  } 
}


resource "aws_route_table" "rt_public" {
  vpc_id = aws_vpc.vpc_1.id



  tags = {
    Name = ""
    Name = "saas-public-rt"
  }
}


resource "aws_route_table" "rt_private" {
  vpc_id = aws_vpc.vpc_1.id



  tags = {
    Name = ""
    Name = "saas-private-rt"
  }
}


resource "aws_lb" "alb_1" {
  name               = ""
  internal           = false
  load_balancer_type = "application"

  subnets = [
    aws_subnet.subnet_public_1a.id,
    aws_subnet.subnet_public_1b.id,
  ]

  security_groups = [
    aws_security_group.sg_alb.id,
  ]

  tags = {
    Name = ""
    Name = "saas-alb"
  }
}


resource "aws_lb_target_group" "tg_1" {
  name     = "tg-1"
  port     = 8080
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
    Name = "saas-tg"
  }
}


resource "aws_instance" "ec2_app_1" {
    ami  = "ami-09a9858973b288bdd"
    instance_type = "t3.medium"


    subnet_id = aws_subnet.subnet_private_1a.id

    tags = {
        Name = ""
    }
}


resource "aws_instance" "ec2_app_2" {
    ami  = "ami-09a9858973b288bdd"
    instance_type = "t3.medium"


    subnet_id = aws_subnet.subnet_private_1b.id

    tags = {
        Name = ""
    }
}


resource "aws_instance" "ec2_bastion" {
    ami  = "ami-09a9858973b288bdd"
    instance_type = "t3.micro"


    subnet_id = aws_subnet.subnet_public_1a.id

    tags = {
        Name = ""
    }
}


resource "aws_eip" "eip_bastion" {
  domain = "vpc"




  tags = {
    Name = ""
    Name = "saas-bastion-eip"
  }

  lifecycle {
    create_before_destroy = true
  }
}


resource "aws_db_subnet_group" "rds_1_subnet_group" {
  name       = "rds-1-subnet-group"
  subnet_ids = [
    aws_subnet.subnet_db_1a.id,
    aws_subnet.subnet_db_1b.id,
  ]

  tags = {
    Name = "rds-1-subnet-group"
  }
}

resource "aws_db_instance" "rds_1" {
  identifier          = "rds-1"
  engine              = "postgres"
  instance_class      = "db.t3.medium"
  allocated_storage   = 100
  db_name             = "saasdb"
  username            = "saasadmin"
  password            = "changeme123"
  skip_final_snapshot = true
  db_subnet_group_name = aws_db_subnet_group.rds_1_subnet_group.name


  tags = {
    Name = ""
    Name = "saas-postgres-db"
  }
}


resource "aws_s3_bucket" "s3_assets" {
  bucket = "saas-startup-assets"

  tags = {
    Name = "saas-startup-assets"
    Name = "saas-assets-bucket"
  }

  lifecycle {
    create_before_destroy = true
  }
}


resource "aws_s3_bucket_versioning" "s3_assets_versioning" {
  bucket = aws_s3_bucket.s3_assets.id
  status = "Enabled"
}



resource "aws_s3_bucket" "s3_logs" {
  bucket = "saas-startup-logs"

  tags = {
    Name = "saas-startup-logs"
    Name = "saas-logs-bucket"
  }

  lifecycle {
    create_before_destroy = true
  }
}





resource "aws_security_group" "sg_alb" {
  vpc_id      = aws_vpc.vpc_1.id
  description = "Security group for Application Load Balancer"

  tags = {
    Name = "saas-alb-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}



resource "aws_vpc_security_group_ingress_rule" "pihujqyf_ingress_rule" {
  security_group_id = aws_security_group.sg_alb.id
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = ""

  tags = {
  }
}


resource "aws_vpc_security_group_ingress_rule" "yczwdtwo_ingress_rule" {
  security_group_id = aws_security_group.sg_alb.id
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = ""

  tags = {
  }
}


resource "aws_vpc_security_group_egress_rule" "zlnjzupf_egress_rule" {
  security_group_id = aws_security_group.sg_alb.id
  ip_protocol       = "-1"
  from_port         = 0
  to_port           = 0
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = ""

  tags = {
  }
}


resource "aws_security_group" "sg_app" {
  vpc_id      = aws_vpc.vpc_1.id
  description = "Security group for application servers"

  tags = {
    Name = "saas-app-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}



resource "aws_vpc_security_group_ingress_rule" "cwdhalox_ingress_rule" {
  security_group_id = aws_security_group.sg_app.id
  ip_protocol       = "tcp"
  from_port         = 8080
  to_port           = 8080
  cidr_ipv4         = "10.0.1.0/24"
  
  description       = ""

  tags = {
  }
}


resource "aws_vpc_security_group_ingress_rule" "wlsizxvy_ingress_rule" {
  security_group_id = aws_security_group.sg_app.id
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
  cidr_ipv4         = "10.0.0.0/16"
  
  description       = ""

  tags = {
  }
}


resource "aws_vpc_security_group_egress_rule" "ejlbaxze_egress_rule" {
  security_group_id = aws_security_group.sg_app.id
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
  description = "Security group for RDS database"

  tags = {
    Name = "saas-db-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}



resource "aws_vpc_security_group_ingress_rule" "ojxsrgra_ingress_rule" {
  security_group_id = aws_security_group.sg_db.id
  ip_protocol       = "tcp"
  from_port         = 5432
  to_port           = 5432
  cidr_ipv4         = "10.0.3.0/24"
  
  description       = ""

  tags = {
  }
}


resource "aws_vpc_security_group_egress_rule" "mypzydxy_egress_rule" {
  security_group_id = aws_security_group.sg_db.id
  ip_protocol       = "-1"
  from_port         = 0
  to_port           = 0
  cidr_ipv4         = "0.0.0.0/0"
  
  description       = ""

  tags = {
  }
}

