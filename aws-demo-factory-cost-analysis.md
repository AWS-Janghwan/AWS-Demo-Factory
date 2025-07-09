# AWS Demo Factory Cost Analysis Estimate Report

## Service Overview

AWS Demo Factory is a fully managed, serverless service that allows you to This project uses multiple AWS services.. This service follows a pay-as-you-go pricing model, making it cost-effective for various workloads.

## Pricing Model

This cost analysis estimate is based on the following pricing model:
- **ON DEMAND** pricing (pay-as-you-go) unless otherwise specified
- Standard service configurations without reserved capacity or savings plans
- No caching or optimization techniques applied

## Assumptions

- Standard ON DEMAND pricing model for all AWS services
- Development/testing environment usage patterns
- Moderate user activity with 1,000 monthly active users
- Average content size of 5MB per upload
- 100GB total storage usage per month
- Local storage fallback when S3 is unavailable
- Express.js server running on EC2 or local environment

## Limitations and Exclusions

- EC2 instance costs for hosting Express.js server
- Domain name and SSL certificate costs
- AWS CodeDeploy deployment costs
- CloudFront CDN costs (recommended for production)
- Data transfer costs between regions
- Development and maintenance costs
- Third-party library licensing costs

## Cost Breakdown

### Unit Pricing Details

| Service | Resource Type | Unit | Price | Free Tier |
|---------|--------------|------|-------|------------|
| AWS Lambda | Compute | GB-second | $0.0000166667 | 1M requests and 400,000 GB-seconds free per month (permanent) |
| AWS Lambda | Requests | 1,000,000 requests | $0.20 | 1M requests and 400,000 GB-seconds free per month (permanent) |
| Amazon Cognito | Email Verification | 1 unit | Amazon SES pricing applies | First 10,000 MAU free for Essentials tier (permanent free tier) |
| Amazon Cognito | Essentials Mau | MAU above 10,000 free tier | $0.015 | First 10,000 MAU free for Essentials tier (permanent free tier) |
| Amazon Cognito | Sms Mfa | 1 unit | Amazon SNS pricing applies | First 10,000 MAU free for Essentials tier (permanent free tier) |
| Amazon S3 | Get Requests | 1,000 requests | $0.0004 | First 5GB storage, 20,000 GET requests, 2,000 PUT requests free for 12 months |
| Amazon S3 | Put Requests | 1,000 requests | $0.005 | First 5GB storage, 20,000 GET requests, 2,000 PUT requests free for 12 months |
| Amazon S3 | Storage | GB per month (Standard) | $0.023 | First 5GB storage, 20,000 GET requests, 2,000 PUT requests free for 12 months |
| Express.js Backend Server | Ec2 T2 Micro | hour (if hosted on AWS) | $0.0116 | EC2 t2.micro free for 12 months if using AWS hosting |
| Express.js Backend Server | Local Hosting | 1 unit | $0.00 (if self-hosted) | EC2 t2.micro free for 12 months if using AWS hosting |

### Cost Calculation

| Service | Usage | Calculation | Monthly Cost |
|---------|-------|-------------|-------------|
| AWS Lambda | 100,000 requests per month, 512MB memory, 200ms average duration (Compute Time: 10,000 GB-seconds (100K × 0.2s × 0.5GB), Requests: 100,000 requests) | 100K requests < 1M free + 10K GB-seconds < 400K free = $0.00 | $0.00 |
| Amazon Cognito | 1,000 monthly active users with Essentials tier (Monthly Active Users: 1,000 users, Tier: Essentials) | 1,000 MAU < 10,000 free tier limit = $0.00 | $0.00 |
| Amazon S3 | 100GB storage, 10,000 PUT requests, 50,000 GET requests per month (Get Requests: 50,000 requests, Put Requests: 10,000 requests, Storage: 100 GB) | Storage: (100GB - 5GB free) × $0.023 = $2.19 + PUT: (10K - 2K free) × $0.005 = $0.04 + GET: (50K - 20K free) × $0.0004 = $0.012 = $2.24 | $2.50 |
| Express.js Backend Server | Self-hosted or EC2 instance for S3 presigned URL generation (Hosting: 24/7 operation) | Depends on hosting choice - local hosting = $0, EC2 = ~$8.50/month | Variable |
| **Total** | **All services** | **Sum of all calculations** | **$2.50/month** |

