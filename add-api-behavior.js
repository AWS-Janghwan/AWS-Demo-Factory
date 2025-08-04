#!/usr/bin/env node

const { CloudFrontClient, GetDistributionConfigCommand, UpdateDistributionCommand } = require('@aws-sdk/client-cloudfront');
const fs = require('fs');

const DISTRIBUTION_ID = 'E3T0KBC8PQQM0Z';

async function addApiBehavior() {
    const client = new CloudFrontClient({ region: 'us-east-1' }); // CloudFront는 us-east-1 사용
    
    try {
        console.log('🔍 현재 CloudFront 설정 조회 중...');
        
        // 현재 설정 가져오기
        const getCommand = new GetDistributionConfigCommand({ Id: DISTRIBUTION_ID });
        const response = await client.send(getCommand);
        
        const config = response.DistributionConfig;
        const etag = response.ETag;
        
        console.log(`📋 현재 Behavior 개수: ${config.CacheBehaviors.Quantity}`);
        
        // /api/* 패턴이 이미 있는지 확인
        const existingApiBehavior = config.CacheBehaviors.Items.find(
            behavior => behavior.PathPattern === '/api/*'
        );
        
        console.log(`🔍 /api/* Behavior 존재 여부: ${existingApiBehavior ? '✅ 있음' : '❌ 없음'}`);
        
        // Origin 포트 수정 (3000 → 80)
        const origin = config.Origins.Items.find(
            origin => origin.Id === 'demo-factory-alb-10818307.ap-northeast-2.elb.amazonaws.com'
        );
        
        let needsUpdate = false;
        
        if (origin) {
            console.log(`🔍 현재 Origin HTTPPort: ${origin.CustomOriginConfig.HTTPPort}`);
            
            if (origin.CustomOriginConfig.HTTPPort !== 80) {
                console.log(`🔧 Origin HTTPPort 수정: ${origin.CustomOriginConfig.HTTPPort} → 80`);
                origin.CustomOriginConfig.HTTPPort = 80;
                needsUpdate = true;
            } else {
                console.log('✅ Origin HTTPPort가 이미 80으로 설정되어 있습니다.');
            }
        }
        
        if (existingApiBehavior && !needsUpdate) {
            console.log('✅ /api/* Behavior와 Origin 포트가 모두 올바르게 설정되어 있습니다.');
            console.log('🔍 다른 문제를 확인해야 합니다.');
            return;
        }
        
        if (!existingApiBehavior) {
            // 새로운 API Behavior 생성
            const apiBehavior = {
                PathPattern: '/api/*',
                TargetOriginId: 'demo-factory-alb-10818307.ap-northeast-2.elb.amazonaws.com',
                TrustedSigners: {
                    Enabled: false,
                    Quantity: 0
                },
                TrustedKeyGroups: {
                    Enabled: false,
                    Quantity: 0
                },
                ViewerProtocolPolicy: 'redirect-to-https',
                AllowedMethods: {
                    Quantity: 7,
                    Items: ['HEAD', 'DELETE', 'POST', 'GET', 'OPTIONS', 'PUT', 'PATCH'],
                    CachedMethods: {
                        Quantity: 2,
                        Items: ['HEAD', 'GET']
                    }
                },
                SmoothStreaming: false,
                Compress: true,
                LambdaFunctionAssociations: {
                    Quantity: 0
                },
                FunctionAssociations: {
                    Quantity: 0
                },
                FieldLevelEncryptionId: '',
                CachePolicyId: '4135ea2d-6df8-44a3-9df3-4b5a84be39ad', // CachingDisabled
                OriginRequestPolicyId: '216adef6-5c7f-47e4-b989-5492eafa07d3' // AllViewer
            };
            
            // Behavior 목록에 추가 (맨 앞에 추가하여 우선순위 높임)
            config.CacheBehaviors.Items.unshift(apiBehavior);
            config.CacheBehaviors.Quantity += 1;
            console.log('🆕 /api/* Behavior 추가됨');
        }
        
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
        
        // 테스트 URL 출력
        console.log('\n🧪 배포 완료 후 테스트할 URL:');
        console.log('- https://demofactory.cloud/api/content/list');
        console.log('- https://demofactory.cloud/api/s3/files');
        console.log('- https://demofactory.cloud/api/upload/secure');
        
    } catch (error) {
        console.error('❌ 오류 발생:', error.message);
        
        if (error.name === 'PreconditionFailed') {
            console.log('💡 ETag가 변경되었습니다. 다시 시도해주세요.');
        }
        
        process.exit(1);
    }
}

// 실행
addApiBehavior();