// AWS Secrets Manager에서 자격 증명 가져오기
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

class SecretsManagerService {
    constructor() {
        this.client = new SecretsManagerClient({
            region: process.env.REACT_APP_AWS_REGION || 'us-west-2'
        });
        this.secretName = "demo-factory/aws-credentials";
    }

    async getAWSCredentials() {
        try {
            console.log('🔐 Secrets Manager에서 AWS 자격 증명 가져오는 중...');
            
            const command = new GetSecretValueCommand({
                SecretId: this.secretName,
                VersionStage: "AWSCURRENT"
            });

            const response = await this.client.send(command);
            const secret = JSON.parse(response.SecretString);

            console.log('✅ AWS 자격 증명 가져오기 성공');
            
            return {
                accessKeyId: secret.AWS_ACCESS_KEY_ID,
                secretAccessKey: secret.AWS_SECRET_ACCESS_KEY,
                region: secret.AWS_REGION
            };
        } catch (error) {
            console.error('❌ Secrets Manager에서 자격 증명 가져오기 실패:', error);
            throw error;
        }
    }

    async getCredentialsForService(serviceName) {
        try {
            const credentials = await this.getAWSCredentials();
            
            // 서비스별 AWS SDK 클라이언트 설정
            return {
                region: credentials.region,
                credentials: {
                    accessKeyId: credentials.accessKeyId,
                    secretAccessKey: credentials.secretAccessKey
                }
            };
        } catch (error) {
            console.error(`❌ ${serviceName} 자격 증명 설정 실패:`, error);
            throw error;
        }
    }
}

export default new SecretsManagerService();
