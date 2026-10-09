variable "aws_profile" {
  description = <<-EOT
    Named AWS CLI profile holding the target account's credentials. Pinned so the
    provider can never silently fall back to the `default` account. Override with
    `-var="aws_profile=default"` only when intentionally operating on that account.
  EOT
  type        = string
  default     = "vulcan-prod"
}

variable "region" {
  description = "AWS region for the EC2 instance (keep it near Supabase/your users)."
  type        = string
  default     = "ap-south-1"
}

variable "project" {
  description = "Name prefix applied to every resource and the default tag."
  type        = string
  default     = "vulcan"
}

variable "instance_type" {
  description = <<-EOT
    EC2 instance type. The API is a tiny, stateless, I/O-bound FastAPI container.
    Defaults to a 2-vCPU-burstable / 1 GB ARM (Graviton) instance.
    Set ami_architecture = "amd64" if you switch to t3/t3a (x86).
  EOT
  type        = string
  default     = "t4g.micro"
}

variable "ami_architecture" {
  description = "Ubuntu AMI architecture: \"arm64\" (t4g) or \"amd64\" (t2/t3/t3a)."
  type        = string
  default     = "arm64"

  validation {
    condition     = contains(["arm64", "amd64"], var.ami_architecture)
    error_message = "ami_architecture must be \"arm64\" or \"amd64\"."
  }
}

variable "root_volume_gb" {
  description = "Root EBS (gp3) size in GB. 16 GB fits Ubuntu + Docker + a few images."
  type        = number
  default     = 16
}

variable "swap_size_gb" {
  description = "Swapfile size created on first boot, so the on-VM Docker build can't OOM."
  type        = number
  default     = 2
}

variable "vpc_cidr" {
  description = "CIDR block for the dedicated VPC."
  type        = string
  default     = "10.20.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for the single public subnet."
  type        = string
  default     = "10.20.1.0/24"
}

variable "ssh_public_key" {
  description = "Public key authorized for SSH (contents of e.g. ~/.ssh/vulcan_deploy.pub)."
  type        = string
}

variable "ssh_allowed_cidrs" {
  description = <<-EOT
    CIDRs allowed to reach port 22. Key-only auth, but 0.0.0.0/0 is the default so
    GitHub Actions (dynamic runner IPs) can deploy. Tighten to your home IP plus
    GitHub's published ranges for a locked-down setup.
  EOT
  type        = list(string)
  default     = ["0.0.0.0/0"]
}
