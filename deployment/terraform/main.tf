# VULCAN API host — one EC2 instance in a dedicated VPC, reached over SSH.
#
# The API container talks to Supabase and Gemini outbound; Cloudflare Tunnel
# (cloudflared, also on this instance) publishes it, so the security group only
# needs port 22. No inbound 80/443, no NAT gateway, no load balancer.

data "aws_availability_zones" "available" {
  state = "available"
}

# Canonical Ubuntu 24.04 LTS (Noble), matching the instance architecture.
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd*/ubuntu-noble-24.04-${var.ami_architecture}-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "state"
    values = ["available"]
  }
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "${var.project}-vpc" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = { Name = "${var.project}-igw" }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = false

  tags = { Name = "${var.project}-public" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "${var.project}-public" }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

resource "aws_security_group" "api" {
  name        = "${var.project}-api"
  description = "VULCAN API host: SSH in, all outbound (Cloudflare Tunnel + AWS APIs)."
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "SSH (key-only)"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.ssh_allowed_cidrs
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project}-api" }
}

resource "aws_key_pair" "deploy" {
  key_name   = "${var.project}-deploy"
  public_key = var.ssh_public_key
}

resource "aws_instance" "api" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.api.id]
  key_name               = aws_key_pair.deploy.key_name

  # The Elastic IP is attached separately (below).
  associate_public_ip_address = false

  # First-boot bootstrap: Docker, compose plugin, swapfile, app directory.
  user_data                   = templatefile("${path.module}/user_data.sh", { swap_size_gb = var.swap_size_gb })
  user_data_replace_on_change = false

  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.root_volume_gb
    encrypted             = true
    delete_on_termination = true
  }

  # IMDSv2 only.
  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  tags = { Name = "${var.project}-api" }

  lifecycle {
    ignore_changes = [ami] # don't force-replace when Canonical publishes a newer image
  }
}

resource "aws_eip" "api" {
  domain = "vpc"

  tags = { Name = "${var.project}-api" }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_eip_association" "api" {
  instance_id   = aws_instance.api.id
  allocation_id = aws_eip.api.id
}
