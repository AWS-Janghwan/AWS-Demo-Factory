#!/bin/bash

echo "🔐 AWS credentials 설정 스크립트 시작..."

# AWS credentials 디렉토리 생성
mkdir -p /root/.aws

# EC2 인스턴스 프로필 사용 설정
cat > /root/.aws/credentials << 'EOF'
[default]
# EC2 인스턴스 프로필 사용
# IAM 역할을 통한 자동 인증
EOF

cat > /root/.aws/config << 'EOF'
[default]
region = ap-northeast-2
output = json
EOF

echo "✅ AWS credentials 파일 생성 완료"

# 권한 설정
chmod 600 /root/.aws/credentials
chmod 600 /root/.aws/config

echo "✅ AWS credentials 권한 설정 완료"

# EC2 메타데이터 서비스 확인
echo "🔍 EC2 메타데이터 서비스 확인..."
if curl -s --connect-timeout 5 http://169.254.169.254/latest/meta-data/instance-id > /dev/null; then
    echo "✅ EC2 메타데이터 서비스 정상"
    INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
    echo "🏷️ 인스턴스 ID: $INSTANCE_ID"
else
    echo "❌ EC2 메타데이터 서비스 접근 불가"
fi

# IAM 역할 확인
echo "🔍 IAM 역할 확인..."
if curl -s --connect-timeout 5 http://169.254.169.254/latest/meta-data/iam/security-credentials/ > /dev/null; then
    ROLE_NAME=$(curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/)
    if [ -n "$ROLE_NAME" ]; then
        echo "✅ IAM 역할 발견: $ROLE_NAME"
        echo "🔑 임시 자격 증명 테스트 중..."
        if curl -s --connect-timeout 5 "http://169.254.169.254/latest/meta-data/iam/security-credentials/$ROLE_NAME" | grep -q "AccessKeyId"; then
            echo "✅ IAM 역할 자격 증명 정상"
        else
            echo "❌ IAM 역할 자격 증명 오류"
        fi
    else
        echo "❌ IAM 역할 없음"
    fi
else
    echo "❌ IAM 메타데이터 접근 불가"
fi

echo "🎉 AWS credentials 설정 완료!"