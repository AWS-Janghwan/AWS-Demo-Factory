#!/bin/bash

echo "🛑 BeforeInstall 시작"

# 서비스 중지
sudo /usr/local/bin/pm2 kill >/dev/null 2>&1 || true
pkill -f "python.*app.py" >/dev/null 2>&1 || true
pkill -f "node.*bedrock-api.js" >/dev/null 2>&1 || true  
pkill -f "node.*backend-api-server.js" >/dev/null 2>&1 || true
pkill -f "serve.*build" >/dev/null 2>&1 || true

echo "✅ 서비스 중지 완료"

# 빠른 디렉토리 처리
if [ -d "/data/AWS-Demo-Factory" ]; then
    echo "📁 기존 디렉토리 처리 중..."
    
    # 중요 파일 백업
    BACKUP_DIR="/data/bak/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    cp "/data/AWS-Demo-Factory/.env" "$BACKUP_DIR/.env.backup" 2>/dev/null || true
    
    # 디렉토리 이름 변경 (가장 빠른 방법)
    mv /data/AWS-Demo-Factory /data/AWS-Demo-Factory.old.$(date +%s) || {
        # 이름 변경 실패 시 최소한의 정리
        rm -rf /data/AWS-Demo-Factory/node_modules || true
        rm -rf /data/AWS-Demo-Factory/build || true
    }
    
    echo "✅ 디렉토리 처리 완료"
fi

# 새 디렉토리 생성
mkdir -p /data/AWS-Demo-Factory
chown -R root:root /data/AWS-Demo-Factory
chmod -R 755 /data/AWS-Demo-Factory

echo "🎯 BeforeInstall 완료"
