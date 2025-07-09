#!/bin/bash

# AWS Demo Factory - Bedrock API 서버 중지 스크립트

echo "🛑 Bedrock API 서버 중지 중..."

# PID 파일에서 서버 PID 읽기
if [ -f "bedrock-server.pid" ]; then
    BEDROCK_PID=$(cat bedrock-server.pid)
    echo "📝 서버 PID: $BEDROCK_PID"
    
    # 프로세스 종료
    kill $BEDROCK_PID 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Bedrock API 서버가 중지되었습니다."
    else
        echo "⚠️ 서버가 이미 중지되었거나 PID를 찾을 수 없습니다."
    fi
    
    # PID 파일 삭제
    rm bedrock-server.pid
else
    echo "⚠️ PID 파일을 찾을 수 없습니다."
    echo "수동으로 프로세스를 찾아 종료합니다..."
    
    # 포트 5001을 사용하는 프로세스 찾기
    PID=$(lsof -ti:5001)
    if [ ! -z "$PID" ]; then
        echo "📝 포트 5001 사용 중인 PID: $PID"
        kill $PID
        echo "✅ 프로세스가 종료되었습니다."
    else
        echo "ℹ️ 포트 5001을 사용하는 프로세스가 없습니다."
    fi
fi
