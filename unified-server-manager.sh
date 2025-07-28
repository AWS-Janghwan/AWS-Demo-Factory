#!/bin/bash

# =============================================================================
# AWS Demo Factory 통합 서버 관리 스크립트
# =============================================================================
# 모든 서버를 하나의 스크립트로 관리합니다.
# 사용법: ./unified-server-manager.sh [start|stop|restart|status]
# =============================================================================

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# PID 파일 디렉토리
PID_DIR="./pids"
LOG_DIR="./logs"

# 디렉토리 생성
mkdir -p "$PID_DIR" "$LOG_DIR"

# 서버 정보 함수들
get_server_command() {
    case $1 in
        "static") echo "node simple-static-server.js" ;;
        "backend") echo "node backend-api-server.js" ;;
        "bedrock") echo "node server/bedrock-api.js" ;;
        "pdf") echo "python python-pdf-server/app.py" ;;
        *) echo "" ;;
    esac
}

get_server_port() {
    case $1 in
        "static") echo "3000" ;;
        "backend") echo "3001" ;;
        "bedrock") echo "5001" ;;
        "pdf") echo "5002" ;;
        *) echo "" ;;
    esac
}

get_server_log() {
    echo "$LOG_DIR/$1.log"
}

get_server_pid_file() {
    echo "$PID_DIR/$1.pid"
}

# 서버 상태 확인 함수
check_server_status() {
    local server_name=$1
    local port=$(get_server_port "$server_name")
    local pid_file=$(get_server_pid_file "$server_name")
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            if curl -s --max-time 3 "http://localhost:$port" > /dev/null 2>&1; then
                echo "running"
            else
                echo "process_running_no_response"
            fi
        else
            echo "stopped"
        fi
    else
        echo "stopped"
    fi
}

# 서버 시작 함수
start_server() {
    local server_name=$1
    local command=$(get_server_command "$server_name")
    local port=$(get_server_port "$server_name")
    local log_file=$(get_server_log "$server_name")
    local pid_file=$(get_server_pid_file "$server_name")
    
    if [ -z "$command" ] || [ -z "$port" ]; then
        log_error "알 수 없는 서버: $server_name"
        return 1
    fi
    
    # 서버 상태 확인
    local status=$(check_server_status "$server_name")
    
    if [ "$status" = "running" ]; then
        log_warning "$server_name 서버가 이미 실행 중입니다 (포트: $port)"
        return 0
    fi
    
    # 기존 프로세스 정리
    if [ "$status" = "process_running_no_response" ]; then
        log_warning "$server_name 서버 프로세스가 응답하지 않습니다. 재시작합니다."
        stop_server "$server_name"
        sleep 2
    fi
    
    log_info "$server_name 서버 시작 중... (포트: $port)"
    
    # 특별한 처리가 필요한 서버들
    case $server_name in
        "pdf")
            if [ ! -d "python-pdf-server/venv" ]; then
                log_error "Python 가상환경이 없습니다. 먼저 설정해주세요."
                return 1
            fi
            cd python-pdf-server
            source venv/bin/activate
            nohup python app.py > "../$log_file" 2>&1 &
            local pid=$!
            cd ..
            ;;
        "bedrock")
            if [ ! -f "server/bedrock-api.js" ]; then
                log_warning "Bedrock API 서버 파일이 없습니다. 건너뜁니다."
                return 0
            fi
            nohup $command > "$log_file" 2>&1 &
            local pid=$!
            ;;
        *)
            nohup $command > "$log_file" 2>&1 &
            local pid=$!
            ;;
    esac
    
    echo $pid > "$pid_file"
    
    # 서버 시작 확인 (최대 30초 대기)
    local max_attempts=15
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        sleep 2
        local status=$(check_server_status "$server_name")
        
        if [ "$status" = "running" ]; then
            log_success "$server_name 서버 시작 완료 (PID: $pid, 포트: $port)"
            return 0
        fi
        
        log_info "서버 시작 대기 중... ($attempt/$max_attempts)"
        attempt=$((attempt + 1))
    done
    
    log_error "$server_name 서버 시작 실패"
    return 1
}

# 서버 중지 함수
stop_server() {
    local server_name=$1
    local pid_file=$(get_server_pid_file "$server_name")
    
    if [ ! -f "$pid_file" ]; then
        log_warning "$server_name 서버가 실행되지 않았습니다"
        return 0
    fi
    
    local pid=$(cat "$pid_file")
    
    if ps -p "$pid" > /dev/null 2>&1; then
        log_info "$server_name 서버 중지 중... (PID: $pid)"
        kill -TERM "$pid" 2>/dev/null || true
        
        # 정상 종료 대기 (10초)
        local count=0
        while ps -p "$pid" > /dev/null 2>&1 && [ $count -lt 10 ]; do
            sleep 1
            count=$((count + 1))
        done
        
        # 강제 종료
        if ps -p "$pid" > /dev/null 2>&1; then
            log_warning "$server_name 서버 강제 종료 중..."
            kill -KILL "$pid" 2>/dev/null || true
        fi
        
        log_success "$server_name 서버 중지 완료"
    else
        log_warning "$server_name 서버 프로세스가 이미 종료되었습니다"
    fi
    
    rm -f "$pid_file"
}

