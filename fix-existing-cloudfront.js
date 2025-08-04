#!/usr/bin/env node

const { CloudFrontClient, GetDistributionConfigCommand, UpdateDistributionCommand } = require('@aws-sdk/client-cloudfront');

const DISTRIBUTION_ID = 'E3T0KBC8PQQM0Z';

async function fixExistingCloudFront() {
    const client = new CloudFrontClient({ region: 'us-east-1' });
    
    try {
        console.log('🔍 기존 CloudFront 설정 조회 중...');
        
        // 현재 설정 가져오기
        const getCommand = new GetDistributionConfigCommand({ Id: DISTRIBUTION_ID });
        const response = await client.send(getCommand);
        
        const config = response.DistributionConfig;
        const etag = response.ETag;
        
        console.log(`📋 현재 Behavior 개수: ${config.CacheBehaviors.Quantity}`);
        console.log('📋 현재 Behavior 순서:');
        config.CacheBehaviors.Items.forEach((behavior, index) => {
            console.log(`  ${index}: ${behavior.PathPattern}`);
        });
        
        // /api/* Behavior 찾기
        const apiBehaviorIndex = config.CacheBehaviors.Items.findIndex(
            behavior => behavior.PathPattern === '/api/*'
        );
        
        if (apiBehaviorIndex === -1) {
            console.log('❌ /api/* Behavior를 찾을 수 없습니다.');
            return;
        }
        
        if (apiBehaviorIndex === 0) {
            console.log('✅ /api/* Behavior가 이미 첫 번째 우선순위입니다.');
            return;
        }
        
        console.log(`🔧 /api/* Behavior를 ${apiBehaviorIndex}번째에서 0번째로 이동 중...`);
        
        // /api/* Behavior를 맨 앞으로 이동
        const apiBehavior = config.CacheBehaviors.Items.splice(apiBehaviorIndex, 1)[0];
        config.CacheBehaviors.Items.unshift(apiBehavior);
        
        console.log('📋 수정된 Behavior 순서:');
        config.CacheBehaviors.Items.forEach((behavior, index) => {
            console.log(`  ${index}: ${behavior.PathPattern}`);
        });
        
        console.log('🚀 CloudFront 설정 업데이트 중...');
        
        // 설정 업데이트
        const updateCommand = new UpdateDistributionCommand({
            Id: DISTRIBUTION_ID,
            DistributionConfig: config,
            IfMatch: etag
        });
        
        const updateResponse = await client.send(updateCommand);
        
        console.log('✅ CloudFront 설정 업데이트 완료!');
        console.log(`📊 새로운 ETag: ${updateResponse.ETag}`);
        console.log(`🔄 배포 상태: ${updateResponse.Distribution.Status}`);
        console.log('⏳ 배포 완료까지 5-10분 소요됩니다.');
        
        console.log('\n🎯 수정 내용:');
        console.log('- /api/* Behavior를 최우선순위(0번째)로 이동');
        console.log('- 이제 API 요청이 정적 파일 Behavior에 의해 차단되지 않음');
        
        console.log('\n🧪 배포 완료 후 테스트할 URL:');
        console.log('- https://demofactory.cloud/api/content/list');
        console.log('- https://demofactory.cloud/api/upload/secure (파일 업로드)');
        
        // 배포 상태 확인 스크립트 업데이트
        const checkScript = `#!/usr/bin/env node
const { CloudFrontClient, GetDistributionCommand } = require('@aws-sdk/client-cloudfront');

async function checkStatus() {
    const client = new CloudFrontClient({ region: 'us-east-1' });
    const command = new GetDistributionCommand({ Id: '${DISTRIBUTION_ID}' });
    const response = await client.send(command);
    
    console.log(\`🔄 배포 상태: \${response.Distribution.Status}\`);
    console.log(\`🌐 도메인: demofactory.cloud\`);
    
    if (response.Distribution.Status === 'Deployed') {
        console.log('✅ 배포 완료! 파일 업로드 테스트 가능합니다.');
        console.log('🧪 테스트: https://demofactory.cloud에서 파일 업로드 시도');
    } else {
        console.log('⏳ 아직 배포 중입니다.');
    }
}

checkStatus();`;
        
        require('fs').writeFileSync('check-existing-cloudfront-status.js', checkScript);
        console.log('\n📄 배포 상태 확인 스크립트 생성: check-existing-cloudfront-status.js');
        
    } catch (error) {
        console.error('❌ 오류 발생:', error.message);
        
        if (error.name === 'PreconditionFailed') {
            console.log('💡 ETag가 변경되었습니다. 다시 시도해주세요.');
        }
        
        process.exit(1);
    }
}

fixExistingCloudFront();