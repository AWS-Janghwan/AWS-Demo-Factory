#!/bin/bash

echo "🔄 [$(date)] 배포 롤백 시작..."

# 최신 백업 디렉토리 찾기
LATEST_BACKUP=$(ls -t /data/bak/ | head -1)

if [ -n "$LATEST_BACKUP" ] && [ -d "/data/bak/$LATEST_BACKUP" ]; then
    echo "📋 [$(date)] 백업 발견: $LATEST_BACKUP"
    
    # 현재 실행 중인 프로세스 중지
    echo "🛑 [$(date)] 현재 서비스 중지 중..."
    pkill -f "python.*app.py" 2>/dev/null || true
    pkill -f "node.*bedrock-api.js" 2>/dev/null || true  
    pkill -f "node.*backend-api-server.js" 2>/dev/null || true
    pkill -f "serve.*build" 2>/dev/null || true
    
    # 환경 변수 복원
    if [ -f "/data/bak/$LATEST_BACKUP/.env.backup" ]; then
        echo "⚙️ [$(date)] 환경 변수 복원 중..."
        cp "/data/bak/$LATEST_BACKUP/.env.backup" "/data/AWS-Demo-Factory/.env"
        echo "✅ [$(date)] 환경 변수 복원 완료"
    fi
    
    # 로그 파일 복원
    if ls /data/bak/$LATEST_BACKUP/*.log 1> /dev/null 2>&1; then
        echo "📋 [$(date)] 로그 파일 복원 중..."
        cp /data/bak/$LATEST_BACKUP/*.log /data/AWS-Demo-Factory/ 2>/dev/null || true
        echo "✅ [$(date)] 로그 파일 복원 완료"
    fi
    
    # 서비스 재시작
    echo "🚀 [$(date)] 서비스 재시작 중..."
    cd /data/AWS-Demo-Factory
    ./start-production.sh
    
    echo "✅ [$(date)] 롤백 완료!"
else
    echo "❌ [$(date)] 백업을 찾을 수 없습니다."
    exit 1
fi
