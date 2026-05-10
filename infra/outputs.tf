output "site_bucket" {
  description = "Private S3 bucket that stores the frontend build output."
  value       = aws_s3_bucket.site.bucket
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution id used for cache invalidation."
  value       = aws_cloudfront_distribution.site.id
}

output "cloudfront_domain_name" {
  description = "CloudFront URL for the deployed frontend."
  value       = aws_cloudfront_distribution.site.domain_name
}

output "github_actions_role_arn" {
  description = "Role ARN to store as the frontend GitHub secret AWS_ROLE_ARN."
  value       = aws_iam_role.github_actions_deploy.arn
}
