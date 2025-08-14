#!/bin/bash

echo "🔍 배포 환경 서버 상태 진단 시작..."
echo "⏰ 현재 시간: $(date)"
echo "📁 현재 디렉토리: $(pwd)"
echo ""

# 1. 프로세스 상태 확인
echo "=== 1. 프로세스 상태 확인 ==="
echo "🔍 Node.js 프로세스:"
ps aux | grep node | grep -v grep || echo "   Node.js 프로세스 없음"
echo ""
echo "🔍 Python 프로세스:"
ps aux | grep python | grep -v grep || echo "   Python 프로세스 없음"
echo ""

# 2. 포트 사용 상태 확인
echo "=== 2. 포트 사용 상태 확인 ==="
for port in 3000 3001 5001 5002; do
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        echo "✅ 포트 $port: 사용 중"
    else
        echo "❌ 포트 $port: 사용 안함"
    fi
done
echo ""

# 3. 서버 응답 테스트
echo "=== 3. 서버 응답 테스트 ==="
for port in 3000 3001 5001 5002; do
    echo "🔍 포트 $port 테스트:"
    if curl -s --connect-timeout 5 http://localhost:$port >/dev/null 2>&1; then
        echo "   ✅ 응답 정상"
    else
        echo "   ❌ 응답 없음"
    fi
done
echo ""

# 4. 로그 파일 확인
echo "=== 4. 로그 파일 확인 ==="
if [ -d "logs" ]; then
    echo "📝 로그 파일 목록:"
    ls -la logs/ 2>/dev/null || echo "   로그 파일 없음"
    echo ""
    
    for log in logs/*.log; do
        if [ -f "$log" ]; then
            echo "📄 $(basename $log) (마지막 5줄):"
            tail -5 "$log" 2>/dev/null || echo "   로그 읽기 실패"
            echo ""
        fi
    done
else
    echo "❌ logs 디렉토리 없음"
fi

# 5. AWS credentials 확인
echo "=== 5. AWS Credentials 확인 ==="
if [ -f "/data/.aws/credentials" ]; then
    echo "✅ /data/.aws/credentials 파일 존재"
    if grep -q "aws_access_key_id" /data/.aws/credentials && ! grep -q "YOUR_ACCESS_KEY_ID" /data/.aws/credentials; then
        echo "✅ AWS credentials 설정 완료"
    else
        echo "❌ AWS credentials 설정 필요"
        echo "   파일 내용 확인 필요: /data/.aws/credentials"
    fi
else
    echo "❌ /data/.aws/credentials 파일 없음"
fi
echo ""

# 6. 환경 변수 확인
echo "=== 6. 환경 변수 확인 ==="
if [ -f ".env" ]; then
    echo "✅ .env 파일 존재"
    echo "📋 주요 환경 변수:"
    grep -E "^(NODE_ENV|REACT_APP_|AWS_)" .env 2>/dev/null || echo "   환경 변수 없음"
else
    echo "❌ .env 파일 없음"
fi
echo ""

# 7. 통합 서버 관리자 상태
echo "=== 7. 통합 서버 관리자 상태 ==="
if [ -f "unified-server-manager.sh" ]; then
    echo "✅ unified-server-manager.sh 존재"
    if [ -x "unified-server-manager.sh" ]; then
        echo "✅ 실행 권한 있음"
        echo "🔍 서버 상태 확인:"
        ./unified-server-manager.sh status 2>/dev/null || echo "   상태 확인 실패"
    else
        echo "❌ 실행 권한 없음"
    fi
else
    echo "❌ unified-server-manager.sh 없음"
fi
echo ""

# 8. 빌드 파일 확인
echo "=== 8. 빌드 파일 확인 ==="
if [ -d "build" ]; then
    echo "✅ build 디렉토리 존재"
    if [ -f "build/index.html" ]; then
        echo "✅ build/index.html 존재"
    else
        echo "❌ build/index.html 없음"
    fi
else
    echo "❌ build 디렉토리 없음"
fi
echo ""

echo "🎯 진단 완료!"
echo ""
echo "📋 권장 조치사항:"
echo "1. AWS credentials 설정: vi /data/.aws/credentials"
echo "2. 서버 시작: ./unified-server-manager.sh start"
echo "3. 상태 재확인: ./unified-server-manager.sh status"
echo "4. 로그 확인: tail -f logs/backend.log"