#!/bin/bash

# EC2 서버 Babel 문제 빠른 해결 (원라이너)
echo "🚀 EC2 Babel 문제 빠른 해결 중..."

# 기존 프로세스 중지 및 정리
pkill -f "npm.*start" 2>/dev/null || true && \
rm -rf node_modules package-lock.json && \
npm install --save-dev @babel/plugin-proposal-private-property-in-object @babel/plugin-proposal-class-properties @babel/plugin-proposal-private-methods @babel/plugin-transform-private-property-in-object && \
npm cache clean --force && \
npm install && \
echo "✅ Babel 문제 해결 완료! 이제 'npm start'를 실행하세요."
