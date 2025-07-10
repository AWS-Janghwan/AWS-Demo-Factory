#!/bin/bash

#서비스 중지
sudo /usr/local/bin/pm2 kill

# 기존 파일 정리 (백업)
##TODAY=$(date "+%Y%m%d%H%M")
##mv /data/AWS-Demo-Factory /data/bak/${TODAY}/
# sudo mv -f /data/AWS-Demo-Factory/

# 애플리케이션 디렉토리 생성
if [ ! -d /data/AWS-Demo-Factory ]; then
    mkdir -p /data/AWS-Demo-Factory
fi

# 필요한 디렉토리 생성
# mkdir -p /data/AWS-Demo-Factory/logs

# 권한 설정
#sudo chown -R root:ec2-user /data/AWS-Demo-Factory
#sudo chmod -R 755 /data/AWS-Demo-Factory

# # pm2 설치
# npm install pm2 -g

# # pm2 종료
# sudo /usr/local/bin/pm2 kill

# # 기존 서버 stop(kill)
# lsof -i | grep node |kill -9 `awk '{print $2}'`