### Free Tier

Free tier information by service:
- **AWS Lambda**: 1M requests and 400,000 GB-seconds free per month (permanent)
- **Amazon Cognito**: First 10,000 MAU free for Essentials tier (permanent free tier)
- **Amazon S3**: First 5GB storage, 20,000 GET requests, 2,000 PUT requests free for 12 months
- **Express.js Backend Server**: EC2 t2.micro free for 12 months if using AWS hosting

## Cost Scaling with Usage

The following table illustrates how cost estimates scale with different usage levels:

| Service | Low Usage | Medium Usage | High Usage |
|---------|-----------|--------------|------------|
| AWS Lambda | Varies | Varies | Varies |
| Amazon Cognito | Varies | Varies | Varies |
| Amazon S3 | $1/month | $2/month | $5/month |
| Express.js Backend Server | Varies | Varies | Varies |

### Key Cost Factors

- **AWS Lambda**: 100,000 requests per month, 512MB memory, 200ms average duration
- **Amazon Cognito**: 1,000 monthly active users with Essentials tier
- **Amazon S3**: 100GB storage, 10,000 PUT requests, 50,000 GET requests per month
- **Express.js Backend Server**: Self-hosted or EC2 instance for S3 presigned URL generation

## Projected Costs Over Time

The following projections show estimated monthly costs over a 12-month period based on different growth patterns:

Base monthly cost calculation:

| Service | Monthly Cost |
|---------|-------------|
| Amazon S3 | $2.50 |
| **Total Monthly Cost** | **$2** |

| Growth Pattern | Month 1 | Month 3 | Month 6 | Month 12 |
|---------------|---------|---------|---------|----------|
| Steady | $2/mo | $2/mo | $2/mo | $2/mo |
| Moderate | $2/mo | $2/mo | $3/mo | $4/mo |
| Rapid | $2/mo | $3/mo | $4/mo | $7/mo |

* Steady: No monthly growth (1.0x)
* Moderate: 5% monthly growth (1.05x)
* Rapid: 10% monthly growth (1.1x)

## Detailed Cost Analysis

### Pricing Model

ON DEMAND


### Exclusions

- EC2 instance costs for hosting Express.js server
- Domain name and SSL certificate costs
- AWS CodeDeploy deployment costs
- CloudFront CDN costs (recommended for production)
- Data transfer costs between regions
- Development and maintenance costs
- Third-party library licensing costs

### Recommendations

#### Immediate Actions

- Leverage AWS Free Tier benefits - current usage falls within free limits
- Implement S3 Intelligent-Tiering for automatic cost optimization
- Use S3 lifecycle policies to transition old content to cheaper storage classes
- Enable S3 Transfer Acceleration only if needed for global users
- Consider using CloudFront CDN for better performance and reduced S3 costs
#### Best Practices

- Monitor usage with AWS Cost Explorer and set up billing alerts
- Implement proper error handling for S3 operations to avoid unnecessary requests
- Use S3 multipart upload for files larger than 100MB
- Optimize image and video compression before uploading to S3
- Consider using Amazon Cognito Identity Pools for temporary AWS credentials
- Implement caching strategies to reduce Lambda invocations
- Use AWS CodeDeploy for automated deployments to reduce manual effort



## Cost Optimization Recommendations

### Immediate Actions

- Leverage AWS Free Tier benefits - current usage falls within free limits
- Implement S3 Intelligent-Tiering for automatic cost optimization
- Use S3 lifecycle policies to transition old content to cheaper storage classes

### Best Practices

- Monitor usage with AWS Cost Explorer and set up billing alerts
- Implement proper error handling for S3 operations to avoid unnecessary requests
- Use S3 multipart upload for files larger than 100MB

## Conclusion

By following the recommendations in this report, you can optimize your AWS Demo Factory costs while maintaining performance and reliability. Regular monitoring and adjustment of your usage patterns will help ensure cost efficiency as your workload evolves.
