import { generateS3Path } from './awsConfig';
import { uploadFile } from './amplifyConfig';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get a presigned URL from the server and upload a file to S3
 */
export const uploadFileToS3 = async (file, type = 'images', onProgress = null) => {
  if (!file) {
    throw new Error('No file provided');
  }

  // 파일 크기 체크 (100MB 제한)
  const maxFileSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxFileSize) {
    throw new Error('파일 크기가 너무 큽니다. 최대 100MB까지 업로드 가능합니다.');
  }

  // Generate date-based folder path (YYYY/MM/DD structure)
  const folderPath = generateS3Path(type);
  
  console.log(`📁 [S3Upload] 날짜 기반 업로드 경로: ${folderPath}`);

  try {
    // 진행률 시뮬레이션
    if (onProgress) {
      onProgress(10);
    }

    // Try to get presigned URL from server
    const response = await fetch('/api/get-presigned-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        folderPath: folderPath
      }),
    });

    if (onProgress) {
      onProgress(30);
    }

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.useLocalFallback) {
      console.warn('S3 not available, using local storage');
      if (onProgress) {
        onProgress(50);
      }
      
      // Use local storage as fallback
      const result = await uploadFile(file, folderPath, (progress) => {
        if (onProgress) {
          onProgress(50 + (progress * 0.5)); // 50-100% 범위
        }
      });
      
      return {
        fileUrl: result.fileUrl,
        isLocal: true,
        key: result.key || `local-${uuidv4()}-${file.name}`
      };
    }

    if (onProgress) {
      onProgress(50);
    }

    // Upload to S3 using presigned URL
    const uploadResponse = await fetch(data.presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (onProgress) {
      onProgress(80);
    }

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status}`);
    }

    if (onProgress) {
      onProgress(100);
    }

    return {
      fileUrl: data.fileUrl,
      isLocal: false,
      key: data.fileUrl.split('/').pop()
    };

  } catch (error) {
    console.error('S3 upload failed, falling back to local storage:', error);
    
    if (onProgress) {
      onProgress(50);
    }
    
    // Fallback to local storage
    try {
      const result = await uploadFile(file, folderPath, (progress) => {
        if (onProgress) {
          onProgress(50 + (progress * 0.5)); // 50-100% 범위
        }
      });
      
      return {
        fileUrl: result.fileUrl,
        isLocal: true,
        key: result.key || `local-${uuidv4()}-${file.name}`
      };
    } catch (localError) {
      console.error('Local storage fallback also failed:', localError);
      throw new Error(`업로드 실패: ${localError.message}`);
    }
  }
};

/**
 * Upload multiple files to S3
 */
export const uploadMultipleFilesToS3 = async (files, type = 'images', onProgress = null) => {
  const fileArray = Array.from(files);
  const results = [];
  
  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i];
    
    try {
      const result = await uploadFileToS3(file, type, (fileProgress) => {
        if (onProgress) {
          const overallProgress = ((i / fileArray.length) * 100) + (fileProgress / fileArray.length);
          onProgress(Math.min(overallProgress, 100));
        }
      });
      
      results.push({
        file: file,
        result: result,
        success: true
      });
    } catch (error) {
      results.push({
        file: file,
        error: error.message,
        success: false
      });
    }
  }
  
  return results;
};

/**
 * Delete a file from S3
 */
export const deleteFileFromS3 = async (key) => {
  if (!key || key.startsWith('local-')) {
    return true;
  }

  try {
    const response = await fetch('/api/delete-s3-object', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    return false;
  }
};

/**
 * Get file type category
 */
export const getFileTypeCategory = (mimeType) => {
  if (mimeType.startsWith('image/')) {
    return 'images';
  } else if (mimeType.startsWith('video/')) {
    return 'videos';
  } else {
    return 'documents';
  }
};

/**
 * Validate file size and type
 */
export const validateFile = (file, maxSize = 100 * 1024 * 1024, allowedTypes = []) => {
  const errors = [];
  
  // Check file size
  if (file.size > maxSize) {
    errors.push(`파일 크기가 너무 큽니다. 최대 ${Math.round(maxSize / 1024 / 1024)}MB까지 업로드 가능합니다.`);
  }
  
  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.some(type => file.type.startsWith(type))) {
    errors.push(`지원하지 않는 파일 형식입니다. 허용된 형식: ${allowedTypes.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
