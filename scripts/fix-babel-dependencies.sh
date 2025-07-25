#!/bin/bash

echo "🔧 EC2 서버 Babel 의존성 문제 해결 중..."
echo "=================================================="

# 현재 디렉토리 확인
echo "📁 현재 디렉토리: $(pwd)"

# Node.js 및 npm 버전 확인
echo "📋 환경 정보:"
echo "  Node.js: $(node --version)"
echo "  npm: $(npm --version)"

echo ""
echo "🔍 1. 누락된 Babel 플러그인 설치 중..."

# 누락된 Babel 플러그인들 설치
npm install --save-dev \
  @babel/plugin-proposal-private-property-in-object \
  @babel/plugin-proposal-class-properties \
  @babel/plugin-proposal-private-methods \
  @babel/plugin-transform-private-property-in-object

echo "✅ Babel 플러그인 설치 완료"

echo ""
echo "🧹 2. npm 캐시 정리 중..."

# npm 캐시 정리
npm cache clean --force

echo "✅ npm 캐시 정리 완료"

echo ""
echo "📦 3. node_modules 재설치 중..."

# node_modules 삭제 및 재설치
rm -rf node_modules package-lock.json
npm install

echo "✅ node_modules 재설치 완료"

echo ""
echo "🔍 4. Babel 설정 확인 중..."

# .babelrc 파일이 있는지 확인
if [ -f ".babelrc" ]; then
    echo "📄 .babelrc 파일 발견:"
    cat .babelrc
elif [ -f "babel.config.js" ]; then
    echo "📄 babel.config.js 파일 발견:"
    head -10 babel.config.js
else
    echo "📄 Babel 설정 파일 없음 - package.json에서 확인"
    grep -A 10 '"babel"' package.json || echo "package.json에 babel 설정 없음"
fi

echo ""
echo "🧪 5. React Scripts 버전 확인..."

# React Scripts 버전 확인
npm list react-scripts

echo ""
echo "✅ Babel 의존성 문제 해결 완료!"
echo "🚀 이제 'npm start' 또는 'npm run build'를 실행해보세요."
