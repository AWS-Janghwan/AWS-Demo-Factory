#!/bin/bash

echo "🛑 [$(date)] 배포 준비 - BeforeInstall 단계 시작"

echo "🔄 [$(date)] 1/3 기존 서비스 중지 중..."
#서비스 중지
sudo /usr/local/bin/pm2 kill 2>/dev/null || true

# 기존 프로세스 강제 종료
pkill -f "python.*app.py" 2>/dev/null || true
pkill -f "node.*bedrock-api.js" 2>/dev/null || true  
pkill -f "node.*backend-api-server.js" 2>/dev/null || true
pkill -f "serve.*build" 2>/dev/null || true
echo "✅ [$(date)] 기존 서비스 중지 완료"

echo "📁 [$(date)] 2/3 디렉토리 준비 중..."
# 기존 파일 정리 (백업)
#TODAY=$(date "+%Y%m%d%H%M")
#mv /data/AWS-Demo-Factory /data/bak/${TODAY}/
# sudo mv -f /data/AWS-Demo-Factory/

# 애플리케이션 디렉토리 생성
if [ ! -d /data/AWS-Demo-Factory ]; then
    mkdir -p /data/AWS-Demo-Factory
fi

# 필요한 디렉토리 생성
# mkdir -p /data/AWS-Demo-Factory/logs
echo "✅ [$(date)] 디렉토리 준비 완료"

echo "🔐 [$(date)] 3/3 권한 설정 중..."
# 권한 설정
#sudo chown -R root:ec2-user /data/AWS-Demo-Factory
#sudo chmod -R 755 /data/AWS-Demo-Factory

# # pm2 설치
# npm install pm2 -g

# # pm2 종료
# sudo /usr/local/bin/pm2 kill

# # 기존 서버 stop(kill)
# lsof -i | grep node |kill -9 `awk '{print $2}'`
echo "✅ [$(date)] 권한 설정 완료"

echo "🎯 [$(date)] BeforeInstall 단계 완료!"

