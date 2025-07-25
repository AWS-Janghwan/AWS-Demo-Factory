#!/bin/bash

echo "🔧 EC2 서버 Babel 의존성 문제 종합 해결 스크립트"
echo "=================================================="

# 현재 디렉토리 확인
echo "📁 현재 디렉토리: $(pwd)"
echo "📋 Node.js 버전: $(node --version)"
echo "📋 npm 버전: $(npm --version)"

echo ""
echo "🛑 1. 기존 프로세스 중지..."

# 기존 프로세스 중지
pkill -f "npm.*start" || true
pkill -f "node.*react-scripts" || true
sleep 2

echo "✅ 기존 프로세스 중지 완료"

echo ""
echo "🧹 2. 기존 설치 파일 정리..."

# 기존 node_modules 및 lock 파일 삭제
rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock

echo "✅ 기존 설치 파일 정리 완료"

echo ""
echo "📦 3. package.json 백업 및 업데이트..."

# 기존 package.json 백업
cp package.json package.json.backup

# 수정된 package.json 적용 (만약 package-fixed.json이 있다면)
if [ -f "package-fixed.json" ]; then
    cp package-fixed.json package.json
    echo "✅ 수정된 package.json 적용"
else
    echo "⚠️ package-fixed.json 없음, 수동으로 devDependencies 추가 필요"
fi

echo ""
echo "🔧 4. 누락된 Babel 플러그인 설치..."

# 누락된 Babel 플러그인들 개별 설치
npm install --save-dev @babel/plugin-proposal-private-property-in-object@^7.21.11
npm install --save-dev @babel/plugin-proposal-class-properties@^7.18.6
npm install --save-dev @babel/plugin-proposal-private-methods@^7.18.6
npm install --save-dev @babel/plugin-transform-private-property-in-object@^7.24.7

echo "✅ Babel 플러그인 설치 완료"

echo ""
echo "📋 5. .babelrc 설정 파일 생성..."

# .babelrc 파일 생성
cat > .babelrc << 'EOF'
{
  "presets": ["react-app"],
  "plugins": [
    ["@babel/plugin-proposal-private-property-in-object", { "loose": true }],
    ["@babel/plugin-proposal-class-properties", { "loose": true }],
    ["@babel/plugin-proposal-private-methods", { "loose": true }]
  ]
}
EOF

echo "✅ .babelrc 설정 파일 생성 완료"

echo ""
echo "🧹 6. npm 캐시 정리..."

# npm 캐시 정리
npm cache clean --force

echo "✅ npm 캐시 정리 완료"

echo ""
echo "📦 7. 의존성 재설치..."

# 의존성 재설치
npm install

echo "✅ 의존성 재설치 완료"

echo ""
echo "🧪 8. 설치 확인..."

# 설치된 Babel 플러그인 확인
echo "📋 설치된 Babel 플러그인:"
npm list | grep "@babel/plugin" || echo "  Babel 플러그인 목록을 가져올 수 없음"

echo ""
echo "🔍 9. React Scripts 버전 확인..."

# React Scripts 버전 확인
npm list react-scripts

echo ""
echo "✅ EC2 서버 Babel 문제 해결 완료!"
echo ""
echo "🚀 다음 단계:"
echo "  1. npm start 실행"
echo "  2. 또는 npm run build 실행"
echo ""
echo "💡 문제가 지속되면:"
echo "  1. Node.js 버전 확인 (권장: 18.x 이상)"
echo "  2. npm 버전 업데이트: npm install -g npm@latest"
echo "  3. 전체 재설치: rm -rf node_modules package-lock.json && npm install"
