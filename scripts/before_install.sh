#!/bin/bash

TODAY=$(date "+%Y%m%d%H%M")

# 기존 파일 정리
mv /data/AWS-Demo-Factory /data/bak/${TODAY}/

# 애플리케이션 디렉토리 생성
if [ ! -d /data/AWS-Demo-Factory ]; then
    mkdir -p /data/AWS-Demo-Factory
fi

# 필요한 디렉토리 생성
mkdir -p /data/AWS-Demo-Factory/logs

# 권한 설정
sudo chown -R root:ec2-user /data/AWS-Demo-Factory
sudo chmod -R 755 /data/AWS-Demo-Factory

# pm2 설치
npm install pm2 -g

# pm2 종료
pm2 kill all