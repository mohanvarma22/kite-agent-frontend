# kite-agent-frontend

React + Vite frontend for the Kite Agent backend.

## Local Setup

Copy env template:

```powershell
Copy-Item .env.example .env
```

Fill:

```env
VITE_SUPABASE_URL=https://sryysamerqkigeycaxpx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your publishable key>
VITE_API_BASE_URL=http://100.52.230.148:8000
```

Install and run:

```powershell
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## AWS Frontend Hosting

The frontend is static after build. S3 stores `dist/`, and CloudFront serves it over HTTPS with the S3 bucket private.

Run frontend infra once:

```powershell
cd infra
terraform init `
  -backend-config="bucket=kite-agent-tf-state-438152404898-us-east-1" `
  -backend-config="key=kite-agent-frontend/terraform.tfstate" `
  -backend-config="region=us-east-1" `
  -backend-config="dynamodb_table=kite-agent-tf-locks" `
  -backend-config="encrypt=true"

terraform apply `
  -var="github_owner=mohanvarma22" `
  -var="github_repo=kite-agent-frontend"
```

Add Terraform outputs to GitHub repository secrets:

```text
AWS_ROLE_ARN
SITE_BUCKET
CLOUDFRONT_DISTRIBUTION_ID
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Pushing to `main` builds the frontend, uploads to S3, and invalidates CloudFront.

## Backend CORS

Backend `FRONTEND_ORIGINS` must include:

```text
http://localhost:5173
```

After CloudFront deploy, also add the CloudFront URL.
