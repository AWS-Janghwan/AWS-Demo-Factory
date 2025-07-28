#!/bin/bash

echo "🛑 모든 서버 중지 스크립트"
echo "========================"
echo "📅 실행 시간: $(date)"

cd /data/AWS-Demo-Factory 2>/dev/null || cd .

# 통합 서버 관리자를 통한 정상 종료
if [ -f "unified-server-manager.sh" ]; then
    echo "🔧 통합 서버 관리자를 통한 서버 중지..."
    ./unified-server-manager.sh stop
else
    echo "⚠️ 통합 서버 관리자가 없습니다. 개별 프로세스 종료를 시도합니다."
    
    # 개별 프로세스 종료
    echo "🔄 개별 프로세스 종료 중..."
    
    # PID 파일 기반 종료
    for pid_file in *.pid pids/*.pid; do
        if [ -f "$pid_file" ]; then
            pid=$(cat "$pid_file" 2>/dev/null)
            if [ -n "$pid" ] && ps -p "$pid" > /dev/null 2>&1; then
                echo "🔄 프로세스 종료: $pid ($pid_file)"
                kill -TERM "$pid" 2>/dev/null || true
            fi
            rm -f "$pid_file"
        fi
    done
    
    # 포트별 프로세스 강제 종료
    for port in 3000 3001 5001 5002; do
        if lsof -i:$port > /dev/null 2>&1; then
            echo "🔄 포트 $port 프로세스 종료 중..."
            kill -9 $(lsof -t -i:$port) 2>/dev/null || true
        fi
    done
    
    # 프로세스 패턴으로 종료
    pkill -f "simple-static-server" 2>/dev/null || true
    pkill -f "backend-api-server" 2>/dev/null || true
    pkill -f "bedrock-api" 2>/dev/null || true
    pkill -f "python.*app.py" 2>/dev/null || true
    pkill -f "serve.*build" 2>/dev/null || true
fi

echo "✅ 모든 서버 중지 완료"
echo "📅 완료 시간: $(date)"