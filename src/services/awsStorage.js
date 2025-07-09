import AWS from 'aws-sdk';

// AWS 설정
const awsConfig = {
  region: process.env.REACT_APP_AWS_REGION || 'ap-northeast-2',
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY
};

const s3 = new AWS.S3(awsConfig);
const dynamodb = new AWS.DynamoDB.DocumentClient(awsConfig);

// 상수
const S3_BUCKET = process.env.REACT_APP_S3_BUCKET || 'aws-demo-factory';
const DYNAMODB_TABLE = process.env.REACT_APP_DYNAMODB_TABLE || 'DemoFactoryContents';

// 대용량 파일 업로드 (Multipart Upload 지원)
export const uploadLargeFile = async (file, onProgress = () => {}) => {
  try {
    const key = `contents/${Date.now()}-${file.name}`;
    
    const params = {
      Bucket: S3_BUCKET,
      Key: key,
      Body: file,
      ContentType: file.type,
      Metadata: {
        'original-name': file.name,
        'upload-timestamp': new Date().toISOString()
      }
    };

    // 5MB 이상이면 Multipart Upload 사용
    if (file.size > 5 * 1024 * 1024) {
      return await uploadMultipart(params, onProgress);
    } else {
      return await uploadSingle(params, onProgress);
    }
  } catch (error) {
    console.error('파일 업로드 실패:', error);
    throw new Error(`파일 업로드 실패: ${error.message}`);
  }
};

// 단일 파일 업로드
const uploadSingle = async (params, onProgress) => {
  const upload = s3.upload(params);
  
  upload.on('httpUploadProgress', (progress) => {
    const percentage = Math.round((progress.loaded / progress.total) * 100);
    onProgress(percentage);
  });

  const result = await upload.promise();
  return {
    key: result.Key,
    bucket: result.Bucket,
    url: result.Location,
    size: params.Body.size
  };
};

// Multipart 업로드
const uploadMultipart = async (params, onProgress) => {
  const chunkSize = 5 * 1024 * 1024; // 5MB chunks
  const file = params.Body;
  const totalChunks = Math.ceil(file.size / chunkSize);
  
  // Multipart upload 시작
  const createParams = {
    Bucket: params.Bucket,
    Key: params.Key,
    ContentType: params.ContentType,
    Metadata: params.Metadata
  };
  
  const multipart = await s3.createMultipartUpload(createParams).promise();
  const uploadId = multipart.UploadId;
  
  try {
    const uploadPromises = [];
    let uploadedBytes = 0;
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      
      const partParams = {
        Bucket: params.Bucket,
        Key: params.Key,
        PartNumber: i + 1,
        UploadId: uploadId,
        Body: chunk
      };
      
      const uploadPromise = s3.uploadPart(partParams).promise().then(result => {
        uploadedBytes += chunk.size;
        const percentage = Math.round((uploadedBytes / file.size) * 100);
        onProgress(percentage);
        
        return {
          ETag: result.ETag,
          PartNumber: i + 1
        };
      });
      
      uploadPromises.push(uploadPromise);
    }
    
    const parts = await Promise.all(uploadPromises);
    
    // Multipart upload 완료
    const completeParams = {
      Bucket: params.Bucket,
      Key: params.Key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber)
      }
    };
    
    const result = await s3.completeMultipartUpload(completeParams).promise();
    
    return {
      key: result.Key,
      bucket: result.Bucket,
      url: result.Location,
      size: file.size
    };
    
  } catch (error) {
    // 실패 시 Multipart upload 중단
    await s3.abortMultipartUpload({
      Bucket: params.Bucket,
      Key: params.Key,
      UploadId: uploadId
    }).promise();
    
    throw error;
  }
};

// 스트리밍 URL 생성 (대용량 파일용)
export const getStreamingUrl = (s3Key, expiresIn = 3600) => {
  return s3.getSignedUrl('getObject', {
    Bucket: S3_BUCKET,
    Key: s3Key,
    Expires: expiresIn
  });
};

// 파일 삭제
export const deleteFileFromS3 = async (s3Key) => {
  try {
    await s3.deleteObject({
      Bucket: S3_BUCKET,
      Key: s3Key
    }).promise();
    
    console.log(`S3 파일 삭제 완료: ${s3Key}`);
  } catch (error) {
    console.error('S3 파일 삭제 실패:', error);
    throw error;
  }
};

// DynamoDB에 메타데이터 저장
export const saveContentMetadata = async (contentData) => {
  try {
    const item = {
      ...contentData,
      id: contentData.id || `content-${Date.now()}`,
      createdAt: contentData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // GSI를 위한 추가 필드
      categoryCreatedAt: `${contentData.category}#${contentData.createdAt || new Date().toISOString()}`,
      authorCreatedAt: `${contentData.author}#${contentData.createdAt || new Date().toISOString()}`
    };

    const params = {
      TableName: DYNAMODB_TABLE,
      Item: item
    };

    await dynamodb.put(params).promise();
    return item;
  } catch (error) {
    console.error('DynamoDB 저장 실패:', error);
    throw new Error(`메타데이터 저장 실패: ${error.message}`);
  }
};

