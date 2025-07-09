import AWS from 'aws-sdk';

// AWS DynamoDB 설정
AWS.config.update({
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  region: process.env.REACT_APP_AWS_REGION
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.REACT_APP_DYNAMODB_TABLE || 'DemoFactoryContents';

console.log('🔧 [DynamoDB] 설정 완료:', {
  region: process.env.REACT_APP_AWS_REGION,
  tableName: TABLE_NAME
});

// 모든 콘텐츠 조회
export const getAllContents = async () => {
  try {
    console.log('📋 [DynamoDB] 모든 콘텐츠 조회 시작...');
    
    const params = {
      TableName: TABLE_NAME
    };
    
    const result = await dynamodb.scan(params).promise();
    console.log('✅ [DynamoDB] 콘텐츠 조회 성공:', result.Items?.length || 0, '개');
    
    return result.Items || [];
  } catch (error) {
    console.error('❌ [DynamoDB] 콘텐츠 조회 실패:', error);
    throw error;
  }
};

// 콘텐츠 저장
export const saveContent = async (content) => {
  try {
    console.log('💾 [DynamoDB] 콘텐츠 저장 시작:', content.id);
    
    const params = {
      TableName: TABLE_NAME,
      Item: {
        ...content,
        createdAt: content.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
    
    await dynamodb.put(params).promise();
    console.log('✅ [DynamoDB] 콘텐츠 저장 성공:', content.id);
    
    return content;
  } catch (error) {
    console.error('❌ [DynamoDB] 콘텐츠 저장 실패:', error);
    throw error;
  }
};

// 콘텐츠 업데이트
export const updateContent = async (id, updates) => {
  try {
    console.log('🔄 [DynamoDB] 콘텐츠 업데이트 시작:', id);
    
    // Primary Key와 시스템 필드들을 제외한 업데이트 객체 생성
    const { id: excludeId, createdAt, ...safeUpdates } = updates;
    
    // updatedAt을 safeUpdates에 추가 (중복 방지)
    const allUpdates = {
      ...safeUpdates,
      updatedAt: new Date().toISOString()
    };
    
    console.log('🔍 [DynamoDB] 안전한 업데이트 필드들:', Object.keys(allUpdates));
    
    const params = {
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: 'SET',
      ExpressionAttributeValues: {},
      ExpressionAttributeNames: {}, // 예약어 처리용
      ReturnValues: 'ALL_NEW'
    };
    
    // 업데이트할 필드들 추가 (예약어 처리)
    const updateExpressions = [];
    Object.keys(allUpdates).forEach((key, index) => {
      const attributeName = `#attr${index}`;
      const valueName = `:val${index}`;
      
      // ExpressionAttributeNames에 실제 필드명 매핑
      params.ExpressionAttributeNames[attributeName] = key;
      params.ExpressionAttributeValues[valueName] = allUpdates[key];
      
      // UpdateExpression 구문 추가
      updateExpressions.push(`${attributeName} = ${valueName}`);
    });
    
    // 모든 SET 구문을 하나로 결합
    params.UpdateExpression = 'SET ' + updateExpressions.join(', ');
    
    console.log('🔍 [DynamoDB] 업데이트 파라미터:', {
      UpdateExpression: params.UpdateExpression,
      ExpressionAttributeNames: params.ExpressionAttributeNames,
      ExpressionAttributeValues: Object.keys(params.ExpressionAttributeValues).reduce((acc, key) => {
        acc[key] = typeof params.ExpressionAttributeValues[key] === 'object' ? '[Object]' : params.ExpressionAttributeValues[key];
        return acc;
      }, {})
    });
    
    const result = await dynamodb.update(params).promise();
    console.log('✅ [DynamoDB] 콘텐츠 업데이트 성공:', id);
    
    return result.Attributes;
  } catch (error) {
    console.error('❌ [DynamoDB] 콘텐츠 업데이트 실패:', error);
    throw error;
  }
};

// 콘텐츠 삭제
export const deleteContent = async (id) => {
  try {
    console.log('🗑️ [DynamoDB] 콘텐츠 삭제 시작:', id);
    
    const params = {
      TableName: TABLE_NAME,
      Key: { id }
    };
    
    await dynamodb.delete(params).promise();
    console.log('✅ [DynamoDB] 콘텐츠 삭제 성공:', id);
    
    return true;
  } catch (error) {
    console.error('❌ [DynamoDB] 콘텐츠 삭제 실패:', error);
    throw error;
  }
};

// ID로 콘텐츠 조회
export const getContentById = async (id) => {
  try {
    console.log('🔍 [DynamoDB] 콘텐츠 조회 시작:', id);
    
    const params = {
      TableName: TABLE_NAME,
      Key: { id }
    };
    
    const result = await dynamodb.get(params).promise();
    console.log('✅ [DynamoDB] 콘텐츠 조회 성공:', id);
    
    return result.Item;
  } catch (error) {
    console.error('❌ [DynamoDB] 콘텐츠 조회 실패:', error);
    throw error;
  }
};

// 카테고리별 콘텐츠 조회
export const getContentsByCategory = async (category) => {
  try {
    console.log('📂 [DynamoDB] 카테고리별 콘텐츠 조회 시작:', category);
    
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: 'category = :category',
      ExpressionAttributeValues: {
        ':category': category
      }
    };
    
    const result = await dynamodb.scan(params).promise();
    console.log('✅ [DynamoDB] 카테고리별 콘텐츠 조회 성공:', result.Items?.length || 0, '개');
    
    return result.Items || [];
  } catch (error) {
    console.error('❌ [DynamoDB] 카테고리별 콘텐츠 조회 실패:', error);
    throw error;
  }
};

const dynamoDBService = {
  getAllContents,
  saveContent,
  updateContent,
  deleteContent,
  getContentById,
  getContentsByCategory
};

export default dynamoDBService;
