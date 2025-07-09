import { v4 as uuidv4 } from 'uuid';

/**
 * IndexedDB 기반 파일 저장 시스템
 * localStorage의 용량 제한을 극복하기 위한 대안
 */

const DB_NAME = 'AWS_Demo_Factory_Files';
const DB_VERSION = 1;
const STORE_NAME = 'files';

class IndexedDBFileStorage {
  constructor() {
    this.db = null;
  }

  /**
   * IndexedDB 초기화
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('❌ IndexedDB 열기 실패:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB 초기화 완료');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // 파일 저장소 생성
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('uploadedAt', 'uploadedAt', { unique: false });
          console.log('✅ IndexedDB 스토어 생성 완료');
        }
      };
    });
  }

  /**
   * 파일을 IndexedDB에 저장
   */
  async saveFile(file, path) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      try {
        const fileId = uuidv4();
        const reader = new FileReader();

        reader.onload = async (event) => {
          try {
            const arrayBuffer = event.target.result;
            
            const fileData = {
              id: fileId,
              name: file.name,
              path: path,
              type: file.type,
              size: file.size,
              data: arrayBuffer, // 바이너리 데이터 직접 저장
              uploadedAt: new Date().toISOString(),
              isPermanent: true
            };

            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.add(fileData);

            request.onsuccess = () => {
              console.log(`✅ IndexedDB 파일 저장 완료: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
              
              // Blob URL 생성하여 반환
              const blob = new Blob([arrayBuffer], { type: file.type });
              const blobUrl = URL.createObjectURL(blob);
              
              resolve({
                id: fileId,
                url: blobUrl,
                isIndexedDB: true
              });
            };

            request.onerror = () => {
              console.error('❌ IndexedDB 저장 실패:', request.error);
              reject(request.error);
            };

          } catch (error) {
            console.error('❌ 파일 처리 중 오류:', error);
            reject(error);
          }
        };

        reader.onerror = () => {
          reject(new Error('파일 읽기 실패'));
        };

        // ArrayBuffer로 읽기 (바이너리 데이터)
        reader.readAsArrayBuffer(file);

      } catch (error) {
        console.error('❌ IndexedDB 저장 중 오류:', error);
        reject(error);
      }
    });
  }

  /**
   * 저장된 파일 목록 조회 (매번 새로운 Blob URL 생성)
   */
  async getFiles() {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const files = request.result.map(fileData => {
          // 매번 새로운 Blob URL 생성 (서비스 재시작 후에도 유효)
          const blob = new Blob([fileData.data], { type: fileData.type });
          const blobUrl = URL.createObjectURL(blob);
          
          console.log(`🔄 [IndexedDB] 새 Blob URL 생성: ${fileData.name} -> ${blobUrl.substring(0, 50)}...`);
          
          return {
            id: fileData.id,
            name: fileData.name,
            path: fileData.path,
            type: fileData.type,
            size: fileData.size,
            url: blobUrl,
            uploadedAt: fileData.uploadedAt,
            isPermanent: true,
            isIndexedDB: true,
            // 새로 생성된 URL임을 표시
            isRefreshed: true,
            refreshedAt: new Date().toISOString()
          };
        });
        
        console.log(`📁 IndexedDB에서 ${files.length}개 파일 로드 완료 (모든 URL 새로 생성)`);
        resolve(files);
      };

      request.onerror = () => {
        console.error('❌ IndexedDB 파일 목록 조회 실패:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 파일 삭제
   */
  async deleteFile(fileId) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(fileId);

      request.onsuccess = () => {
        console.log(`✅ IndexedDB 파일 삭제 완료: ${fileId}`);
        resolve(true);
      };

      request.onerror = () => {
        console.error('❌ IndexedDB 파일 삭제 실패:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 저장소 정리
   */
  async clearStorage() {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('✅ IndexedDB 저장소 정리 완료');
        resolve(true);
      };

      request.onerror = () => {
        console.error('❌ IndexedDB 저장소 정리 실패:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 저장소 사용량 확인
   */
  async getStorageUsage() {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const files = request.result;
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);
        const totalCount = files.length;
        
        console.log(`📊 IndexedDB 사용량: ${(totalSize / 1024 / 1024).toFixed(2)}MB (${totalCount}개 파일)`);
        
        resolve({
          totalSize,
          totalCount,
          files: files.map(f => ({
            name: f.name,
            size: f.size,
            type: f.type,
            uploadedAt: f.uploadedAt
          }))
        });
      };

      request.onerror = () => {
        console.error('❌ IndexedDB 사용량 조회 실패:', request.error);
        reject(request.error);
      };
    });
  }
}

// 싱글톤 인스턴스
const indexedDBStorage = new IndexedDBFileStorage();

export default indexedDBStorage;