// DynamoDB에서 모든 콘텐츠 조회
export const getAllContentsFromDynamoDB = async () => {
  try {
    const params = {
      TableName: DYNAMODB_TABLE
    };

    const result = await dynamodb.scan(params).promise();
    return result.Items || [];
  } catch (error) {
    console.error('DynamoDB 조회 실패:', error);
    throw new Error(`콘텐츠 조회 실패: ${error.message}`);
  }
};

// 카테고리별 콘텐츠 조회
export const getContentsByCategory = async (category) => {
  try {
    const params = {
      TableName: DYNAMODB_TABLE,
      FilterExpression: 'category = :category',
      ExpressionAttributeValues: {
        ':category': category
      }
    };

    const result = await dynamodb.scan(params).promise();
    return result.Items || [];
  } catch (error) {
    console.error('카테고리별 조회 실패:', error);
    throw error;
  }
};

// 특정 콘텐츠 조회
export const getContentById = async (id) => {
  try {
    const params = {
      TableName: DYNAMODB_TABLE,
      Key: { id }
    };

    const result = await dynamodb.get(params).promise();
    return result.Item;
  } catch (error) {
    console.error('콘텐츠 조회 실패:', error);
    throw error;
  }
};

// 콘텐츠 업데이트
export const updateContentMetadata = async (id, updates) => {
  try {
    const updateExpression = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    Object.keys(updates).forEach(key => {
      if (key !== 'id') {
        updateExpression.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = updates[key];
      }
    });

    // updatedAt 자동 추가
    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const params = {
      TableName: DYNAMODB_TABLE,
      Key: { id },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamodb.update(params).promise();
    return result.Attributes;
  } catch (error) {
    console.error('콘텐츠 업데이트 실패:', error);
    throw error;
  }
};

// 콘텐츠 삭제
export const deleteContentFromDynamoDB = async (id) => {
  try {
    // 먼저 콘텐츠 정보 조회하여 S3 파일들 확인
    const content = await getContentById(id);
    
    if (content && content.files) {
      // S3 파일들 삭제
      for (const file of content.files) {
        if (file.s3Key) {
          await deleteFileFromS3(file.s3Key);
        }
      }
    }

    // DynamoDB에서 메타데이터 삭제
    const params = {
      TableName: DYNAMODB_TABLE,
      Key: { id }
    };

    await dynamodb.delete(params).promise();
    console.log(`콘텐츠 삭제 완료: ${id}`);
  } catch (error) {
    console.error('콘텐츠 삭제 실패:', error);
    throw error;
  }
};

// 조회수 증가
export const incrementViews = async (id) => {
  try {
    const params = {
      TableName: DYNAMODB_TABLE,
      Key: { id },
      UpdateExpression: 'ADD #views :increment',
      ExpressionAttributeNames: {
        '#views': 'views'
      },
      ExpressionAttributeValues: {
        ':increment': 1
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamodb.update(params).promise();
    return result.Attributes;
  } catch (error) {
    console.error('조회수 증가 실패:', error);
    throw error;
  }
};

// 좋아요 토글
export const toggleLike = async (id, userId) => {
  try {
    // 현재 콘텐츠 정보 조회
    const content = await getContentById(id);
    if (!content) {
      throw new Error('콘텐츠를 찾을 수 없습니다.');
    }

    const likedBy = content.likedBy || [];
    const isLiked = likedBy.includes(userId);
    
    let updateExpression;
    let expressionAttributeValues;
    
    if (isLiked) {
      // 좋아요 제거
      const newLikedBy = likedBy.filter(id => id !== userId);
      updateExpression = 'SET likedBy = :likedBy, likes = :likes';
      expressionAttributeValues = {
        ':likedBy': newLikedBy,
        ':likes': Math.max(0, (content.likes || 0) - 1)
      };
    } else {
      // 좋아요 추가
      const newLikedBy = [...likedBy, userId];
      updateExpression = 'SET likedBy = :likedBy, likes = :likes';
      expressionAttributeValues = {
        ':likedBy': newLikedBy,
        ':likes': (content.likes || 0) + 1
      };
    }

    const params = {
      TableName: DYNAMODB_TABLE,
      Key: { id },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamodb.update(params).promise();
    return result.Attributes;
  } catch (error) {
    console.error('좋아요 토글 실패:', error);
    throw error;
  }
};

// AWS 연결 테스트
export const testAWSConnection = async () => {
  try {
    // S3 연결 테스트
    await s3.headBucket({ Bucket: S3_BUCKET }).promise();
    console.log('✅ S3 연결 성공');

    // DynamoDB 연결 테스트
    await dynamodb.describeTable({ TableName: DYNAMODB_TABLE }).promise();
    console.log('✅ DynamoDB 연결 성공');

    return { success: true, message: 'AWS 서비스 연결 성공' };
  } catch (error) {
    console.error('❌ AWS 연결 실패:', error);
    return { success: false, message: error.message };
  }
};

const awsStorageService = {
  uploadLargeFile,
  getStreamingUrl,
  deleteFileFromS3,
  saveContentMetadata,
  getAllContentsFromDynamoDB,
  getContentsByCategory,
  getContentById,
  updateContentMetadata,
  deleteContentFromDynamoDB,
  incrementViews,
  toggleLike,
  testAWSConnection
};

export default awsStorageService;
