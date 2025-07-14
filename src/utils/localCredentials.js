// 로컬 AWS Credentials 파일에서 자격 증명 읽기
import fs from 'fs';
import path from 'path';
import os from 'os';

class LocalCredentialsService {
    constructor() {
        this.credentialsPath = path.join(os.homedir(), '.aws', 'credentials');
        this.configPath = path.join(os.homedir(), '.aws', 'config');
    }

    parseCredentialsFile(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`Credentials file not found: ${filePath}`);
            }

            const content = fs.readFileSync(filePath, 'utf8');
            const profiles = {};
            let currentProfile = null;

            content.split('\n').forEach(line => {
                line = line.trim();
                
                // 프로필 섹션 [profile_name]
                if (line.startsWith('[') && line.endsWith(']')) {
                    currentProfile = line.slice(1, -1);
                    profiles[currentProfile] = {};
                }
                // 키-값 쌍
                else if (line.includes('=') && currentProfile) {
                    const [key, value] = line.split('=').map(s => s.trim());
                    profiles[currentProfile][key] = value;
                }
            });

            return profiles;
        } catch (error) {
            console.error('❌ Credentials 파일 파싱 실패:', error);
            throw error;
        }
    }

    getCredentials(profileName = 'default') {
        try {
            console.log(`🔐 로컬 AWS Credentials에서 ${profileName} 프로필 가져오는 중...`);
            
            const credentials = this.parseCredentialsFile(this.credentialsPath);
            const config = fs.existsSync(this.configPath) ? 
                this.parseCredentialsFile(this.configPath) : {};

            if (!credentials[profileName]) {
                throw new Error(`Profile '${profileName}' not found in credentials file`);
            }

            const profile = credentials[profileName];
            const profileConfig = config[`profile ${profileName}`] || config[profileName] || {};

            console.log('✅ 로컬 AWS 자격 증명 가져오기 성공');

            return {
                accessKeyId: profile.aws_access_key_id,
                secretAccessKey: profile.aws_secret_access_key,
                sessionToken: profile.aws_session_token, // STS 토큰이 있는 경우
                region: profileConfig.region || process.env.AWS_DEFAULT_REGION || 'us-west-2'
            };
        } catch (error) {
            console.error('❌ 로컬 자격 증명 가져오기 실패:', error);
            throw error;
        }
    }

    getCredentialsForService(serviceName, profileName = 'default') {
        try {
            const credentials = this.getCredentials(profileName);
            
            // AWS SDK v3 형식으로 반환
            const config = {
                region: credentials.region,
                credentials: {
                    accessKeyId: credentials.accessKeyId,
                    secretAccessKey: credentials.secretAccessKey
                }
            };

            // STS 토큰이 있는 경우 추가
            if (credentials.sessionToken) {
                config.credentials.sessionToken = credentials.sessionToken;
            }

            console.log(`✅ ${serviceName} 서비스용 자격 증명 설정 완료`);
            return config;
        } catch (error) {
            console.error(`❌ ${serviceName} 자격 증명 설정 실패:`, error);
            throw error;
        }
    }

    // 사용 가능한 프로필 목록 가져오기
    getAvailableProfiles() {
        try {
            const credentials = this.parseCredentialsFile(this.credentialsPath);
            return Object.keys(credentials);
        } catch (error) {
            console.error('❌ 프로필 목록 가져오기 실패:', error);
            return [];
        }
    }
}

export default new LocalCredentialsService();
