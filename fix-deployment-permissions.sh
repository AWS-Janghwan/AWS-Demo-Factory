#!/bin/bash

# 배포 환경 권한 문제 해결 스크립트

echo "🔧 배포 환경 권한 문제 해결 시작..."

# 현재 사용자 확인
echo "👤 현재 사용자: $(whoami)"
echo "📁 현재 디렉토리: $(pwd)"

# 1. 로그 디렉토리 및 파일 권한 설정
echo "📝 로그 파일 권한 설정 중..."
mkdir -p logs pids
chmod 755 logs pids

# 로그 파일들 생성 및 권한 설정
touch logs/static.log logs/backend.log logs/bedrock.log logs/pdf.log
chmod 666 logs/*.log

# PID 파일들 권한 설정
touch pids/static.pid pids/backend.pid pids/bedrock.pid pids/pdf.pid
chmod 666 pids/*.pid

echo "✅ 로그 및 PID 파일 권한 설정 완료"

# 2. 스크립트 실행 권한 설정
echo "🔐 스크립트 실행 권한 설정 중..."
chmod +x *.sh
chmod +x scripts/*.sh
chmod +x unified-server-manager.sh

echo "✅ 스크립트 실행 권한 설정 완료"

# 3. Node.js 서버 파일 권한 설정
echo "⚙️ Node.js 서버 파일 권한 설정 중..."
chmod 644 *.js
chmod 644 server/*.js

echo "✅ Node.js 서버 파일 권한 설정 완료"

# 4. Python 가상환경 권한 설정
echo "🐍 Python 환경 권한 설정 중..."
if [ -d "python-pdf-server/venv" ]; then
    chmod -R 755 python-pdf-server/venv
    echo "✅ Python 가상환경 권한 설정 완료"
else
    echo "⚠️  Python 가상환경이 없습니다."
fi

# 5. 빌드 파일 권한 설정
echo "📦 빌드 파일 권한 설정 중..."
if [ -d "build" ]; then
    chmod -R 644 build/
    find build -type d -exec chmod 755 {} \;
    echo "✅ 빌드 파일 권한 설정 완료"
else
    echo "⚠️  빌드 디렉토리가 없습니다."
fi

# 6. 환경 변수 파일 권한 설정
echo "🌍 환경 변수 파일 권한 설정 중..."
chmod 644 .env* 2>/dev/null || true
echo "✅ 환경 변수 파일 권한 설정 완료"

# 7. AWS credentials 권한 설정
echo "🔐 AWS credentials 권한 설정 중..."
if [ -d "/root/.aws" ]; then
    chmod 700 /root/.aws
    chmod 600 /root/.aws/* 2>/dev/null || true
    echo "✅ AWS credentials 권한 설정 완료"
else
    echo "⚠️  AWS credentials 디렉토리가 없습니다."
fi

# 8. 포트 사용 상태 확인
echo "🔍 포트 사용 상태 확인..."
for port in 3000 3001 5001 5002; do
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        echo "⚠️  포트 $port 이미 사용 중"
        # 기존 프로세스 종료
        pkill -f ":$port" 2>/dev/null || true
    else
        echo "✅ 포트 $port 사용 가능"
    fi
done

# 9. 프로세스 정리
echo "🧹 기존 프로세스 정리 중..."
pkill -f "node.*backend-api-server" 2>/dev/null || true
pkill -f "node.*bedrock-api" 2>/dev/null || true
pkill -f "node.*simple-static-server" 2>/dev/null || true
pkill -f "python.*pdf-server" 2>/dev/null || true

sleep 2

echo "✅ 기존 프로세스 정리 완료"

# 10. 최종 상태 확인
echo "🔍 최종 권한 상태 확인..."
echo "📝 로그 디렉토리: $(ls -ld logs 2>/dev/null || echo '없음')"
echo "🔐 스크립트 권한: $(ls -l unified-server-manager.sh 2>/dev/null | cut -d' ' -f1 || echo '없음')"
echo "🌍 환경 파일: $(ls -l .env 2>/dev/null | cut -d' ' -f1 || echo '없음')"

echo "🎯 배포 환경 권한 문제 해결 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. AWS credentials 설정: vi /root/.aws/credentials"
echo "2. 서버 시작: ./unified-server-manager.sh start"
echo "3. 상태 확인: ./unified-server-manager.sh status"