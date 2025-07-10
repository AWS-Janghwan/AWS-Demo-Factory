#!/bin/bash

# 필요 패키지 설치
#yum -y install nfs-utils
#yum -y install nfs-utils nfs4-acl-tools

# EFS 사용 환경 설정
#mkdir /data
#echo "/data *(rw,sync,no_root_squash)" >> /etc/exports #172.31 대역의 접근 허용
#systemctl restart nfs-server.service
#systemctl enable nfs-server.service

#mount -t nfs 172.31.2.191:/backup /backup
#echo "172.31.2.191:/backup /data nfs defaults 0 0">>/etc/fstab

# video 복사
#if [ ! -d /data/AWS-Demo-Factory/public/source/movie ]; then
#    mkdir -p /data/AWS-Demo-Factory/public/source/movie
#fi
# mkdir /data/AWS-Demo-Factory/public/source/video
#yes | cp -r /data/video/* /data/AWS-Demo-Factory/public/source/movie/

# 애플리케이션 디렉토리로 이동
cd /data/AWS-Demo-Factory

# node_module 삭제
rm -rf /data/AWS-Demo-Factory/node_modules/

# # npm 패키지 설치
npm install --force

# # 리액트 앱 빌드
npm run build



# 권한 재설정
#sudo chown -R root:ec2-user /data/AWS-Demo-Factory
#sudo chmod -R 775 /data/AWS-Demo-Factory

echo "Deployment completed successfully" 
