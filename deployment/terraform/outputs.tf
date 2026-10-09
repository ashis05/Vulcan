output "instance_id" {
  description = "EC2 instance id."
  value       = aws_instance.api.id
}

output "elastic_ip" {
  description = "Stable public IP (Elastic IP) — use this as SSH_HOST in GitHub Actions."
  value       = aws_eip.api.public_ip
}

output "ssh_command" {
  description = "SSH command for the default Ubuntu user."
  value       = "ssh ubuntu@${aws_eip.api.public_ip}"
}

output "ami_id" {
  description = "Resolved Ubuntu 24.04 AMI id."
  value       = data.aws_ami.ubuntu.id
}
