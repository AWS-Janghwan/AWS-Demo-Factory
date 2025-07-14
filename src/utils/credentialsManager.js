// 통합 AWS 자격 증명 관리자
import secretsManager from './secretsManager.js';
import localCredentials from './localCredentials.js';

class CredentialsManager {
    constructor() {
        this.credentialSource = process.env.REACT_APP_CREDENTIAL_SOURCE || 'local'; // 'secrets' | 'local' | 'env'
        this.profileName = process.env.REACT_APP_AWS_PROFILE || 'default';
    }

    async getCredentials() {
        try {
            console.log(`🔐 자격 증명 가져오기 (소스: ${this.credentialSource})`);

            switch (this.credentialSource) {
                case 'secrets':
                    return await secretsManager.getAWSCredentials();
                
                case 'local':
                    return localCredentials.getCredentials(this.profileName);
                
                case 'env':
                    return this.getEnvironmentCredentials();
                
                default:
                    // 우선순위: 환경변수 → 로컬 → Secrets Manager
                    return await this.getCredentialsWithFallback();
            }
        } catch (error) {
            console.error('❌ 자격 증명 가져오기 실패:', error);
            throw error;
        }
    }

    getEnvironmentCredentials() {
        const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
        const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
        const sessionToken = process.env.AWS_SESSION_TOKEN;
        const region = process.env.AWS_DEFAULT_REGION || process.env.REACT_APP_AWS_REGION || 'us-west-2';

        if (!accessKeyId || !secretAccessKey) {
            throw new Error('환경 변수에서 AWS 자격 증명을 찾을 수 없습니다');
        }

        console.log('✅ 환경 변수에서 AWS 자격 증명 가져오기 성공');

        return {
            accessKeyId,
            secretAccessKey,
            sessionToken,
            region
        };
    }

    async getCredentialsWithFallback() {
        // 1. 환경 변수 시도
        try {
            return this.getEnvironmentCredentials();
        } catch (error) {
            console.log('⚠️ 환경 변수에서 자격 증명 없음, 로컬 파일 시도...');
        }

        // 2. 로컬 credentials 파일 시도
        try {
            return localCredentials.getCredentials(this.profileName);
        } catch (error) {
            console.log('⚠️ 로컬 파일에서 자격 증명 없음, Secrets Manager 시도...');
        }

        // 3. Secrets Manager 시도
        try {
            return await secretsManager.getAWSCredentials();
        } catch (error) {
            throw new Error('모든 자격 증명 소스에서 실패했습니다');
        }
    }

    async getCredentialsForService(serviceName) {
        try {
            const credentials = await this.getCredentials();
            
            return {
                region: credentials.region,
                credentials: {
                    accessKeyId: credentials.accessKeyId,
                    secretAccessKey: credentials.secretAccessKey,
                    ...(credentials.sessionToken && { sessionToken: credentials.sessionToken })
                }
            };
        } catch (error) {
            console.error(`❌ ${serviceName} 자격 증명 설정 실패:`, error);
            throw error;
        }
    }

    // 자격 증명 테스트
    async testCredentials() {
        try {
            const credentials = await this.getCredentials();
            console.log('🧪 자격 증명 테스트 중...');
            
            // STS를 사용해서 자격 증명 유효성 검사
            const { STSClient, GetCallerIdentityCommand } = await import('@aws-sdk/client-sts');
            
            const stsClient = new STSClient({
                region: credentials.region,
                credentials: {
                    accessKeyId: credentials.accessKeyId,
                    secretAccessKey: credentials.secretAccessKey,
                    ...(credentials.sessionToken && { sessionToken: credentials.sessionToken })
                }
            });

            const command = new GetCallerIdentityCommand({});
            const response = await stsClient.send(command);

            console.log('✅ 자격 증명 테스트 성공:', {
                Account: response.Account,
                UserId: response.UserId,
                Arn: response.Arn
            });

            return true;
        } catch (error) {
            console.error('❌ 자격 증명 테스트 실패:', error);
            return false;
        }
    }
}

export default new CredentialsManager();
