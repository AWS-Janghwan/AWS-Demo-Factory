#!/bin/bash

# EC2 디렉토리 문제 빠른 해결
echo "🚀 EC2 디렉토리 문제 빠른 해결..."

# 안전한 위치로 이동 후 재설정
cd / && cd /data/AWS-Demo-Factory && export PWD=/data/AWS-Demo-Factory && \
pkill -f "python\|node" 2>/dev/null || true && \
sleep 2 && \
echo "✅ 환경 재설정 완료. 이제 서비스를 시작합니다..." && \
./scripts/start-production-safe.sh
