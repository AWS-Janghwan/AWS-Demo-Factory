#!/bin/bash

# 애플리케이션 디렉토리로 이동
cd /data/AWS-Demo-Factory


# 서버 시작
npm run start

# if [ "$NODE_ENV" == "production" ]; then
#     npm run start
# else
#     npm run dev
# fi