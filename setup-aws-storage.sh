#!/bin/bash

echo "🚀 AWS Demo Factory - 대용량 파일 저장소 설정"
echo "================================================"
echo ""

# 환경 변수 확인
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "❌ AWS 자격 증명이 설정되지 않았습니다."
    echo "   .env 파일을 확인하거나 다음 명령어로 설정하세요:"
    echo "   export AWS_ACCESS_KEY_ID=your_access_key"
    echo "   export AWS_SECRET_ACCESS_KEY=your_secret_key"
    exit 1
fi

echo "✅ AWS 자격 증명 확인 완료"
echo ""

# 1단계: AWS 리소스 생성
echo "📋 1단계: AWS 리소스 생성 중..."
node setup-aws-resources.js

if [ $? -ne 0 ]; then
    echo "❌ AWS 리소스 생성 실패"
    exit 1
fi

echo ""
echo "⏳ 잠시 대기 중... (DynamoDB 테이블 활성화)"
sleep 10

# 2단계: 데이터 마이그레이션
echo "📋 2단계: 기존 데이터 마이그레이션 중..."
node migrate-to-aws.js

if [ $? -ne 0 ]; then
    echo "❌ 데이터 마이그레이션 실패"
    echo "   하지만 AWS 리소스는 생성되었으므로 수동으로 데이터를 추가할 수 있습니다."
fi

echo ""
echo "🎉 AWS 저장소 설정 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. 앱 재시작: ./start-dev.sh"
echo "2. 브라우저에서 http://localhost:3000 접속"
echo "3. 대용량 파일 업로드 테스트"
echo ""
echo "💰 예상 비용 (월간):"
echo "- S3 저장소: $2-5 (100GB 기준)"
echo "- DynamoDB: $1-3 (소규모 사용량)"
echo "- 총계: $3-8/월"
echo ""
echo "🔧 문제 해결:"
echo "- AWS 콘솔에서 리소스 확인: https://console.aws.amazon.com"
echo "- S3 버킷: aws-demo-factory-files"
echo "- DynamoDB 테이블: DemoFactoryContents"
