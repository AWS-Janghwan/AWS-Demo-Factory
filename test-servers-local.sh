#!/bin/bash

echo "🧪 로컬 환경에서 서버 테스트 중..."

# 권한 문제 해결
echo "🔐 권한 설정 중..."
mkdir -p pids logs
chmod 755 pids logs
touch logs/static.log logs/backend.log logs/bedrock.log logs/pdf.log
chmod 666 logs/*.log
touch pids/static.pid pids/backend.pid pids/bedrock.pid pids/pdf.pid
chmod 666 pids/*.pid

# 통합 서버 관리자 권한 설정
chmod +x unified-server-manager.sh

# 서버 재시작
echo "🔄 서버 재시작 중..."
./unified-server-manager.sh restart

echo "⏳ 서버 초기화 대기 (10초)..."
sleep 10

# 서버 상태 확인
echo "🔍 서버 상태 확인..."
./unified-server-manager.sh status

# 백엔드 API 테스트
echo "📡 백엔드 API 테스트..."
curl -s --max-time 5 http://localhost:3001/health | head -3 || echo "❌ 백엔드 API 응답 없음"

echo "🎉 테스트 완료!"