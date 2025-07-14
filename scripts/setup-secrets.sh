#!/bin/bash

echo "🔐 AWS Secrets Manager에 자격 증명 저장 중..."

# Secrets Manager에 AWS 자격 증명 저장
aws secretsmanager create-secret \
    --name "demo-factory/aws-credentials" \
    --description "AWS Demo Factory 애플리케이션용 AWS 자격 증명" \
    --secret-string '{
        "AWS_ACCESS_KEY_ID": "YOUR_ACCESS_KEY_HERE",
        "AWS_SECRET_ACCESS_KEY": "YOUR_SECRET_KEY_HERE",
        "AWS_REGION": "us-west-2"
    }' \
    --region us-west-2

echo "✅ Secrets Manager에 자격 증명 저장 완료"
echo "📋 Secret ARN을 확인하세요:"
aws secretsmanager describe-secret --secret-id "demo-factory/aws-credentials" --region us-west-2 --query 'ARN' --output text