# 모든 서버 시작
start_all_servers() {
    log_info "=== AWS Demo Factory 서버 시작 ==="
    
    # 환경 확인
    if [ ! -f "build/index.html" ]; then
        log_info "React 빌드 파일이 없습니다. 빌드를 실행합니다..."
        npm run build
    fi
    
    # 서버 시작 순서 (의존성 고려)
    local servers="static backend bedrock pdf"
    
    for server in $servers; do
        start_server "$server"
        sleep 1  # 서버 간 시작 간격
    done
    
    log_success "=== 모든 서버 시작 완료 ==="
    show_status
}

# 모든 서버 중지
stop_all_servers() {
    log_info "=== AWS Demo Factory 서버 중지 ==="
    
    # 역순으로 중지
    local servers="pdf bedrock backend static"
    
    for server in $servers; do
        stop_server "$server"
    done
    
    # 추가 정리
    pkill -f "simple-static-server" 2>/dev/null || true
    pkill -f "backend-api-server" 2>/dev/null || true
    pkill -f "bedrock-api" 2>/dev/null || true
    pkill -f "python.*app.py" 2>/dev/null || true
    
    log_success "=== 모든 서버 중지 완료 ==="
}

# 서버 상태 표시
show_status() {
    log_info "=== 서버 상태 ==="
    
    printf "%-10s %-6s %-15s %-25s\n" "서버" "포트" "상태" "URL"
    printf "%-10s %-6s %-15s %-25s\n" "------" "----" "-------" "---"
    
    local servers="static backend bedrock pdf"
    
    for server in $servers; do
        local port=$(get_server_port "$server")
        local status=$(check_server_status "$server")
        local status_display=""
        local url="http://localhost:$port"
        
        case $status in
            "running")
                status_display="실행중"
                ;;
            "process_running_no_response")
                status_display="응답없음"
                ;;
            "stopped")
                status_display="중지됨"
                ;;
        esac
        
        printf "%-10s %-6s %-15s %-25s\n" "$server" "$port" "$status_display" "$url"
    done
    
    echo ""
    log_info "로그 확인: tail -f $LOG_DIR/[서버명].log"
    log_info "개별 제어: $0 start|stop [서버명]"
}

# 서버 재시작
restart_all_servers() {
    log_info "=== 서버 재시작 ==="
    stop_all_servers
    sleep 3
    start_all_servers
}

# 로그 보기
show_logs() {
    local server_name=${1:-"all"}
    
    if [ "$server_name" = "all" ]; then
        log_info "=== 모든 서버 로그 (최근 20줄) ==="
        local servers="static backend bedrock pdf"
        for server in $servers; do
            local log_file=$(get_server_log "$server")
            if [ -f "$log_file" ]; then
                echo ""
                log_info "[$server 서버 로그]"
                tail -20 "$log_file"
            fi
        done
    else
        local log_file=$(get_server_log "$server_name")
        if [ -f "$log_file" ]; then
            log_info "=== $server_name 서버 로그 ==="
            tail -f "$log_file"
        else
            log_error "$server_name 서버 로그 파일이 없습니다"
        fi
    fi
}

# 헬프 메시지
show_help() {
    echo "AWS Demo Factory 통합 서버 관리 스크립트"
    echo ""
    echo "사용법:"
    echo "  $0 start [서버명]     - 서버 시작 (서버명 생략시 모든 서버)"
    echo "  $0 stop [서버명]      - 서버 중지 (서버명 생략시 모든 서버)"
    echo "  $0 restart [서버명]   - 서버 재시작 (서버명 생략시 모든 서버)"
    echo "  $0 status            - 서버 상태 확인"
    echo "  $0 logs [서버명]     - 로그 보기 (서버명 생략시 모든 로그)"
    echo "  $0 help              - 도움말"
    echo ""
    echo "사용 가능한 서버:"
    local servers="static backend bedrock pdf"
    for server in $servers; do
        local port=$(get_server_port "$server")
        echo "  - $server (포트: $port)"
    done
}

# 메인 로직
main() {
    local action=${1:-"help"}
    local server_name=$2
    
    case $action in
        "start")
            if [ -n "$server_name" ]; then
                start_server "$server_name"
            else
                start_all_servers
            fi
            ;;
        "stop")
            if [ -n "$server_name" ]; then
                stop_server "$server_name"
            else
                stop_all_servers
            fi
            ;;
        "restart")
            if [ -n "$server_name" ]; then
                stop_server "$server_name"
                sleep 2
                start_server "$server_name"
            else
                restart_all_servers
            fi
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs "$server_name"
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "알 수 없는 명령어: $action"
            show_help
            exit 1
            ;;
    esac
}

# 스크립트 실행
main "$@"