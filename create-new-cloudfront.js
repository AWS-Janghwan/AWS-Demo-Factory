#!/usr/bin/env node

const { CloudFrontClient, CreateDistributionCommand } = require('@aws-sdk/client-cloudfront');

const ALB_DOMAIN = 'demo-factory-alb-10818307.ap-northeast-2.elb.amazonaws.com';

async function createNewCloudFront() {
    const client = new CloudFrontClient({ region: 'us-east-1' });
    
    try {
        console.log('🚀 새로운 CloudFront Distribution 생성 중...');
        
        const distributionConfig = {
            CallerReference: `demo-factory-new-${Date.now()}`,
            Comment: 'Demo Factory - New Distribution with proper API support',
            DefaultRootObject: 'index.html',
            
            // Origins 설정
            Origins: {
                Quantity: 1,
                Items: [
                    {
                        Id: ALB_DOMAIN,
                        DomainName: ALB_DOMAIN,
                        OriginPath: '',
                        CustomHeaders: {
                            Quantity: 0
                        },
                        CustomOriginConfig: {
                            HTTPPort: 80,  // 올바른 포트 설정
                            HTTPSPort: 443,
                            OriginProtocolPolicy: 'http-only',
                            OriginSslProtocols: {
                                Quantity: 3,
                                Items: ['TLSv1.2', 'TLSv1.1', 'TLSv1']
                            },
                            OriginReadTimeout: 30,
                            OriginKeepaliveTimeout: 5
                        },
                        ConnectionAttempts: 3,
                        ConnectionTimeout: 10,
                        OriginShield: {
                            Enabled: false
                        }
                    }
                ]
            },
            
            // Default Cache Behavior (정적 파일용)
            DefaultCacheBehavior: {
                TargetOriginId: ALB_DOMAIN,
                ViewerProtocolPolicy: 'redirect-to-https',
                TrustedSigners: {
                    Enabled: false,
                    Quantity: 0
                },
                TrustedKeyGroups: {
                    Enabled: false,
                    Quantity: 0
                },
                AllowedMethods: {
                    Quantity: 2,
                    Items: ['HEAD', 'GET'],
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
                CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6', // Managed-CachingOptimized
                OriginRequestPolicyId: '216adef6-5c7f-47e4-b989-5492eafa07d3' // Managed-AllViewer
            },
            
            // Cache Behaviors (API용)
            CacheBehaviors: {
                Quantity: 1,
                Items: [
                    {
                        PathPattern: '/api/*',
                        TargetOriginId: ALB_DOMAIN,
                        ViewerProtocolPolicy: 'redirect-to-https',
                        TrustedSigners: {
                            Enabled: false,
                            Quantity: 0
                        },
                        TrustedKeyGroups: {
                            Enabled: false,
                            Quantity: 0
                        },
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
                        CachePolicyId: '4135ea2d-6df8-44a3-9df3-4b5a84be39ad', // Managed-CachingDisabled
                        OriginRequestPolicyId: '216adef6-5c7f-47e4-b989-5492eafa07d3' // Managed-AllViewer
                    }
                ]
            },
            
            // 기타 설정
            Enabled: true,
            PriceClass: 'PriceClass_All',
            
            // 에러 페이지 설정
            CustomErrorResponses: {
                Quantity: 1,
                Items: [
                    {
                        ErrorCode: 404,
                        ResponsePagePath: '/index.html',
                        ResponseCode: '200',
                        ErrorCachingMinTTL: 300
                    }
                ]
            },
            
            // 로깅 설정
            Logging: {
                Enabled: false,
                IncludeCookies: false,
                Bucket: '',
                Prefix: ''
            },
            
            // 웹 ACL
            WebACLId: '',
            
            // HTTP 버전
            HttpVersion: 'http2',
            
            // IPv6 지원
            IsIPV6Enabled: true,
            
            // 별칭 설정 (나중에 추가 가능)
            Aliases: {
                Quantity: 0
            }
        };
        
        const command = new CreateDistributionCommand({
            DistributionConfig: distributionConfig
        });
        
        console.log('📋 Distribution 설정:');
        console.log(`- Origin: ${ALB_DOMAIN}:80 (HTTP)`);
        console.log('- Default Behavior: 정적 파일 (캐시 활성화)');
        console.log('- API Behavior: /api/* (캐시 비활성화, 모든 HTTP 메서드)');
        
        const response = await client.send(command);
        
        const distribution = response.Distribution;
        const distributionId = distribution.Id;
        const domainName = distribution.DomainName;
        
        console.log('✅ 새로운 CloudFront Distribution 생성 완료!');
        console.log(`📊 Distribution ID: ${distributionId}`);
        console.log(`🌐 CloudFront 도메인: ${domainName}`);
        console.log(`🔄 배포 상태: ${distribution.Status}`);
        console.log('⏳ 배포 완료까지 10-15분 소요됩니다.');
        
        console.log('\n🧪 배포 완료 후 테스트할 URL:');
        console.log(`- https://${domainName}`);
        console.log(`- https://${domainName}/api/content/list`);
        console.log(`- https://${domainName}/api/upload/secure (파일 업로드)`);
        
        console.log('\n📋 다음 단계:');
        console.log('1. 배포 완료 대기 (10-15분)');
        console.log('2. 새 도메인으로 테스트');
        console.log('3. 정상 작동 확인 후 DNS 변경 고려');
        
        // 배포 상태 확인 스크립트 생성
        const checkScript = `#!/usr/bin/env node
const { CloudFrontClient, GetDistributionCommand } = require('@aws-sdk/client-cloudfront');

async function checkStatus() {
    const client = new CloudFrontClient({ region: 'us-east-1' });
    const command = new GetDistributionCommand({ Id: '${distributionId}' });
    const response = await client.send(command);
    
    console.log(\`🔄 배포 상태: \${response.Distribution.Status}\`);
    console.log(\`🌐 도메인: \${response.Distribution.DomainName}\`);
    
    if (response.Distribution.Status === 'Deployed') {
        console.log('✅ 배포 완료! 테스트 가능합니다.');
    } else {
        console.log('⏳ 아직 배포 중입니다.');
    }
}

checkStatus();`;
        
        require('fs').writeFileSync(`check-new-cloudfront-${distributionId}.js`, checkScript);
        console.log(`\n📄 배포 상태 확인 스크립트 생성: check-new-cloudfront-${distributionId}.js`);
        
    } catch (error) {
        console.error('❌ 오류 발생:', error.message);
        process.exit(1);
    }
}

createNewCloudFront();