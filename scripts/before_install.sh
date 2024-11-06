#!/bin/bash

TODAY=$(date "+%Y%m%d%h%m")

# 기존 파일 정리
mv /data/AWS-Demo-Factory /data/bak/${TODAY}/

# 애플리케이션 디렉토리 생성
if [ ! -d /data/AWS-Demo-Factory ]; then
    mkdir -p /data/AWS-Demo-Factory
fi

# 필요한 디렉토리 생성
mkdir -p /data/AWS-Demo-Factory/logs

# 권한 설정
sudo chown -R ec2-user:ec2-user /data/AWS-Demo-Factory
sudo chmod -R 755 /data/AWS-Demo-Factory

