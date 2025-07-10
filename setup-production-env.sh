#!/bin/bash

echo "🔧 프로덕션 환경 변수 설정..."

# 서버 IP 또는 도메인 확인
SERVER_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "localhost")
DOMAIN="www.demofactory.cloud"

echo "🌐 서버 정보:"
echo "  - 서버 IP: $SERVER_IP"
echo "  - 도메인: $DOMAIN"

# 프로덕션 환경 변수 파일 생성
cat > /data/AWS-Demo-Factory/.env.production << EOF
# 프로덕션 환경 설정
NODE_ENV=production

# API 서버 URL (프로덕션)
REACT_APP_API_BASE_URL=https://$DOMAIN
REACT_APP_BACKEND_API_URL=https://$DOMAIN:3001
REACT_APP_PDF_SERVER_URL=https://$DOMAIN:5002
REACT_APP_BEDROCK_SERVER_URL=https://$DOMAIN:5001

# 또는 HTTP 사용 시
# REACT_APP_API_BASE_URL=http://$SERVER_IP
# REACT_APP_BACKEND_API_URL=http://$SERVER_IP:3001
# REACT_APP_PDF_SERVER_URL=http://$SERVER_IP:5002
# REACT_APP_BEDROCK_SERVER_URL=http://$SERVER_IP:5001

# AWS 설정 (기존 .env에서 복사)
REACT_APP_COGNITO_REGION=us-west-2
REACT_APP_COGNITO_IDENTITY_POOL_ID=us-west-2:f02cd74c-db8b-4809-9f26-be7a52e880b6
REACT_APP_COGNITO_USER_POOL_ID=us-west-2_35cY0az2M
REACT_APP_COGNITO_USER_POOL_CLIENT_ID=7r2d2c8dnb245bk9r9e8f2vqev
REACT_APP_AWS_REGION=ap-northeast-2
REACT_APP_S3_BUCKET=aws-demo-factory
REACT_APP_DYNAMODB_TABLE=DemoFactoryContents
REACT_APP_BEDROCK_REGION=us-west-2

# 서버 측 AWS 설정 (환경 변수에서 가져옴)
AWS_ACCESS_KEY_ID=\${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=\${AWS_SECRET_ACCESS_KEY}
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET=aws-demo-factory

# 기타 설정
SES_FROM_EMAIL=awsdemofactory@gmail.com
REACT_APP_DEBUG_MODE=false
REACT_APP_ENABLE_ANALYTICS=true
EOF

echo "✅ 프로덕션 환경 변수 파일 생성 완료: /data/AWS-Demo-Factory/.env.production"

# 기존 .env 파일 백업 및 교체
if [ -f /data/AWS-Demo-Factory/.env ]; then
    cp /data/AWS-Demo-Factory/.env /data/AWS-Demo-Factory/.env.backup
    echo "📋 기존 .env 파일 백업 완료"
fi

cp /data/AWS-Demo-Factory/.env.production /data/AWS-Demo-Factory/.env
echo "🔄 프로덕션 환경 변수 적용 완료"

echo "🎯 프로덕션 환경 설정 완료!"
