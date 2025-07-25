import React, { useState } from 'react';
import { Button, Box, Typography, Alert } from '@mui/material';
import { getAllContents } from '../services/dynamoDBServiceSecure';

const DynamoDBTest = () => {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testDynamoDBConnection = async () => {
    setLoading(true);
    setTestResult(null);

    // 환경 변수 확인 (보안 강화됨)
    const envCheck = {
      region: process.env.REACT_APP_AWS_REGION || 'us-west-2',
      tableName: process.env.REACT_APP_DYNAMODB_TABLE || 'DemoFactoryContents',
      credentialSource: 'Local AWS Credentials (~/.aws/credentials)',
      status: '보안 강화됨'
    };

    try {
      console.log('🔍 DynamoDB 연결 테스트 시작...');
      console.log('🔧 환경 설정:', envCheck);

      // DynamoDB 연결 테스트 (보안 강화된 서비스 사용)
      const contents = await getAllContents();
      
      setTestResult({
        success: true,
        message: `✅ DynamoDB 연결 성공! ${contents.length}개 콘텐츠 발견`,
        data: {
          contentCount: contents.length,
          latestContent: contents[0]?.title || 'N/A',
          envCheck
        }
      });

    } catch (error) {
      console.error('❌ DynamoDB 연결 실패:', error);
      
      setTestResult({
        success: false,
        message: `❌ DynamoDB 연결 실패: ${error.message}`,
        data: {
          error: error.toString(),
          envCheck
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const clearLocalStorage = () => {
    const keys = Object.keys(localStorage);
    const demoFactoryKeys = keys.filter(key => key.includes('demo-factory'));
    
    demoFactoryKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    alert(`🧹 localStorage 초기화 완료! (${demoFactoryKeys.length}개 키 삭제)\n페이지를 새로고침하세요.`);
  };

  return (
    <Box sx={{ p: 3, border: '1px solid #ddd', borderRadius: 2, m: 2 }}>
      <Typography variant="h6" gutterBottom>
        🔧 DynamoDB 연결 테스트
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Button 
          variant="contained" 
          onClick={testDynamoDBConnection}
          disabled={loading}
          sx={{ mr: 2 }}
        >
          {loading ? '테스트 중...' : 'DynamoDB 연결 테스트'}
        </Button>
        
        <Button 
          variant="outlined" 
          color="warning"
          onClick={clearLocalStorage}
        >
          localStorage 초기화
        </Button>
      </Box>

      {testResult && (
        <Alert severity={testResult.success ? 'success' : 'error'} sx={{ mt: 2 }}>
          <Typography variant="body2">
            {testResult.message}
          </Typography>
          
          <Box sx={{ mt: 1, fontSize: '0.8em' }}>
            <strong>환경 설정:</strong>
            <ul>
              <li>Region: {testResult.data.envCheck.region}</li>
              <li>Table: {testResult.data.envCheck.tableName}</li>
              <li>Access Key: {testResult.data.envCheck.accessKeyId}</li>
              <li>Secret Key: {testResult.data.envCheck.secretKey}</li>
            </ul>
            
            {testResult.success && (
              <>
                <strong>데이터 정보:</strong>
                <ul>
                  <li>콘텐츠 수: {testResult.data.contentCount}</li>
                  <li>최신 콘텐츠: {testResult.data.latestContent}</li>
                </ul>
              </>
            )}
          </Box>
        </Alert>
      )}
    </Box>
  );
};

export default DynamoDBTest;
