#!/bin/bash

# 서비스 중지만 (백업 제거)
pkill -f "python.*app.py" >/dev/null 2>&1 || true
pkill -f "node.*bedrock" >/dev/null 2>&1 || true  
pkill -f "node.*backend" >/dev/null 2>&1 || true
sudo /usr/local/bin/pm2 kill >/dev/null 2>&1 || true

# 디렉토리 존재하면 이름만 변경 (삭제 안함)
[ -d "/data/AWS-Demo-Factory" ] && mv /data/AWS-Demo-Factory /data/AWS-Demo-Factory.$(date +%s) 2>/dev/null || true

# 새 디렉토리 생성
mkdir -p /data/AWS-Demo-Factory

echo "BeforeInstall 완료"

