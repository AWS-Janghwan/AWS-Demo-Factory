#!/bin/bash

# 배포 환경 AWS Credentials 설정 스크립트

echo "🔧 배포 환경 AWS Credentials 설정 시작..."

# AWS credentials 디렉토리 생성 (배포 환경: /data/.aws)
mkdir -p /data/.aws

# 기존 credentials 파일이 있는지 확인
if [ -f /data/.aws/credentials ]; then
    echo "✅ 기존 AWS credentials 파일 발견: /data/.aws/credentials"
    echo "📋 현재 설정된 프로필:"
    grep '^\[' /data/.aws/credentials || echo "   (프로필 없음)"
else
    echo "❌ AWS credentials 파일이 없습니다: /data/.aws/credentials"
    echo "📝 기본 credentials 파일을 생성해야 합니다."
    
    # 기본 credentials 파일 생성 (사용자가 수동으로 설정해야 함)
    cat > /data/.aws/credentials << 'EOF'
[default]
# AWS Access Key ID와 Secret Access Key를 여기에 설정하세요
# aws_access_key_id = YOUR_ACCESS_KEY_ID
# aws_secret_access_key = YOUR_SECRET_ACCESS_KEY
EOF
    
    echo "⚠️  /data/.aws/credentials 파일에 실제 AWS 자격 증명을 설정해주세요!"
fi

# AWS config 파일 설정
if [ ! -f /data/.aws/config ]; then
    echo "📝 AWS config 파일 생성 중..."
    cat > /data/.aws/config << 'EOF'
[default]
region = ap-northeast-2
output = json
EOF
    echo "✅ AWS config 파일 생성 완료"
else
    echo "✅ 기존 AWS config 파일 발견"
fi

# 권한 설정
chmod 600 /data/.aws/credentials 2>/dev/null || true
chmod 600 /data/.aws/config 2>/dev/null || true

echo "🔍 AWS credentials 테스트..."

# AWS CLI가 설치되어 있으면 테스트
if command -v aws >/dev/null 2>&1; then
    echo "📡 AWS 연결 테스트 중..."
    if aws sts get-caller-identity >/dev/null 2>&1; then
        echo "✅ AWS credentials 정상 작동"
        aws sts get-caller-identity
    else
        echo "❌ AWS credentials 설정 오류"
        echo "   ~/.aws/credentials 파일에 올바른 자격 증명을 설정해주세요"
    fi
else
    echo "⚠️  AWS CLI가 설치되지 않음 - 수동 확인 필요"
fi

echo "🎯 배포 환경 AWS Credentials 설정 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. ~/.aws/credentials 파일에 실제 AWS 자격 증명 설정"
echo "2. 서버 재시작: ./unified-server-manager.sh restart"
echo "3. 백엔드 API 테스트: curl http://localhost:3001/api/content/list"