#!/usr/bin/env node

const AWS = require('aws-sdk');
const fs = require('fs');
require('dotenv').config();

// AWS 설정
AWS.config.update({
  region: 'us-west-2', // Cognito는 us-west-2 리전 사용
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const cognito = new AWS.CognitoIdentityServiceProvider();
const cognitoIdentity = new AWS.CognitoIdentity();

const USER_POOL_NAME = 'aws-demo-factory-users';
const USER_POOL_CLIENT_NAME = 'aws-demo-factory-client';
const IDENTITY_POOL_NAME = 'aws-demo-factory-identity-pool';

async function createUserPool() {
  try {
    console.log('🔐 Cognito User Pool 생성 중...');

    const userPoolParams = {
      PoolName: USER_POOL_NAME,
      Policies: {
        PasswordPolicy: {
          MinimumLength: 8,
          RequireUppercase: false,
          RequireLowercase: false,
          RequireNumbers: false,
          RequireSymbols: false,
          TemporaryPasswordValidityDays: 7
        }
      },
      AutoVerifiedAttributes: ['email'],
      UsernameAttributes: ['email'],
      UsernameConfiguration: {
        CaseSensitive: false
      },
      Schema: [
        {
          Name: 'email',
          AttributeDataType: 'String',
          Required: true,
          Mutable: true
        },
        {
          Name: 'name',
          AttributeDataType: 'String',
          Required: false,
          Mutable: true
        },
        {
          Name: 'custom:role',
          AttributeDataType: 'String',
          Required: false,
          Mutable: true
        },
        {
          Name: 'custom:department',
          AttributeDataType: 'String',
          Required: false,
          Mutable: true
        }
      ],
      VerificationMessageTemplate: {
        DefaultEmailOption: 'CONFIRM_WITH_CODE',
        EmailMessage: 'AWS Demo Factory 가입을 환영합니다! 인증 코드: {####}',
        EmailSubject: 'AWS Demo Factory 이메일 인증'
      },
      EmailConfiguration: {
        EmailSendingAccount: 'COGNITO_DEFAULT'
      },
      AdminCreateUserConfig: {
        AllowAdminCreateUserOnly: false,
        InviteMessageTemplate: {
          EmailMessage: 'AWS Demo Factory에 초대되었습니다. 사용자명: {username}, 임시 비밀번호: {####}',
          EmailSubject: 'AWS Demo Factory 초대'
        }
      },
      UserPoolTags: {
        Project: 'AWS-Demo-Factory',
        Environment: 'Development'
      }
    };

    const userPool = await cognito.createUserPool(userPoolParams).promise();
    const userPoolId = userPool.UserPool.Id;
    
    console.log(`✅ User Pool 생성 완료: ${userPoolId}`);

    // User Pool Client 생성
    console.log('📱 User Pool Client 생성 중...');
    
    const clientParams = {
      UserPoolId: userPoolId,
      ClientName: USER_POOL_CLIENT_NAME,
      GenerateSecret: false, // 웹 애플리케이션이므로 secret 없음
      ExplicitAuthFlows: [
        'ALLOW_USER_SRP_AUTH',
        'ALLOW_USER_PASSWORD_AUTH',
        'ALLOW_REFRESH_TOKEN_AUTH'
      ],
      SupportedIdentityProviders: ['COGNITO'],
      CallbackURLs: ['http://localhost:3000'],
      LogoutURLs: ['http://localhost:3000'],
      AllowedOAuthFlows: ['code'],
      AllowedOAuthScopes: ['email', 'openid', 'profile'],
      AllowedOAuthFlowsUserPoolClient: true,
      PreventUserExistenceErrors: 'ENABLED',
      EnableTokenRevocation: true,
      TokenValidityUnits: {
        AccessToken: 'hours',
        IdToken: 'hours',
        RefreshToken: 'days'
      },
      AccessTokenValidity: 24,
      IdTokenValidity: 24,
      RefreshTokenValidity: 30
    };

    const client = await cognito.createUserPoolClient(clientParams).promise();
    const clientId = client.UserPoolClient.ClientId;
    
    console.log(`✅ User Pool Client 생성 완료: ${clientId}`);

    return { userPoolId, clientId };

  } catch (error) {
    if (error.code === 'ResourceConflictException') {
      console.log('⚠️ User Pool이 이미 존재합니다. 기존 정보를 조회합니다...');
      return await getExistingUserPool();
    }
    console.error('❌ User Pool 생성 실패:', error);
    throw error;
  }
}

async function getExistingUserPool() {
  try {
    const pools = await cognito.listUserPools({ MaxResults: 50 }).promise();
    const existingPool = pools.UserPools.find(pool => pool.Name === USER_POOL_NAME);
    
    if (!existingPool) {
      throw new Error('기존 User Pool을 찾을 수 없습니다.');
    }

    const userPoolId = existingPool.Id;
    console.log(`📋 기존 User Pool 발견: ${userPoolId}`);

    // Client 조회
    const clients = await cognito.listUserPoolClients({ UserPoolId: userPoolId }).promise();
    const existingClient = clients.UserPoolClients.find(client => client.ClientName === USER_POOL_CLIENT_NAME);
    
    if (!existingClient) {
      throw new Error('기존 User Pool Client를 찾을 수 없습니다.');
    }

    const clientId = existingClient.ClientId;
    console.log(`📋 기존 User Pool Client 발견: ${clientId}`);

    return { userPoolId, clientId };
  } catch (error) {
    console.error('❌ 기존 User Pool 조회 실패:', error);
    throw error;
  }
}

async function updateIdentityPool(userPoolId, clientId) {
  try {
    console.log('🆔 Identity Pool 업데이트 중...');

    const identityPoolId = process.env.REACT_APP_COGNITO_IDENTITY_POOL_ID;
    
    const updateParams = {
      IdentityPoolId: identityPoolId,
      IdentityPoolName: IDENTITY_POOL_NAME,
      AllowUnauthenticatedIdentities: false,
      CognitoIdentityProviders: [
        {
          ProviderName: `cognito-idp.us-west-2.amazonaws.com/${userPoolId}`,
          ClientId: clientId,
          ServerSideTokenCheck: false
        }
      ]
    };

    await cognitoIdentity.updateIdentityPool(updateParams).promise();
    console.log(`✅ Identity Pool 업데이트 완료: ${identityPoolId}`);

    return identityPoolId;
  } catch (error) {
    console.error('❌ Identity Pool 업데이트 실패:', error);
    throw error;
  }
}

async function createDefaultUsers(userPoolId) {
  try {
    console.log('👥 기본 사용자 계정 생성 중...');

    const defaultUsers = [
      {
        username: 'admin@aws-demo-factory.com',
        email: 'admin@aws-demo-factory.com',
        name: 'Demo Factory Admin',
        role: 'Admin',
        department: 'AWS',
        temporaryPassword: 'TempPass123!'
      },
      {
        username: 'manager@aws-demo-factory.com',
        email: 'manager@aws-demo-factory.com',
        name: 'Content Manager',
        role: 'Content Manager',
        department: 'AWS',
        temporaryPassword: 'TempPass123!'
      },
      {
        username: 'user@aws-demo-factory.com',
        email: 'user@aws-demo-factory.com',
        name: 'Demo User',
        role: 'Viewer',
        department: 'AWS',
        temporaryPassword: 'TempPass123!'
      }
    ];

    for (const user of defaultUsers) {
      try {
        const createParams = {
          UserPoolId: userPoolId,
          Username: user.username,
          UserAttributes: [
            { Name: 'email', Value: user.email },
            { Name: 'name', Value: user.name },
            { Name: 'custom:role', Value: user.role },
            { Name: 'custom:department', Value: user.department },
            { Name: 'email_verified', Value: 'true' }
          ],
          TemporaryPassword: user.temporaryPassword,
          MessageAction: 'SUPPRESS' // 이메일 발송 안함
        };

        await cognito.adminCreateUser(createParams).promise();
        
        // 비밀번호를 영구적으로 설정
        await cognito.adminSetUserPassword({
          UserPoolId: userPoolId,
          Username: user.username,
          Password: user.temporaryPassword,
          Permanent: true
        }).promise();

        console.log(`✅ 사용자 생성 완료: ${user.username} (${user.role})`);
      } catch (error) {
        if (error.code === 'UsernameExistsException') {
          console.log(`⚠️ 사용자가 이미 존재합니다: ${user.username}`);
        } else {
          console.error(`❌ 사용자 생성 실패 (${user.username}):`, error.message);
        }
      }
    }
  } catch (error) {
    console.error('❌ 기본 사용자 생성 실패:', error);
  }
}

async function updateEnvFile(userPoolId, clientId, identityPoolId) {
  try {
    console.log('📝 환경 변수 파일 업데이트 중...');

    let envContent = fs.readFileSync('.env', 'utf8');
    
    // User Pool ID 업데이트
    if (envContent.includes('REACT_APP_COGNITO_USER_POOL_ID=')) {
      envContent = envContent.replace(
        /REACT_APP_COGNITO_USER_POOL_ID=.*/,
        `REACT_APP_COGNITO_USER_POOL_ID=${userPoolId}`
      );
    } else {
      envContent += `\nREACT_APP_COGNITO_USER_POOL_ID=${userPoolId}`;
    }

    // Client ID 업데이트
    if (envContent.includes('REACT_APP_COGNITO_USER_POOL_CLIENT_ID=')) {
      envContent = envContent.replace(
        /REACT_APP_COGNITO_USER_POOL_CLIENT_ID=.*/,
        `REACT_APP_COGNITO_USER_POOL_CLIENT_ID=${clientId}`
      );
    } else {
      envContent += `\nREACT_APP_COGNITO_USER_POOL_CLIENT_ID=${clientId}`;
    }

    fs.writeFileSync('.env', envContent);
    console.log('✅ 환경 변수 파일 업데이트 완료');
  } catch (error) {
    console.error('❌ 환경 변수 파일 업데이트 실패:', error);
  }
}

async function main() {
  try {
    console.log('🚀 AWS Cognito 설정 시작\n');

    // 1. User Pool 생성
    const { userPoolId, clientId } = await createUserPool();
    console.log();

    // 2. Identity Pool 업데이트
    const identityPoolId = await updateIdentityPool(userPoolId, clientId);
    console.log();

    // 3. 기본 사용자 생성
    await createDefaultUsers(userPoolId);
    console.log();

    // 4. 환경 변수 파일 업데이트
    await updateEnvFile(userPoolId, clientId, identityPoolId);
    console.log();

    console.log('🎉 AWS Cognito 설정 완료!');
    console.log(`
📋 Cognito 정보:
  - User Pool ID: ${userPoolId}
  - Client ID: ${clientId}
  - Identity Pool ID: ${identityPoolId}
  - Region: us-west-2

👥 기본 계정 정보:
  - 관리자: admin@aws-demo-factory.com / TempPass123!
  - 매니저: manager@aws-demo-factory.com / TempPass123!
  - 사용자: user@aws-demo-factory.com / TempPass123!

🎯 다음 단계:
  1. AuthContext 업데이트
  2. 로그인 컴포넌트 수정
  3. 앱 재시작 및 테스트
    `);

  } catch (error) {
    console.error('❌ Cognito 설정 실패:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
