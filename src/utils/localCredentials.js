// 브라우저용 AWS Credentials 관리
// 브라우저에서는 파일 시스템에 직접 접근할 수 없으므로 환경 변수를 사용

class LocalCredentialsService {
    constructor() {
        console.log('🔧 [LocalCredentials] 브라우저용 AWS Credentials 서비스 초기화');
    }

    async getCredentials(profileName = 'default') {
        try {
            console.log(`🔐 [LocalCredentials] ${profileName} 프로필 자격 증명 가져오는 중...`);
            
            // 환경 변수에서 자격 증명 가져오기
            const credentials = {
                accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
                sessionToken: process.env.REACT_APP_AWS_SESSION_TOKEN,
                region: process.env.REACT_APP_AWS_REGION || 'us-west-2'
            };

            // 자격 증명 유효성 검사
            if (!credentials.accessKeyId || !credentials.secretAccessKey) {
                throw new Error('환경 변수에 AWS 자격 증명이 설정되지 않았습니다. REACT_APP_AWS_ACCESS_KEY_ID와 REACT_APP_AWS_SECRET_ACCESS_KEY를 설정해주세요.');
            }

            console.log('✅ [LocalCredentials] AWS 자격 증명 가져오기 성공:', {
                region: credentials.region,
                hasAccessKey: !!credentials.accessKeyId,
                hasSecretKey: !!credentials.secretAccessKey,
                hasSessionToken: !!credentials.sessionToken
            });

            return credentials;
        } catch (error) {
            console.error('❌ [LocalCredentials] 자격 증명 가져오기 실패:', error);
            throw error;
        }
    }

    async getCredentialsForService(serviceName, profileName = 'default') {
        try {
            const credentials = await this.getCredentials(profileName);
            
            // AWS SDK v2 형식으로 반환
            const config = {
                region: credentials.region,
                accessKeyId: credentials.accessKeyId,
                secretAccessKey: credentials.secretAccessKey
            };

            // STS 토큰이 있는 경우 추가
            if (credentials.sessionToken) {
                config.sessionToken = credentials.sessionToken;
            }

            console.log(`✅ [LocalCredentials] ${serviceName} 서비스용 자격 증명 설정 완료`);
            return config;
        } catch (error) {
            console.error(`❌ [LocalCredentials] ${serviceName} 자격 증명 설정 실패:`, error);
            throw error;
        }
    }

    // 브라우저에서는 파일 시스템 접근이 불가능하므로 기본 프로필만 반환
    getAvailableProfiles() {
        return ['default'];
    }
}

// 단일 인스턴스로 내보내기
const localCredentialsService = new LocalCredentialsService();

// named export로 변경
export const getLocalCredentials = (profileName = 'default') => {
    return localCredentialsService.getCredentials(profileName);
};

export const getCredentialsForService = (serviceName, profileName = 'default') => {
    return localCredentialsService.getCredentialsForService(serviceName, profileName);
};

export const getAvailableProfiles = () => {
    return localCredentialsService.getAvailableProfiles();
};

// default export도 유지 (호환성)
export default localCredentialsService;
