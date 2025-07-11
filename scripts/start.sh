#!/bin/bash

cd /data/AWS-Demo-Factory

# 서버 시작만 (상태 확인 제거)
./start-production.sh >/dev/null 2>&1

echo "ApplicationStart 완료" 
