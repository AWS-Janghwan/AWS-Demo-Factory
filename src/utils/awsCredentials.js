// 간단한 AWS 로컬 자격 증명 관리
import fs from 'fs';
import path from 'path';
import os from 'os';

class AWSCredentials {
    constructor() {
        this.credentialsPath = path.join(os.homedir(), '.aws', 'credentials');
        this.configPath = path.join(os.homedir(), '.aws', 'config');
        this.profileName = process.env.AWS_PROFILE || 'default';
    }

    // credentials 파일 파싱
    parseCredentialsFile() {
        try {
            if (!fs.existsSync(this.credentialsPath)) {
                throw new Error(`AWS credentials 파일을 찾을 수 없습니다: ${this.credentialsPath}`);
            }

            const content = fs.readFileSync(this.credentialsPath, 'utf8');
            const profiles = {};
            let currentProfile = null;

            content.split('\n').forEach(line => {
                line = line.trim();
                
                if (line.startsWith('[') && line.endsWith(']')) {
                    currentProfile = line.slice(1, -1);
                    profiles[currentProfile] = {};
                } else if (line.includes('=') && currentProfile) {
                    const [key, value] = line.split('=').map(s => s.trim());
                    profiles[currentProfile][key] = value;
                }
            });

            return profiles;
        } catch (error) {
            console.error('❌ AWS credentials 파일 읽기 실패:', error.message);
            return null;
        }
    }

    // 자격 증명 가져오기
    getCredentials() {
        try {
            const profiles = this.parseCredentialsFile();
            if (!profiles || !profiles[this.profileName]) {
                throw new Error(`AWS 프로필 '${this.profileName}'을 찾을 수 없습니다`);
            }

            const profile = profiles[this.profileName];
            
            if (!profile.aws_access_key_id || !profile.aws_secret_access_key) {
                throw new Error('AWS 자격 증명이 완전하지 않습니다');
            }

            console.log(`✅ AWS 자격 증명 로드 성공 (프로필: ${this.profileName})`);
            
            return {
                accessKeyId: profile.aws_access_key_id,
                secretAccessKey: profile.aws_secret_access_key,
                region: process.env.AWS_DEFAULT_REGION || 'us-west-2'
            };
        } catch (error) {
            console.error('❌ AWS 자격 증명 가져오기 실패:', error.message);
            
            // 환경 변수 fallback
            if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
                console.log('⚠️ 환경 변수에서 AWS 자격 증명 사용');
                return {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                    region: process.env.AWS_DEFAULT_REGION || 'us-west-2'
                };
            }
            
            throw error;
        }
    }

    // AWS SDK 설정 형식으로 반환
    getAWSConfig() {
        const credentials = this.getCredentials();
        return {
            region: credentials.region,
            credentials: {
                accessKeyId: credentials.accessKeyId,
                secretAccessKey: credentials.secretAccessKey
            }
        };
    }
}

export default new AWSCredentials();
