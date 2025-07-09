/**
 * Utility functions for file handling
 */

/**
 * Formats file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Validates file type
 * @param {File} file - File to validate
 * @param {Array} allowedTypes - Array of allowed MIME types
 * @returns {boolean} - Whether file type is allowed
 */
export const validateFileType = (file, allowedTypes) => {
  return allowedTypes.includes(file.type);
};

/**
 * Validates file size
 * @param {File} file - File to validate
 * @param {number} maxSize - Maximum file size in bytes
 * @returns {boolean} - Whether file size is within limit
 */
export const validateFileSize = (file, maxSize) => {
  return file.size <= maxSize;
};

/**
 * Creates a URL for a file object
 * @param {File} file - File to create URL for
 * @returns {string} - Object URL
 */
export const createFilePreview = (file) => {
  return URL.createObjectURL(file);
};

/**
 * Revokes a file object URL to free memory
 * @param {string} url - Object URL to revoke
 */
export const revokeFilePreview = (url) => {
  URL.revokeObjectURL(url);
};

/**
 * Extracts file extension from filename
 * @param {string} filename - Filename
 * @returns {string} - File extension
 */
export const getFileExtension = (filename) => {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
};

/**
 * Generates a unique filename
 * @param {string} originalName - Original filename
 * @returns {string} - Unique filename
 */
export const generateUniqueFilename = (originalName) => {
  const timestamp = new Date().getTime();
  const extension = getFileExtension(originalName);
  const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
  
  return `${baseName}-${timestamp}.${extension}`;
};

/**
 * Determines if a file is an image
 * @param {File} file - File to check
 * @returns {boolean} - Whether file is an image
 */
export const isImageFile = (file) => {
  return file.type.startsWith('image/');
};

/**
 * Determines if a file is a video
 * @param {File} file - File to check
 * @returns {boolean} - Whether file is a video
 */
export const isVideoFile = (file) => {
  return file.type.startsWith('video/');
};

/**
 * Gets appropriate folder path for file storage
 * @param {File} file - File to get path for
 * @param {string} contentId - ID of the content
 * @returns {string} - Storage path
 */
export const getStoragePath = (file, contentId) => {
  const fileType = isImageFile(file) ? 'images' : isVideoFile(file) ? 'videos' : 'files';
  return `contents/${fileType}/${contentId}/${file.name}`;
};
