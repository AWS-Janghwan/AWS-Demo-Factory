#!/bin/bash

echo "🚀 [$(date)] 서비스 시작 - ApplicationStart 단계"

# 애플리케이션 디렉토리로 이동
cd /data/AWS-Demo-Factory

echo "🎯 [$(date)] 프로덕션 서버 시작 중... (예상 시간: 30초)"
# 프로덕션 서버 시작
./start-production.sh

echo "⏱️ [$(date)] 서버 안정화 대기 중..."
sleep 10

echo "🔍 [$(date)] 서버 상태 확인 중..."
./check-server-status.sh

echo "🎉 [$(date)] ApplicationStart 단계 완료!" 
