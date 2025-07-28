#!/bin/bash

echo "🔍 AWS Demo Factory 배포 환경 진단 스크립트"
echo "=============================================="
echo "📅 실행 시간: $(date)"
echo ""

cd /data/AWS-Demo-Factory 2>/dev/null || cd .

# 1. 기본 환경 확인
echo "🌍 1. 기본 환경 정보"
echo "-------------------"
echo "현재 디렉토리: $(pwd)"
echo "사용자: $(whoami)"
echo "운영체제: $(uname -a)"
echo ""

# 2. 파일 존재 확인
echo "📁 2. 주요 파일 존재 확인"
echo "----------------------"
files=("unified-server-manager.sh" "backend-api-server.js" "server/bedrock-api.js" "python-pdf-server/app.py" "build/index.html")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (없음)"
    fi
done
echo ""

# 3. 환경 변수 확인
echo "🔧 3. 환경 변수 확인"
echo "------------------"
echo "NODE_ENV: ${NODE_ENV:-'설정되지 않음'}"
echo "REACT_APP_AWS_REGION: ${REACT_APP_AWS_REGION:-'설정되지 않음'}"
echo "REACT_APP_S3_BUCKET: ${REACT_APP_S3_BUCKET:-'설정되지 않음'}"
echo "REACT_APP_DYNAMODB_TABLE: ${REACT_APP_DYNAMODB_TABLE:-'설정되지 않음'}"
echo "REACT_APP_BACKEND_API_URL: ${REACT_APP_BACKEND_API_URL:-'설정되지 않음'}"
echo "AWS_PROFILE: ${AWS_PROFILE:-'설정되지 않음'}"
echo ""

# 4. AWS Credentials 확인
echo "🔐 4. AWS Credentials 확인"
echo "-------------------------"
if [ -f "$HOME/.aws/credentials" ]; then
    echo "✅ AWS credentials 파일 존재: $HOME/.aws/credentials"
    if grep -q "\[default\]" "$HOME/.aws/credentials" 2>/dev/null; then
        echo "✅ default 프로필 존재"
    else
        echo "❌ default 프로필 없음"
    fi
else
    echo "❌ AWS credentials 파일 없음: $HOME/.aws/credentials"
fi
echo ""

# 5. 포트 사용 상태 확인
echo "🌐 5. 포트 사용 상태 확인"
echo "----------------------"
ports=(3000 3001 5001 5002)
for port in "${ports[@]}"; do
    if lsof -i:$port > /dev/null 2>&1; then
        pid=$(lsof -t -i:$port 2>/dev/null | head -1)
        process=$(ps -p $pid -o comm= 2>/dev/null || echo "알 수 없음")
        echo "✅ 포트 $port: 사용 중 (PID: $pid, 프로세스: $process)"
    else
        echo "❌ 포트 $port: 사용되지 않음"
    fi
done
echo ""

# 6. 프로세스 확인
echo "🔄 6. 관련 프로세스 확인"
echo "--------------------"
echo "Node.js 프로세스:"
ps aux | grep node | grep -v grep || echo "Node.js 프로세스 없음"
echo ""
echo "Python 프로세스:"
ps aux | grep python | grep -v grep || echo "Python 프로세스 없음"
echo ""

# 7. 서버 응답 테스트
echo "🧪 7. 서버 응답 테스트"
echo "-------------------"
servers=(
    "React 앱:http://localhost:3000"
    "백엔드 API:http://localhost:3001/health"
    "Bedrock API:http://localhost:5001/api/bedrock/test"
    "PDF 서버:http://localhost:5002/health"
)

for server_info in "${servers[@]}"; do
    name=$(echo $server_info | cut -d: -f1)
    url=$(echo $server_info | cut -d: -f2-)
    
    echo -n "$name: "
    if curl -s --max-time 5 "$url" > /dev/null 2>&1; then
        echo "✅ 응답 정상"
    else
        echo "❌ 응답 없음"
    fi
done
echo ""

# 8. 로그 파일 확인
echo "📄 8. 로그 파일 상태"
echo "-----------------"
log_files=("logs/static.log" "logs/backend.log" "logs/bedrock.log" "logs/pdf.log" "server-start.log")
for log_file in "${log_files[@]}"; do
    if [ -f "$log_file" ]; then
        size=$(du -h "$log_file" | cut -f1)
        echo "✅ $log_file (크기: $size)"
    else
        echo "❌ $log_file (없음)"
    fi
done
echo ""

# 9. 디스크 공간 확인
echo "💾 9. 디스크 공간 확인"
echo "-------------------"
df -h . | head -2
echo ""

# 10. 최근 오류 로그 확인
echo "⚠️ 10. 최근 오류 로그 (최근 10줄)"
echo "------------------------------"
if [ -f "server-start.log" ]; then
    echo "=== server-start.log ==="
    tail -10 server-start.log 2>/dev/null || echo "로그 읽기 실패"
fi

if [ -f "logs/backend.log" ]; then
    echo "=== backend.log ==="
    tail -10 logs/backend.log 2>/dev/null || echo "로그 읽기 실패"
fi
echo ""

echo "🎯 진단 완료!"
echo "============"
echo "📅 완료 시간: $(date)"