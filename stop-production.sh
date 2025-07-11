#!/bin/bash

echo "🛑 AWS Demo Factory 프로덕션 서버 중지..."

# PID 파일에서 프로세스 종료
if [ -f python-pdf-server.pid ]; then
    PDF_PID=$(cat python-pdf-server.pid)
    if kill -0 $PDF_PID 2>/dev/null; then
        kill $PDF_PID
        echo "✅ Python PDF 서버 중지됨 (PID: $PDF_PID)"
    fi
    rm -f python-pdf-server.pid
fi

if [ -f bedrock-server.pid ]; then
    BEDROCK_PID=$(cat bedrock-server.pid)
    if kill -0 $BEDROCK_PID 2>/dev/null; then
        kill $BEDROCK_PID
        echo "✅ Bedrock API 서버 중지됨 (PID: $BEDROCK_PID)"
    fi
    rm -f bedrock-server.pid
fi

if [ -f backend-server.pid ]; then
    BACKEND_PID=$(cat backend-server.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        echo "✅ 백엔드 API 서버 중지됨 (PID: $BACKEND_PID)"
    fi
    rm -f backend-server.pid
fi

if [ -f static-server.pid ]; then
    STATIC_PID=$(cat static-server.pid)
    if kill -0 $STATIC_PID 2>/dev/null; then
        kill $STATIC_PID
        echo "✅ 정적 파일 서버 중지됨 (PID: $STATIC_PID)"
    fi
    rm -f static-server.pid
fi

# 강제 종료 (혹시 남아있는 프로세스들)
pkill -f "python.*app.py" 2>/dev/null || true
pkill -f "node.*bedrock-api.js" 2>/dev/null || true  
pkill -f "node.*backend-api-server.js" 2>/dev/null || true
pkill -f "serve.*build" 2>/dev/null || true

echo "🎯 모든 서버가 중지되었습니다!"
