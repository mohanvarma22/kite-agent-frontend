provider "aws" { region = var.aws_region }
data "aws_caller_identity" "current" {}
data "aws_iam_openid_connect_provider" "github" { url = "https://token.actions.githubusercontent.com" }
data "aws_cloudfront_cache_policy" "caching_optimized" { name = "Managed-CachingOptimized" }

locals {
  bucket_name = "${var.project_name}-${data.aws_caller_identity.current.account_id}-${var.aws_region}"
  github_repo_match = "repo:${var.github_owner}/${var.github_repo}:*"
  common_tags = { Project = var.project_name, ManagedBy = "terraform" }
}

resource "aws_s3_bucket" "site" { bucket = local.bucket_name, tags = local.common_tags }
resource "aws_s3_bucket_public_access_block" "site" { bucket = aws_s3_bucket.site.id, block_public_acls = true, block_public_policy = true, ignore_public_acls = true, restrict_public_buckets = true }
resource "aws_s3_bucket_versioning" "site" { bucket = aws_s3_bucket.site.id, versioning_configuration { status = "Enabled" } }

resource "aws_cloudfront_origin_access_control" "site" {
  name = "${var.project_name}-oac"
  description = "Allow CloudFront to read the private frontend bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior = "always"
  signing_protocol = "sigv4"
}

resource "aws_cloudfront_distribution" "site" {
  enabled = true
  default_root_object = "index.html"
  price_class = "PriceClass_100"
  origin { domain_name = aws_s3_bucket.site.bucket_regional_domain_name, origin_access_control_id = aws_cloudfront_origin_access_control.site.id, origin_id = "s3-site" }
  default_cache_behavior { target_origin_id = "s3-site", viewer_protocol_policy = "redirect-to-https", allowed_methods = ["GET", "HEAD", "OPTIONS"], cached_methods = ["GET", "HEAD"], cache_policy_id = data.aws_cloudfront_cache_policy.caching_optimized.id, compress = true }
  custom_error_response { error_code = 403, response_code = 200, response_page_path = "/index.html" }
  custom_error_response { error_code = 404, response_code = 200, response_page_path = "/index.html" }
  restrictions { geo_restriction { restriction_type = "none" } }
  viewer_certificate { cloudfront_default_certificate = true }
  tags = local.common_tags
}

data "aws_iam_policy_document" "site_bucket" {
  statement {
    actions = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.site.arn}/*"]
    principals { type = "Service", identifiers = ["cloudfront.amazonaws.com"] }
    condition { test = "StringEquals", variable = "AWS:SourceArn", values = [aws_cloudfront_distribution.site.arn] }
  }
}
resource "aws_s3_bucket_policy" "site" { bucket = aws_s3_bucket.site.id, policy = data.aws_iam_policy_document.site_bucket.json }

data "aws_iam_policy_document" "github_actions_assume_role" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals { type = "Federated", identifiers = [data.aws_iam_openid_connect_provider.github.arn] }
    condition { test = "StringEquals", variable = "token.actions.githubusercontent.com:aud", values = ["sts.amazonaws.com"] }
    condition { test = "StringLike", variable = "token.actions.githubusercontent.com:sub", values = [local.github_repo_match] }
  }
}
resource "aws_iam_role" "github_actions_deploy" { name = "${var.project_name}-github-actions-deploy", assume_role_policy = data.aws_iam_policy_document.github_actions_assume_role.json, tags = local.common_tags }
resource "aws_iam_role_policy" "github_actions_deploy" {
  name = "${var.project_name}-deploy-policy"
  role = aws_iam_role.github_actions_deploy.id
  policy = jsonencode({ Version = "2012-10-17", Statement = [
    { Effect = "Allow", Action = ["s3:ListBucket"], Resource = aws_s3_bucket.site.arn },
    { Effect = "Allow", Action = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"], Resource = "${aws_s3_bucket.site.arn}/*" },
    { Effect = "Allow", Action = ["cloudfront:CreateInvalidation"], Resource = aws_cloudfront_distribution.site.arn }
  ] })
}
