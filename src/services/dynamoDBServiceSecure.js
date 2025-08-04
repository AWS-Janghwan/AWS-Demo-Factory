import AWS from 'aws-sdk';
import awsCredentials from '../utils/awsCredentials.js';

// AWS DynamoDB 설정 (로컬 credentials 사용)
let dynamodb = null;
const TABLE_NAME = process.env.REACT_APP_DYNAMODB_TABLE || 'DemoFactoryContents';

// DynamoDB 클라이언트 초기화
const initializeDynamoDB = () => {
  if (dynamodb) return dynamodb;

  try {
    console.log('🔐 DynamoDB 클라이언트 초기화 중...');
    
    // 로컬 credentials에서 AWS 설정 가져오기
    const credentials = awsCredentials.getCredentials();
    
    AWS.config.update({
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      region: credentials.region
    });

    dynamodb = new AWS.DynamoDB.DocumentClient();
    
    console.log('✅ DynamoDB 설정 완료:', {
      region: credentials.region,
      tableName: TABLE_NAME
    });
    
    return dynamodb;
  } catch (error) {
    console.error('❌ DynamoDB 초기화 실패:', error);
    throw error;
  }
};

// 모든 콘텐츠 조회
export const getAllContents = async () => {
  try {
    const db = initializeDynamoDB();
    
    const params = {
      TableName: TABLE_NAME
    };

    console.log('📋 모든 콘텐츠 조회 중...');
    const result = await db.scan(params).promise();
    console.log(`✅ ${result.Items.length}개 콘텐츠 조회 완료`);
    
    return result.Items || [];
  } catch (error) {
    console.error('❌ getAllContents 오류:', error);
    throw error;
  }
};

// ID로 콘텐츠 조회
export const getContentById = async (id) => {
  try {
    const db = initializeDynamoDB();
    
    const params = {
      TableName: TABLE_NAME,
      Key: { id }
    };

    console.log(`📄 콘텐츠 조회 중 (ID: ${id})`);
    const result = await db.get(params).promise();
    
    if (result.Item) {
      console.log('✅ 콘텐츠 조회 성공');
      return result.Item;
    } else {
      console.log('⚠️ 콘텐츠를 찾을 수 없음');
      return null;
    }
  } catch (error) {
    console.error('❌ getContentById 오류:', error);
    throw error;
  }
};

// 콘텐츠 생성
export const createContent = async (content) => {
  try {
    const db = initializeDynamoDB();
    
    const item = {
      ...content,
      id: content.id || Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const params = {
      TableName: TABLE_NAME,
      Item: item
    };

    console.log('📝 새 콘텐츠 생성 중...');
    await db.put(params).promise();
    console.log('✅ 콘텐츠 생성 성공');
    
    return item;
  } catch (error) {
    console.error('❌ createContent 오류:', error);
    throw error;
  }
};

// 콘텐츠 업데이트
export const updateContent = async (id, updates) => {
  try {
    const db = initializeDynamoDB();
    
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.keys(updates).forEach((key, index) => {
      const attrName = `#attr${index}`;
      const attrValue = `:val${index}`;
      
      updateExpression.push(`${attrName} = ${attrValue}`);
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = updates[key];
    });

    // updatedAt 추가
    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const params = {
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    console.log(`📝 콘텐츠 업데이트 중 (ID: ${id})`);
    const result = await db.update(params).promise();
    console.log('✅ 콘텐츠 업데이트 성공');
    
    // 캐시 무횤화 (콘텐츠 목록 캐시 무효화)
    try {
      localStorage.removeItem('demo-factory-s3-files');
      console.log('🧹 콘텐츠 업데이트 후 캐시 무효화 완료');
    } catch (cacheError) {
      console.warn('⚠️ 캐시 삭제 실패 (무시 가능):', cacheError);
    }
    
    return result.Attributes;
  } catch (error) {
    console.error('❌ updateContent 오류:', error);
    throw error;
  }
};

// 콘텐츠 삭제
export const deleteContent = async (id) => {
  try {
    const db = initializeDynamoDB();
    
    const params = {
      TableName: TABLE_NAME,
      Key: { id }
    };

    console.log(`🗑️ 콘텐츠 삭제 중 (ID: ${id})`);
    await db.delete(params).promise();
    console.log('✅ 콘텐츠 삭제 성공');
    
    // 캐시 삭제 (콘텐츠 목록 캐시 무효화)
    try {
      localStorage.removeItem('demo-factory-s3-files');
      console.log('🧹 콘텐츠 삭제 후 캐시 무효화 완료');
    } catch (cacheError) {
      console.warn('⚠️ 캐시 삭제 실패 (무시 가능):', cacheError);
    }
    
    return true;
  } catch (error) {
    console.error('❌ deleteContent 오류:', error);
    throw error;
  }
};
