#!/usr/bin/env node

const { CloudFrontClient, GetDistributionCommand } = require('@aws-sdk/client-cloudfront');

const DISTRIBUTION_ID = 'E3T0KBC8PQQM0Z';

async function checkStatus() {
    const client = new CloudFrontClient({ region: 'us-east-1' });
    
    try {
        const command = new GetDistributionCommand({ Id: DISTRIBUTION_ID });
        const response = await client.send(command);
        
        const status = response.Distribution.Status;
        const lastModified = response.Distribution.LastModifiedTime;
        
        console.log(`🔄 배포 상태: ${status}`);
        console.log(`📅 마지막 수정: ${lastModified.toLocaleString()}`);
        
        if (status === 'Deployed') {
            console.log('✅ 배포 완료! 이제 테스트할 수 있습니다.');
            console.log('\n🧪 테스트 URL:');
            console.log('- https://demofactory.cloud/api/content/list');
            console.log('- https://demofactory.cloud/api/s3/files');
            console.log('- https://demofactory.cloud/api/upload/secure');
        } else {
            console.log('⏳ 아직 배포 중입니다. 잠시 후 다시 확인해주세요.');
        }
        
    } catch (error) {
        console.error('❌ 오류 발생:', error.message);
    }
}

checkStatus();