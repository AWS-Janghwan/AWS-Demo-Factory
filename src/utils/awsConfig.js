// AWS Configuration
export const awsConfig = {
  region: 'ap-northeast-2', // Seoul region
  bucketName: 'aws-demo-factory',
  identityPoolId: 'ap-northeast-2_bMQe94Yev', // Cognito Identity Pool ID
  userPoolId: 'ap-northeast-2_bMQe94Yev', // User Pool ID
  userPoolWebClientId: 'your-app-client-id', // Replace with your App Client ID
};

// S3 bucket paths
export const s3Paths = {
  images: 'contents/images/',
  videos: 'contents/videos/',
  documents: 'contents/documents/'
};

// Generate date-based folder structure (YYYY/MM/DD)
export const generateDatePath = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};

// Generate S3 path with date structure
export const generateS3Path = (type = 'images') => {
  const basePath = s3Paths[type] || s3Paths.images;
  const datePath = generateDatePath();
  return `${basePath}${datePath}/`;
};

// Generate S3 URL for uploaded files
export const getS3Url = (key) => {
  return `https://${awsConfig.bucketName}.s3.${awsConfig.region}.amazonaws.com/${key}`;
};

// Generate a unique file name with timestamp
export const generateUniqueFileName = (originalName) => {
  const timestamp = new Date().getTime();
  const extension = originalName.split('.').pop();
  const baseName = originalName.split('.').slice(0, -1).join('.');
  const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  
  return `${sanitizedBaseName}-${timestamp}.${extension}`;
};
