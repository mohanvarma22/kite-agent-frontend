variable "project_name" {
  description = "Short project name used in AWS resource names."
  type        = string
  default     = "kite-agent-frontend"
}

variable "aws_region" {
  description = "AWS region for frontend infrastructure."
  type        = string
  default     = "us-east-1"
}

variable "github_owner" {
  description = "GitHub organization or username that owns the frontend repository."
  type        = string
}

variable "github_repo" {
  description = "GitHub frontend repository name."
  type        = string
  default     = "kite-agent-frontend"
}
