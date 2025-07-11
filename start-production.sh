#!/bin/bash

# 기존 프로세스 종료
pkill -f "python.*app.py" 2>/dev/null || true
pkill -f "node.*bedrock" 2>/dev/null || true  
pkill -f "node.*backend" 2>/dev/null || true

# Python PDF 서버 시작
cd python-pdf-server
source venv/bin/activate
nohup python app.py > ../pdf-server.log 2>&1 &

# Bedrock API 서버 시작
cd /data/AWS-Demo-Factory
nohup node server/bedrock-api.js > bedrock-server.log 2>&1 &

# 백엔드 API 서버 시작
nohup node backend-api-server.js > backend-api.log 2>&1 &

# 정적 파일 서버 시작 (build 폴더가 있는 경우)
[ -d "build" ] && nohup npx serve -s build -l 3000 > static-server.log 2>&1 &

echo "모든 서버 시작 완료"
