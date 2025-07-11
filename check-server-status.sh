#!/bin/bash

echo "🔍 AWS Demo Factory 서버 상태 확인..."
echo ""

# 실행 중인 프로세스 확인
echo "📊 실행 중인 프로세스:"
ps aux | grep -E "(python.*app.py|node.*bedrock|node.*backend|serve.*build)" | grep -v grep | while read line; do
    echo "  ✅ $line"
done

echo ""

# 포트 사용 상태 확인
echo "🔌 포트 사용 상태:"
for port in 3000 3001 5001 5002; do
    if lsof -i :$port > /dev/null 2>&1; then
        process=$(lsof -i :$port | tail -1 | awk '{print $1, $2}')
        echo "  ✅ 포트 $port: $process"
    else
        echo "  ❌ 포트 $port: 사용 안함"
    fi
done

echo ""

# 서버 응답 테스트
echo "🌐 서버 응답 테스트:"

# Python PDF 서버
if curl -s http://localhost:5002/health > /dev/null 2>&1; then
    echo "  ✅ Python PDF 서버 (5002): 정상"
else
    echo "  ❌ Python PDF 서버 (5002): 응답 없음"
fi

# Bedrock API 서버
if curl -s http://localhost:5001/api/bedrock/test > /dev/null 2>&1; then
    echo "  ✅ Bedrock API 서버 (5001): 정상"
else
    echo "  ❌ Bedrock API 서버 (5001): 응답 없음"
fi

# 백엔드 API 서버
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "  ✅ 백엔드 API 서버 (3001): 정상"
else
    echo "  ❌ 백엔드 API 서버 (3001): 응답 없음"
fi

# 정적 파일 서버
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "  ✅ 웹 애플리케이션 (3000): 정상"
else
    echo "  ❌ 웹 애플리케이션 (3000): 응답 없음"
fi

echo ""

# 로그 파일 확인
echo "📋 최근 로그 (마지막 3줄):"
for log in pdf-server.log bedrock-server.log backend-api.log static-server.log; do
    if [ -f "$log" ]; then
        echo "  📄 $log:"
        tail -3 "$log" | sed 's/^/    /'
        echo ""
    fi
done

echo "🎯 상태 확인 완료!"
