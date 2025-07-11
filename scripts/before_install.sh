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

echo "📁 [$(date)] 2/4 효율적인 파일 정리 중..."
if [ -d "/data/AWS-Demo-Factory" ]; then
    echo "  📋 기존 디렉토리 발견, 중요 파일 백업 중..."
    BACKUP_DIR="/data/bak/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # 중요 파일들만 빠르게 백업
    [ -f "/data/AWS-Demo-Factory/.env" ] && cp "/data/AWS-Demo-Factory/.env" "$BACKUP_DIR/.env.backup" 2>/dev/null || true
    [ -f "/data/AWS-Demo-Factory/.env.production" ] && cp "/data/AWS-Demo-Factory/.env.production" "$BACKUP_DIR/.env.production.backup" 2>/dev/null || true
    
    # 로그 파일 백업 (빠른 복사)
    find /data/AWS-Demo-Factory -maxdepth 1 -name "*.log" -exec cp {} "$BACKUP_DIR/" \; 2>/dev/null || true
    
    echo "  🚀 디렉토리 이름 변경으로 빠른 정리..."
    # 전체 삭제 대신 디렉토리 이름 변경 (훨씬 빠름)
    mv /data/AWS-Demo-Factory /data/AWS-Demo-Factory.old.$(date +%s) 2>/dev/null || {
        echo "  🗑️ 이름 변경 실패, 선택적 삭제 진행..."
        # 큰 디렉토리들만 선택적으로 삭제
        rm -rf /data/AWS-Demo-Factory/node_modules 2>/dev/null &
        rm -rf /data/AWS-Demo-Factory/build 2>/dev/null &
        rm -rf /data/AWS-Demo-Factory/python-pdf-server/venv 2>/dev/null &
        wait
        echo "  ✅ 주요 디렉토리 삭제 완료"
    }
    
    echo "  ✅ 파일 정리 완료 (백업: $BACKUP_DIR)"
else
    echo "  📂 새로운 설치 - 기존 파일 없음"
fi

# 새 디렉토리 생성
mkdir -p /data/AWS-Demo-Factory
echo "✅ [$(date)] 디렉토리 준비 완료"

echo "🔐 [$(date)] 3/4 권한 설정 중..."
# 권한 설정
chown -R root:root /data/AWS-Demo-Factory
chmod -R 755 /data/AWS-Demo-Factory
echo "✅ [$(date)] 권한 설정 완료"

echo "🧹 [$(date)] 4/4 환경 정리 중..."
# 임시 파일 정리 (백그라운드에서 실행)
rm -rf /tmp/codedeploy-* 2>/dev/null &
rm -rf /opt/codedeploy-agent/deployment-root/*/deployment-archive 2>/dev/null &

# 오래된 백업 디렉토리 정리 (7일 이상)
find /data -name "AWS-Demo-Factory.old.*" -mtime +7 -exec rm -rf {} \; 2>/dev/null &

echo "✅ [$(date)] 환경 정리 완료"

echo "🎯 [$(date)] BeforeInstall 단계 완료!"

