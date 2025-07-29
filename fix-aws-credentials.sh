#!/bin/bash

echo "🔧 AWS Credentials 설정 중..."

# AWS credentials 디렉토리 생성
mkdir -p /root/.aws

# EC2 인스턴스 역할을 사용하도록 설정
cat > /root/.aws/config << 'EOF'
[default]
region = ap-northeast-2
output = json
EOF

# EC2 인스턴스 역할 사용을 위한 credentials 파일 생성
cat > /root/.aws/credentials << 'EOF'
[default]
# EC2 인스턴스 역할 사용 - 실제 키는 메타데이터에서 자동 획득
aws_access_key_id = dummy
aws_secret_access_key = dummy
EOF

echo "✅ AWS Credentials 설정 완료"
echo "📍 EC2 인스턴스 역할을 통해 실제 인증 수행"

# 권한 설정
chmod 600 /root/.aws/credentials
chmod 600 /root/.aws/config

echo "🔍 설정 확인:"
ls -la /root/.aws/