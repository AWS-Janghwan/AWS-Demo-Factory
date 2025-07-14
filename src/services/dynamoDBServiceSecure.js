// 보안 강화된 DynamoDB 서비스
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, PutCommand, UpdateCommand, DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import credentialsManager from '../utils/credentialsManager.js';

class SecureDynamoDBService {
    constructor() {
        this.client = null;
        this.docClient = null;
        this.tableName = process.env.REACT_APP_DYNAMODB_TABLE || 'DemoFactoryContents';
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            console.log('🔐 DynamoDB 클라이언트 초기화 중...');
            
            // 자격 증명 가져오기
            const config = await credentialsManager.getCredentialsForService('DynamoDB');
            
            // DynamoDB 클라이언트 생성
            this.client = new DynamoDBClient(config);
            this.docClient = DynamoDBDocumentClient.from(this.client);
            
            this.initialized = true;
            console.log('✅ DynamoDB 클라이언트 초기화 완료');
        } catch (error) {
            console.error('❌ DynamoDB 클라이언트 초기화 실패:', error);
            throw error;
        }
    }

    async getAllContents() {
        await this.initialize();
        
        try {
            console.log('📋 모든 콘텐츠 가져오기...');
            
            const command = new ScanCommand({
                TableName: this.tableName
            });

            const response = await this.docClient.send(command);
            console.log(`✅ ${response.Items.length}개 콘텐츠 가져오기 성공`);
            
            return response.Items || [];
        } catch (error) {
            console.error('❌ 콘텐츠 가져오기 실패:', error);
            throw error;
        }
    }

    async getContentById(id) {
        await this.initialize();
        
        try {
            console.log(`📄 콘텐츠 가져오기 (ID: ${id})`);
            
            const command = new GetCommand({
                TableName: this.tableName,
                Key: { id }
            });

            const response = await this.docClient.send(command);
            
            if (response.Item) {
                console.log('✅ 콘텐츠 가져오기 성공');
                return response.Item;
            } else {
                console.log('⚠️ 콘텐츠를 찾을 수 없음');
                return null;
            }
        } catch (error) {
            console.error('❌ 콘텐츠 가져오기 실패:', error);
            throw error;
        }
    }

    async createContent(content) {
        await this.initialize();
        
        try {
            console.log('📝 새 콘텐츠 생성 중...');
            
            const item = {
                ...content,
                id: content.id || Date.now().toString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const command = new PutCommand({
                TableName: this.tableName,
                Item: item
            });

            await this.docClient.send(command);
            console.log('✅ 콘텐츠 생성 성공');
            
            return item;
        } catch (error) {
            console.error('❌ 콘텐츠 생성 실패:', error);
            throw error;
        }
    }

    async updateContent(id, updates) {
        await this.initialize();
        
        try {
            console.log(`📝 콘텐츠 업데이트 중 (ID: ${id})`);
            
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

            const command = new UpdateCommand({
                TableName: this.tableName,
                Key: { id },
                UpdateExpression: `SET ${updateExpression.join(', ')}`,
                ExpressionAttributeNames: expressionAttributeNames,
                ExpressionAttributeValues: expressionAttributeValues,
                ReturnValues: 'ALL_NEW'
            });

            const response = await this.docClient.send(command);
            console.log('✅ 콘텐츠 업데이트 성공');
            
            return response.Attributes;
        } catch (error) {
            console.error('❌ 콘텐츠 업데이트 실패:', error);
            throw error;
        }
    }

    async deleteContent(id) {
        await this.initialize();
        
        try {
            console.log(`🗑️ 콘텐츠 삭제 중 (ID: ${id})`);
            
            const command = new DeleteCommand({
                TableName: this.tableName,
                Key: { id }
            });

            await this.docClient.send(command);
            console.log('✅ 콘텐츠 삭제 성공');
            
            return true;
        } catch (error) {
            console.error('❌ 콘텐츠 삭제 실패:', error);
            throw error;
        }
    }

    // 자격 증명 테스트
    async testConnection() {
        try {
            await this.initialize();
            
            // 테이블 존재 여부 확인
            const command = new ScanCommand({
                TableName: this.tableName,
                Limit: 1
            });

            await this.docClient.send(command);
            console.log('✅ DynamoDB 연결 테스트 성공');
            return true;
        } catch (error) {
            console.error('❌ DynamoDB 연결 테스트 실패:', error);
            return false;
        }
    }
}

export default new SecureDynamoDBService();
