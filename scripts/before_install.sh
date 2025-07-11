#!/bin/bash

echo "🛑 [$(date)] 배포 준비 - BeforeInstall 단계 시작"

echo "🔄 [$(date)] 1/4 기존 서비스 중지 중..."
#서비스 중지
sudo /usr/local/bin/pm2 kill 2>/dev/null || true

# 기존 프로세스 강제 종료
pkill -f "python.*app.py" 2>/dev/null || true
pkill -f "node.*bedrock-api.js" 2>/dev/null || true  
pkill -f "node.*backend-api-server.js" 2>/dev/null || true
pkill -f "serve.*build" 2>/dev/null || true
echo "✅ [$(date)] 기존 서비스 중지 완료"

echo "📁 [$(date)] 2/4 기존 파일 정리 중..."
# 기존 파일 백업 및 정리
if [ -d "/data/AWS-Demo-Factory" ]; then
    echo "  📋 기존 디렉토리 발견, 백업 생성 중..."
    BACKUP_DIR="/data/bak/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # 중요 파일들만 백업
    if [ -f "/data/AWS-Demo-Factory/.env" ]; then
        cp "/data/AWS-Demo-Factory/.env" "$BACKUP_DIR/.env.backup" 2>/dev/null || true
    fi
    
    # 로그 파일 백업
    cp /data/AWS-Demo-Factory/*.log "$BACKUP_DIR/" 2>/dev/null || true
    
    echo "  🗑️ 기존 디렉토리 삭제 중..."
    rm -rf /data/AWS-Demo-Factory/*
    rm -rf /data/AWS-Demo-Factory/.[^.]*
    
    echo "  ✅ 기존 파일 정리 완료 (백업: $BACKUP_DIR)"
else
    echo "  📂 새로운 설치 - 기존 파일 없음"
fi

# 애플리케이션 디렉토리 생성
mkdir -p /data/AWS-Demo-Factory
echo "✅ [$(date)] 디렉토리 준비 완료"

echo "🔐 [$(date)] 3/4 권한 설정 중..."
# 권한 설정
chown -R root:root /data/AWS-Demo-Factory
chmod -R 755 /data/AWS-Demo-Factory
echo "✅ [$(date)] 권한 설정 완료"

echo "🧹 [$(date)] 4/4 환경 정리 중..."
# 임시 파일 정리
rm -rf /tmp/codedeploy-* 2>/dev/null || true
rm -rf /opt/codedeploy-agent/deployment-root/*/deployment-archive 2>/dev/null || true
echo "✅ [$(date)] 환경 정리 완료"

echo "🎯 [$(date)] BeforeInstall 단계 완료!"

