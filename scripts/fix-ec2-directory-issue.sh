#!/bin/bash

echo "🔧 EC2 디렉토리 접근 문제 해결 스크립트"
echo "=================================================="

echo "🔍 1. 현재 상황 진단..."

# 현재 위치 확인
echo "📁 현재 작업 디렉토리 상태:"
pwd 2>/dev/null || echo "❌ pwd 명령어 실패"

# 디렉토리 존재 여부 확인
echo "📂 /data/AWS-Demo-Factory 디렉토리 확인:"
ls -la /data/AWS-Demo-Factory 2>/dev/null || echo "❌ 디렉토리 접근 실패"

# 부모 디렉토리 확인
echo "📂 /data 디렉토리 확인:"
ls -la /data/ 2>/dev/null || echo "❌ 부모 디렉토리 접근 실패"

echo ""
echo "🛠️ 2. 디렉토리 문제 해결..."

# 안전한 디렉토리로 이동
cd /

# 작업 디렉토리 재설정
echo "📁 안전한 디렉토리로 이동 후 재설정..."
cd /data/AWS-Demo-Factory 2>/dev/null || {
    echo "❌ /data/AWS-Demo-Factory 접근 실패"
    echo "🔧 디렉토리 재생성 시도..."
    
    # 디렉토리가 손상된 경우 재생성
    mkdir -p /data/AWS-Demo-Factory-new
    
    # 기존 파일들이 있다면 복사
    if [ -d "/data/AWS-Demo-Factory" ]; then
        cp -r /data/AWS-Demo-Factory/* /data/AWS-Demo-Factory-new/ 2>/dev/null || true
        mv /data/AWS-Demo-Factory /data/AWS-Demo-Factory-backup
        mv /data/AWS-Demo-Factory-new /data/AWS-Demo-Factory
    fi
    
    cd /data/AWS-Demo-Factory
}

echo "✅ 현재 디렉토리: $(pwd)"

echo ""
echo "🔍 3. 권한 및 소유권 확인..."

# 현재 사용자 확인
echo "👤 현재 사용자: $(whoami)"

# 디렉토리 권한 확인
echo "🔒 디렉토리 권한:"
ls -la . | head -5

# 소유권 수정 (필요시)
echo "🔧 소유권 수정..."
chown -R root:root /data/AWS-Demo-Factory 2>/dev/null || echo "⚠️ 소유권 수정 실패 (이미 올바를 수 있음)"

echo ""
echo "🧹 4. 환경 정리..."

# 환경 변수 재설정
export PWD=/data/AWS-Demo-Factory
export OLDPWD=/

# 쉘 환경 재초기화
hash -r

echo ""
echo "🧪 5. 테스트..."

# 기본 명령어 테스트
echo "📋 기본 명령어 테스트:"
echo "  pwd: $(pwd)"
echo "  ls: $(ls -1 | head -3 | tr '\n' ' ')..."

# Node.js 및 Python 접근 테스트
echo "📋 실행 환경 테스트:"
node --version 2>/dev/null && echo "  ✅ Node.js 접근 가능" || echo "  ❌ Node.js 접근 불가"
python3 --version 2>/dev/null && echo "  ✅ Python 접근 가능" || echo "  ❌ Python 접근 불가"

echo ""
echo "✅ 디렉토리 문제 해결 완료!"
echo ""
echo "🚀 다음 단계:"
echo "  1. 현재 스크립트 종료 후 새 터미널 세션 시작"
echo "  2. cd /data/AWS-Demo-Factory"
echo "  3. ./start-production.sh 재실행"
echo ""
echo "💡 문제가 지속되면:"
echo "  1. 시스템 재부팅: sudo reboot"
echo "  2. 디렉토리 완전 재생성"
