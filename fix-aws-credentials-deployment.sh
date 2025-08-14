#!/bin/bash

# 배포 환경 AWS credentials 문제 해결 스크립트

echo "🔧 배포 환경 AWS credentials 문제 해결 중..."

# AWS credentials 디렉토리 생성
mkdir -p /root/.aws

# EC2 메타데이터 및 IAM 역할 확인
echo "🔍 EC2 IAM 역할 확인..."
ROLE_NAME=""
if curl -s --connect-timeout 5 http://169.254.169.254/latest/meta-data/iam/security-credentials/ > /dev/null; then
    ROLE_NAME=$(curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/)
    if [ -n "$ROLE_NAME" ]; then
        echo "✅ IAM 역할 발견: $ROLE_NAME"
        
        # IAM 역할이 있으면 빈 credentials 파일 생성 (인스턴스 프로필 사용)
        cat > /root/.aws/credentials << 'CRED_EOF'
[default]
# EC2 인스턴스 프로필 사용 - IAM 역할을 통한 자동 인증
# 실제 credentials는 EC2 메타데이터 서비스에서 자동 제공
CRED_EOF
        
        echo "✅ EC2 인스턴스 프로필 설정 완료"
    else
        echo "❌ IAM 역할 없음 - EC2 인스턴스에 IAM 역할 연결 필요"
        echo "⚠️  백엔드 서버가 AWS 서비스에 접근할 수 없을 수 있습니다."
        
        # IAM 역할이 없으면 환경 변수 사용 안내
        cat > /root/.aws/credentials << 'CRED_EOF'
[default]
# IAM 역할이 없습니다. 환경 변수나 다른 방법으로 AWS 자격 증명을 제공해야 합니다.
# AWS_ACCESS_KEY_ID와 AWS_SECRET_ACCESS_KEY 환경 변수를 설정하거나
# EC2 인스턴스에 적절한 IAM 역할을 연결하세요.
CRED_EOF
    fi
else
    echo "❌ EC2 메타데이터 서비스 접근 불가"
    echo "⚠️  로컬 환경이거나 EC2가 아닌 환경일 수 있습니다."
    
    # 메타데이터 서비스 접근 불가 시 기본 설정
    cat > /root/.aws/credentials << 'CRED_EOF'
[default]
# EC2 메타데이터 서비스에 접근할 수 없습니다.
# 환경 변수나 다른 방법으로 AWS 자격 증명을 제공해야 합니다.
CRED_EOF
fi

# AWS config 파일 생성
cat > /root/.aws/config << 'CONFIG_EOF'
[default]
region = ap-northeast-2
output = json
CONFIG_EOF

# 권한 설정
chmod 600 /root/.aws/credentials
chmod 600 /root/.aws/config

echo "✅ AWS credentials 설정 완료"

# 백엔드 서버들 재시작
echo "🔄 백엔드 서버들 재시작 중..."

# 기존 서버 프로세스 종료
pkill -f "backend-api-server.js" 2>/dev/null || true
pkill -f "bedrock-api.js" 2>/dev/null || true

# 잠시 대기
sleep 2

# 통합 서버 관리자로 서버 시작
if [ -f "./unified-server-manager.sh" ]; then
    chmod +x ./unified-server-manager.sh
    ./unified-server-manager.sh start
else
    echo "⚠️  통합 서버 관리자를 찾을 수 없습니다. 개별 서버 시작..."
    
    # 백엔드 API 서버 시작
    nohup node backend-api-server.js > logs/backend.log 2>&1 &
    echo $! > pids/backend.pid
    
    # Bedrock API 서버 시작
    nohup node server/bedrock-api.js > logs/bedrock.log 2>&1 &
    echo $! > pids/bedrock.pid
    
    echo "✅ 개별 서버 시작 완료"
fi

echo "🎉 AWS credentials 문제 해결 완료!"