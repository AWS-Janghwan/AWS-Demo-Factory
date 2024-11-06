#!/bin/bash

TODAY=$(date "+%Y%m%d")

# 애플리케이션 디렉토리 생성
if [ ! -d /data/AWS-Demo-Factory ]; then
    mkdir -p /data/AWS-Demo-Factory
fi

# 기존 파일 정리
mv /data/AWS-Demo-Factory /data/bak/${TODAY}/

# 필요한 디렉토리 생성
mkdir -p /data/AWS-Demo-Factory/logs

# 권한 설정
sudo chown -R ec2-user:ec2-user /data/AWS-Demo-Factory
sudo chmod -R 755 /data/AWS-Demo-Factory

# Node.js와 npm이 설치되어 있지 않다면 설치
if ! command -v node &> /dev/null; then
    curl -sL https://rpm.nodesource.com/setup_16.x | sudo bash -
    sudo yum install -y nodejs
fi

# PM2가 설치되어 있지 않다면 설치
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi