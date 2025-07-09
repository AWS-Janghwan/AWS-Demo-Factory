import React, { createContext, useState, useContext, useEffect } from 'react';
import { deleteFileFromS3 } from '../utils/s3Upload';

// Define categories
export const CATEGORIES = {
  GENERATIVE_AI: 'Generative AI',
  MANUFACTURING: 'Manufacturing',
  RETAIL_CPG: 'Retail/CPG',
  TELCO_MEDIA: 'Telco/Media',
  FINANCE: 'Finance',
  AMAZON_Q: 'Amazon Q',
  ETC: 'ETC'
};

// Create content context
const ContentContext = createContext();

// Content provider component
export const ContentProvider = ({ children }) => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load content from localStorage on mount
  useEffect(() => {
    const storedContents = localStorage.getItem('demoFactoryContents');
    if (storedContents) {
      try {
        const parsedContents = JSON.parse(storedContents);
        // Ensure all content has required fields
        const updatedContents = parsedContents.map(content => {
          const updatedContent = { ...content };
          
          // Ensure files array exists
          if (!updatedContent.files) {
            const files = [];
            if (content.image) {
              files.push({
                url: content.image,
                type: 'image/jpeg',
                name: 'thumbnail.jpg',
                isLocal: false
              });
            }
            updatedContent.files = files;
          }
          
          // Ensure views and likes exist
          if (typeof updatedContent.views !== 'number') {
            updatedContent.views = 0;
          }
          if (typeof updatedContent.likes !== 'number') {
            updatedContent.likes = 0;
          }
          if (!Array.isArray(updatedContent.likedBy)) {
            updatedContent.likedBy = [];
          }
          
          return updatedContent;
        });
        
        setContents(updatedContents);
      } catch (error) {
        console.error('콘텐츠 로드 실패:', error);
        setContents([]);
      }
    }
    setLoading(false);
  }, []);

  // Save contents to localStorage whenever it changes
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('demoFactoryContents', JSON.stringify(contents));
    }
  }, [contents, loading]);

  // Add new content
  const addContent = (content) => {
    // Ensure content has required fields
    const contentWithFields = {
      ...content,
      files: content.files || [],
      views: 0,
      likes: 0,
      likedBy: [],
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setContents(prevContents => {
      const newContents = [...prevContents, contentWithFields];
      // Sort by creation date (newest first)
      return newContents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });
    
    return contentWithFields;
  };

  // Increment view count
  const incrementViews = (contentId) => {
    setContents(prevContents => 
      prevContents.map(content => 
        content.id === contentId 
          ? { ...content, views: (content.views || 0) + 1 }
          : content
      )
    );
  };

  // Toggle like for content
  const toggleLike = (contentId, userId) => {
    setContents(prevContents => 
      prevContents.map(content => {
        if (content.id === contentId) {
          const likedBy = content.likedBy || [];
          const isLiked = likedBy.includes(userId);
          
          if (isLiked) {
            // Remove like
            return {
              ...content,
              likes: Math.max(0, (content.likes || 0) - 1),
              likedBy: likedBy.filter(id => id !== userId)
            };
          } else {
            // Add like
            return {
              ...content,
              likes: (content.likes || 0) + 1,
              likedBy: [...likedBy, userId]
            };
          }
        }
        return content;
      })
    );
  };

  // Check if user has liked content
  const isLikedByUser = (contentId, userId) => {
    const content = contents.find(c => c.id === contentId);
    return content?.likedBy?.includes(userId) || false;
  };

  // Update existing content
  const updateContent = (id, updatedContent) => {
    setContents(prevContents => 
      prevContents.map(content => 
        content.id === id 
          ? { ...content, ...updatedContent, updatedAt: new Date().toISOString() }
          : content
      )
    );
  };

  // Delete content
  const deleteContent = async (id) => {
    const contentToDelete = contents.find(content => content.id === id);
    
    if (contentToDelete && contentToDelete.files) {
      // Delete associated files from S3
      for (const file of contentToDelete.files) {
        if (!file.isLocal && file.url) {
          try {
            await deleteFileFromS3(file.url);
          } catch (error) {
            console.warn('S3 파일 삭제 실패:', error);
          }
        }
      }
    }
    
    setContents(prevContents => prevContents.filter(content => content.id !== id));
  };

  // Get content by ID
  const getContentById = (id) => {
    return contents.find(content => content.id === id);
  };

  // Get contents by category
  const getContentsByCategory = (category) => {
    return contents.filter(content => content.category === category);
  };

  // Search contents
  const searchContents = (query) => {
    if (!query) return contents;
    
    const lowercaseQuery = query.toLowerCase();
    return contents.filter(content => 
      content.title.toLowerCase().includes(lowercaseQuery) ||
      content.description.toLowerCase().includes(lowercaseQuery) ||
      content.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  };

  // Get all contents
  const getAllContents = () => {
    return [...contents];
  };

  // Get latest contents
  const getLatestContents = (limit = 6) => {
    return [...contents]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  };

  const value = {
    contents,
    loading,
    addContent,
    updateContent,
    deleteContent,
    getContentById,
    getContentsByCategory,
    searchContents,
    getAllContents,
    getLatestContents,
    incrementViews,
    toggleLike,
    isLikedByUser
  };

  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  );
};

// Custom hook to use content context
export const useContent = () => {
  return useContext(ContentContext);
};
