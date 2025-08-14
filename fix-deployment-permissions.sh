#!/bin/bash

echo "🔧 배포 환경 권한 문제 해결 중..."

cd /data/AWS-Demo-Factory

# 1. 디렉토리 생성 및 권한 설정
echo "📁 디렉토리 생성 및 권한 설정..."
mkdir -p pids logs
chown -R ec2-user:ec2-user pids logs 2>/dev/null || true
chmod 755 pids logs

# 2. 기존 PID 파일 정리
echo "🧹 기존 PID 파일 정리..."
rm -f pids/*.pid 2>/dev/null || true

# 3. 로그 파일 생성 및 권한
echo "📄 로그 파일 생성 및 권한 설정..."
touch logs/static.log logs/backend.log logs/bedrock.log logs/pdf.log
chmod 666 logs/*.log
chown ec2-user:ec2-user logs/*.log 2>/dev/null || true

# 4. 스크립트 실행 권한
echo "🔐 스크립트 실행 권한 설정..."
chmod +x *.sh scripts/*.sh 2>/dev/null || true

# 5. 모든 서버 프로세스 강제 종료
echo "🛑 기존 서버 프로세스 강제 종료..."
pkill -f "simple-static-server.js" 2>/dev/null || true
pkill -f "backend-api-server.js" 2>/dev/null || true
pkill -f "bedrock-api.js" 2>/dev/null || true
pkill -f "python.*app.py" 2>/dev/null || true

# 잠시 대기
sleep 3

# 6. 포트 사용 확인 및 정리
echo "🔍 포트 사용 상태 확인..."
for port in 3000 3001 5001 5002; do
    if lsof -ti:$port > /dev/null 2>&1; then
        echo "⚠️  포트 $port 사용 중 - 프로세스 종료 시도"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
    fi
done

echo "✅ 권한 및 프로세스 정리 완료"

# 7. 서버 개별 시작 (권한 문제 우회)
echo "🚀 서버 개별 시작..."

# 정적 서버 시작
echo "📱 정적 서버 시작 (3000 포트)..."
nohup node simple-static-server.js > logs/static.log 2>&1 &
STATIC_PID=$!
echo $STATIC_PID > pids/static.pid
echo "✅ 정적 서버 PID: $STATIC_PID"

# 백엔드 API 서버 시작
echo "🔌 백엔드 API 서버 시작 (3001 포트)..."
nohup node backend-api-server.js > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > pids/backend.pid
echo "✅ 백엔드 서버 PID: $BACKEND_PID"

# Bedrock API 서버 시작
echo "🤖 Bedrock API 서버 시작 (5001 포트)..."
nohup node server/bedrock-api.js > logs/bedrock.log 2>&1 &
BEDROCK_PID=$!
echo $BEDROCK_PID > pids/bedrock.pid
echo "✅ Bedrock 서버 PID: $BEDROCK_PID"

# Python PDF 서버 시작
echo "📄 Python PDF 서버 시작 (5002 포트)..."
cd python-pdf-server
source venv/bin/activate 2>/dev/null || true
nohup python app.py > ../logs/pdf.log 2>&1 &
PDF_PID=$!
echo $PDF_PID > ../pids/pdf.pid
cd ..
echo "✅ PDF 서버 PID: $PDF_PID"

# 8. 서버 시작 대기 및 상태 확인
echo "⏳ 서버 초기화 대기 (15초)..."
sleep 15

echo "🔍 서버 상태 확인..."
for port in 3000 3001 5001 5002; do
    if lsof -i:$port > /dev/null 2>&1; then
        echo "✅ 포트 $port: 실행 중"
    else
        echo "❌ 포트 $port: 중지됨"
    fi
done

echo "🎉 배포 환경 권한 문제 해결 완료!"