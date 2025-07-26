#!/bin/bash

echo "⚡ uv Python 패키지 매니저 설치 스크립트"
echo "======================================="

# uv가 이미 설치되어 있는지 확인
if command -v uv >/dev/null 2>&1; then
    echo "✅ uv가 이미 설치되어 있습니다."
    uv --version
    exit 0
fi

echo "📦 uv 설치 중..."

# uv 설치 (공식 설치 스크립트)
curl -LsSf https://astral.sh/uv/install.sh | sh

# PATH에 uv 추가
export PATH="$HOME/.cargo/bin:$PATH"

# 설치 확인
if command -v uv >/dev/null 2>&1; then
    echo "✅ uv 설치 완료!"
    echo "📋 버전: $(uv --version)"
    echo "📁 위치: $(which uv)"
    
    # 기본 설정
    echo "🔧 uv 기본 설정 중..."
    
    # 캐시 디렉토리 설정 (선택사항)
    export UV_CACHE_DIR="/tmp/uv-cache"
    
    echo "🎉 uv 설치 및 설정 완료!"
    echo ""
    echo "💡 사용법:"
    echo "  uv venv myenv          # 가상환경 생성"
    echo "  uv pip install flask  # 패키지 설치"
    echo "  uv pip install -r requirements.txt  # requirements 설치"
    echo ""
    echo "⚡ uv는 pip보다 10-100배 빠른 Python 패키지 매니저입니다!"
    
else
    echo "❌ uv 설치 실패"
    echo "💡 수동 설치 방법:"
    echo "  curl -LsSf https://astral.sh/uv/install.sh | sh"
    echo "  export PATH=\"\$HOME/.cargo/bin:\$PATH\""
    exit 1
fi