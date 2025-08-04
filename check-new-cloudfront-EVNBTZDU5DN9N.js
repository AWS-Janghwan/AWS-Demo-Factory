#!/usr/bin/env node
const { CloudFrontClient, GetDistributionCommand } = require('@aws-sdk/client-cloudfront');

async function checkStatus() {
    const client = new CloudFrontClient({ region: 'us-east-1' });
    const command = new GetDistributionCommand({ Id: 'EVNBTZDU5DN9N' });
    const response = await client.send(command);
    
    console.log(`🔄 배포 상태: ${response.Distribution.Status}`);
    console.log(`🌐 도메인: ${response.Distribution.DomainName}`);
    
    if (response.Distribution.Status === 'Deployed') {
        console.log('✅ 배포 완료! 테스트 가능합니다.');
    } else {
        console.log('⏳ 아직 배포 중입니다.');
    }
}

checkStatus();