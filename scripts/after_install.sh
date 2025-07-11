#!/bin/bash

cd /data/AWS-Demo-Factory

# 환경 변수 설정 (빠른 버전)
cat > .env.production << 'EOF'
NODE_ENV=production
REACT_APP_API_BASE_URL=https://www.demofactory.cloud
REACT_APP_BACKEND_API_URL=https://www.demofactory.cloud:3001
REACT_APP_PDF_SERVER_URL=https://www.demofactory.cloud:5002
REACT_APP_BEDROCK_SERVER_URL=https://www.demofactory.cloud:5001
REACT_APP_COGNITO_REGION=us-west-2
REACT_APP_COGNITO_IDENTITY_POOL_ID=us-west-2:f02cd74c-db8b-4809-9f26-be7a52e880b6
REACT_APP_COGNITO_USER_POOL_ID=us-west-2_35cY0az2M
REACT_APP_COGNITO_USER_POOL_CLIENT_ID=7r2d2c8dnb245bk9r9e8f2vqev
REACT_APP_COGNITO_REGION=us-west-2
REACT_APP_S3_BUCKET=demo-factory-storage-bucket
REACT_APP_DYNAMODB_TABLE=DemoFactoryContents
REACT_APP_DYNAMODB_REGION=us-west-2
EOF

cp .env.production .env

# npm 설치 (캐시 활용)
npm ci --only=production --silent

# React 빌드 (환경변수 정리)
unset AWS_ACCESS_KEY_ID
unset AWS_SECRET_ACCESS_KEY
npm run build

# Python 환경 (필수만)
cd python-pdf-server
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install --quiet flask flask-cors requests python-dotenv reportlab

echo "AfterInstall 완료" 
