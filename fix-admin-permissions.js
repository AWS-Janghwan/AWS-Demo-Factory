#!/usr/bin/env node

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const os = require('os');
require('dotenv').config();

// 로컬 AWS credentials 읽기 함수
const getLocalCredentials = () => {
  try {
    const credentialsPath = path.join(os.homedir(), '.aws', 'credentials');
    const profileName = process.env.AWS_PROFILE || 'default';
    
    if (!fs.existsSync(credentialsPath)) {
      throw new Error(`AWS credentials 파일을 찾을 수 없습니다: ${credentialsPath}`);
    }

    const content = fs.readFileSync(credentialsPath, 'utf8');
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

    if (!profiles[profileName]) {
      throw new Error(`AWS 프로필 '${profileName}'을 찾을 수 없습니다`);
    }

    const profile = profiles[profileName];
    
    if (!profile.aws_access_key_id || !profile.aws_secret_access_key) {
      throw new Error('AWS 자격 증명이 완전하지 않습니다');
    }

    console.log(`✅ AWS 자격 증명 로드 성공 (프로필: ${profileName})`);
    
    return {
      accessKeyId: profile.aws_access_key_id,
      secretAccessKey: profile.aws_secret_access_key,
      region: 'us-west-2' // Cognito는 us-west-2 리전 사용
    };
  } catch (error) {
    console.error('❌ AWS 자격 증명 가져오기 실패:', error.message);
    
    // 환경 변수 fallback
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      console.log('⚠️ 환경 변수에서 AWS 자격 증명 사용');
      return {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: 'us-west-2'
      };
    }
    
    throw error;
  }
};

// AWS 설정 (로컬 credentials 사용)
const credentials = getLocalCredentials();
AWS.config.update({
  region: credentials.region,
  accessKeyId: credentials.accessKeyId,
  secretAccessKey: credentials.secretAccessKey
});

const cognito = new AWS.CognitoIdentityServiceProvider();
const USER_POOL_ID = process.env.REACT_APP_COGNITO_USER_POOL_ID;

async function createUserGroups() {
  try {
    console.log('👥 사용자 그룹 생성 중...');

    const groups = [
      {
        GroupName: 'Admin',
        Description: '시스템 관리자 - 모든 권한',
        Precedence: 1
      },
      {
        GroupName: 'ContentManager',
        Description: '콘텐츠 관리자 - 콘텐츠 작성/수정/삭제',
        Precedence: 2
      },
      {
        GroupName: 'AssociateMember',
        Description: '준회원 - 콘텐츠 작성',
        Precedence: 3
      },
      {
        GroupName: 'Viewer',
        Description: '일반 사용자 - 콘텐츠 조회',
        Precedence: 4
      }
    ];

    for (const group of groups) {
      try {
        await cognito.createGroup({
          UserPoolId: USER_POOL_ID,
          ...group
        }).promise();
        console.log(`✅ 그룹 생성 완료: ${group.GroupName}`);
      } catch (error) {
        if (error.code === 'GroupExistsException') {
          console.log(`⚠️ 그룹이 이미 존재합니다: ${group.GroupName}`);
        } else {
          console.error(`❌ 그룹 생성 실패 (${group.GroupName}):`, error.message);
        }
      }
    }

  } catch (error) {
    console.error('❌ 그룹 생성 중 오류:', error);
    throw error;
  }
}

async function addUserToAdminGroup(username) {
  try {
    console.log(`🔐 사용자를 Admin 그룹에 추가 중: ${username}`);

    // 먼저 사용자가 존재하는지 확인
    try {
      await cognito.adminGetUser({
        UserPoolId: USER_POOL_ID,
        Username: username
      }).promise();
      console.log(`✅ 사용자 확인 완료: ${username}`);
    } catch (error) {
      if (error.code === 'UserNotFoundException') {
        console.error(`❌ 사용자를 찾을 수 없습니다: ${username}`);
        console.log('💡 먼저 해당 이메일로 회원가입을 진행하세요.');
        return false;
      }
      throw error;
    }

    // Admin 그룹에 추가
    await cognito.adminAddUserToGroup({
      UserPoolId: USER_POOL_ID,
      Username: username,
      GroupName: 'Admin'
    }).promise();

    console.log(`✅ ${username}을 Admin 그룹에 추가 완료!`);
    return true;

  } catch (error) {
    console.error(`❌ 사용자 그룹 추가 실패:`, error.message);
    return false;
  }
}

async function checkUserGroups(username) {
  try {
    console.log(`🔍 사용자 그룹 확인 중: ${username}`);

    const result = await cognito.adminListGroupsForUser({
      UserPoolId: USER_POOL_ID,
      Username: username
    }).promise();

    console.log(`📋 ${username}의 현재 그룹:`);
    if (result.Groups.length === 0) {
      console.log('  - 할당된 그룹이 없습니다');
    } else {
      result.Groups.forEach(group => {
        console.log(`  - ${group.GroupName} (우선순위: ${group.Precedence})`);
      });
    }

    return result.Groups;

  } catch (error) {
    console.error(`❌ 사용자 그룹 확인 실패:`, error.message);
    return [];
  }
}

async function listAllUsers() {
  try {
    console.log('👥 모든 사용자 목록 조회 중...');

    const result = await cognito.listUsers({
      UserPoolId: USER_POOL_ID
    }).promise();

    console.log(`📋 총 ${result.Users.length}명의 사용자:`);
    result.Users.forEach(user => {
      const email = user.Attributes.find(attr => attr.Name === 'email')?.Value;
      const name = user.Attributes.find(attr => attr.Name === 'name')?.Value;
      console.log(`  - ${user.Username} (${email}) - ${name || 'N/A'}`);
    });

    return result.Users;

  } catch (error) {
    console.error(`❌ 사용자 목록 조회 실패:`, error.message);
    return [];
  }
}

async function main() {
  try {
    console.log('🚀 Admin 권한 수정 스크립트 시작');
    console.log(`📍 User Pool ID: ${USER_POOL_ID}`);
    console.log('');

    // 1. 그룹 생성 (이미 존재하면 스킵)
    await createUserGroups();
    console.log('');

    // 2. 모든 사용자 목록 확인
    await listAllUsers();
    console.log('');

    // 3. janghwan@amazon.com 사용자 그룹 확인
    const targetUser = 'janghwan@amazon.com';
    const currentGroups = await checkUserGroups(targetUser);
    console.log('');

    // 4. Admin 그룹에 추가 (아직 없다면)
    const isAdmin = currentGroups.some(group => group.GroupName === 'Admin');
    if (!isAdmin) {
      console.log(`🔧 ${targetUser}을 Admin 그룹에 추가합니다...`);
      const success = await addUserToAdminGroup(targetUser);
      
      if (success) {
        console.log('');
        console.log('✅ 권한 수정 완료!');
        console.log('🔄 브라우저에서 로그아웃 후 다시 로그인하세요.');
      }
    } else {
      console.log(`✅ ${targetUser}은 이미 Admin 그룹에 속해 있습니다.`);
    }

  } catch (error) {
    console.error('❌ 스크립트 실행 중 오류:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = { createUserGroups, addUserToAdminGroup, checkUserGroups, listAllUsers };
