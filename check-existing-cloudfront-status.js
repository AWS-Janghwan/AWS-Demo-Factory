#!/usr/bin/env node
const { CloudFrontClient, GetDistributionCommand } = require('@aws-sdk/client-cloudfront');

async function checkStatus() {
    const client = new CloudFrontClient({ region: 'us-east-1' });
    const command = new GetDistributionCommand({ Id: 'E3T0KBC8PQQM0Z' });
    const response = await client.send(command);
    
    console.log(`🔄 배포 상태: ${response.Distribution.Status}`);
    console.log(`🌐 도메인: demofactory.cloud`);
    
    if (response.Distribution.Status === 'Deployed') {
        console.log('✅ 배포 완료! 파일 업로드 테스트 가능합니다.');
        console.log('🧪 테스트: https://demofactory.cloud에서 파일 업로드 시도');
    } else {
        console.log('⏳ 아직 배포 중입니다.');
    }
}

checkStatus();