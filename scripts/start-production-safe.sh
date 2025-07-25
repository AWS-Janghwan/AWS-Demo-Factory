#!/bin/bash

echo "🚀 AWS Demo Factory 안전한 프로덕션 시작"
echo "=================================================="

# 안전한 디렉토리 이동
cd / 2>/dev/null
cd /data/AWS-Demo-Factory 2>/dev/null || {
    echo "❌ 디렉토리 접근 실패. 경로 확인 중..."
    
    # 가능한 경로들 확인
    for path in "/data/AWS-Demo-Factory" "/home/ec2-user/AWS-Demo-Factory" "/opt/AWS-Demo-Factory" "/var/www/AWS-Demo-Factory"; do
        if [ -d "$path" ]; then
            echo "✅ 발견된 경로: $path"
            cd "$path"
            break
        fi
    done
    
    # 여전히 실패하면 현재 위치에서 시도
    if [ ! -f "package.json" ]; then
        echo "❌ AWS Demo Factory 프로젝트를 찾을 수 없습니다."
        echo "💡 수동으로 올바른 디렉토리로 이동 후 다시 실행하세요."
        exit 1
    fi
}

# 현재 위치 확인
echo "📁 현재 디렉토리: $(pwd 2>/dev/null || echo '/data/AWS-Demo-Factory')"

# 환경 변수 설정
export PWD=$(pwd 2>/dev/null || echo '/data/AWS-Demo-Factory')
export HOME=/root

echo ""
echo "🛑 1. 기존 프로세스 정리..."

# 기존 프로세스 종료 (더 안전한 방법)
pkill -f "python.*app.py" 2>/dev/null || true
pkill -f "node.*bedrock" 2>/dev/null || true  
pkill -f "node.*backend" 2>/dev/null || true
pkill -f "serve.*build" 2>/dev/null || true
pkill -f "npm.*start" 2>/dev/null || true

# 잠시 대기
sleep 2

echo "✅ 기존 프로세스 정리 완료"

echo ""
echo "🐍 2. Python PDF 서버 시작..."

# Python PDF 서버 시작 (절대 경로 사용)
if [ -d "python-pdf-server" ] && [ -f "python-pdf-server/app.py" ]; then
    (
        cd python-pdf-server 2>/dev/null || exit 1
        
        # 가상환경 활성화
        if [ -f "venv/bin/activate" ]; then
            source venv/bin/activate
            echo "  ✅ Python 가상환경 활성화"
        else
            echo "  ⚠️ Python 가상환경 없음, 시스템 Python 사용"
        fi
        
        # PDF 서버 시작
        nohup python3 app.py > ../pdf-server.log 2>&1 &
        PDF_PID=$!
        echo "  ✅ PDF 서버 시작됨 (PID: $PDF_PID)"
    )
else
    echo "  ❌ Python PDF 서버 파일을 찾을 수 없음"
fi

echo ""
echo "🤖 3. Bedrock API 서버 시작..."

# Bedrock API 서버 시작
if [ -f "server/bedrock-api.js" ]; then
    nohup node server/bedrock-api.js > bedrock-server.log 2>&1 &
    BEDROCK_PID=$!
    echo "  ✅ Bedrock API 서버 시작됨 (PID: $BEDROCK_PID)"
else
    echo "  ❌ Bedrock API 서버 파일을 찾을 수 없음"
fi

echo ""
echo "🖥️ 4. 백엔드 API 서버 시작..."

# 백엔드 API 서버 시작
if [ -f "backend-api-server.js" ]; then
    nohup node backend-api-server.js > backend-api.log 2>&1 &
    BACKEND_PID=$!
    echo "  ✅ 백엔드 API 서버 시작됨 (PID: $BACKEND_PID)"
else
    echo "  ❌ 백엔드 API 서버 파일을 찾을 수 없음"
fi

echo ""
echo "🌐 5. 정적 파일 서버 시작..."

# 정적 파일 서버 시작 (build 폴더가 있는 경우)
if [ -d "build" ] && [ -f "build/index.html" ]; then
    # serve 패키지가 설치되어 있는지 확인
    if command -v npx >/dev/null 2>&1; then
        nohup npx serve -s build -l 3000 > static-server.log 2>&1 &
        STATIC_PID=$!
        echo "  ✅ 정적 파일 서버 시작됨 (PID: $STATIC_PID, 포트: 3000)"
    else
        echo "  ⚠️ npx를 찾을 수 없음, 정적 파일 서버 시작 실패"
    fi
else
    echo "  ⚠️ build 폴더가 없음. 먼저 'npm run build'를 실행하세요."
fi

echo ""
echo "⏱️ 6. 서버 안정화 대기..."
sleep 3

echo ""
echo "🔍 7. 서비스 상태 확인..."

# 프로세스 확인
echo "📋 실행 중인 서비스:"
ps aux | grep -E "(python.*app|node.*bedrock|node.*backend|serve.*build)" | grep -v grep | while read line; do
    echo "  ✅ $line"
done

# 포트 확인
echo ""
echo "🌐 포트 사용 현황:"
for port in 3000 3001 5001 5002; do
    if lsof -i :$port >/dev/null 2>&1; then
        echo "  ✅ 포트 $port: 사용 중"
    else
        echo "  ❌ 포트 $port: 사용되지 않음"
    fi
done

echo ""
echo "🎉 AWS Demo Factory 프로덕션 서버 시작 완료!"
echo ""
echo "🌐 서비스 URL:"
echo "  📱 웹 애플리케이션: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR-EC2-IP'):3000"
echo "  🖥️ 백엔드 API: http://localhost:3001"
echo "  🤖 Bedrock API: http://localhost:5001"  
echo "  📄 PDF 서버: http://localhost:5002"
echo ""
echo "📋 로그 파일:"
echo "  📄 PDF 서버: tail -f pdf-server.log"
echo "  🤖 Bedrock API: tail -f bedrock-server.log"
echo "  🖥️ 백엔드 API: tail -f backend-api.log"
echo "  🌐 정적 서버: tail -f static-server.log"
