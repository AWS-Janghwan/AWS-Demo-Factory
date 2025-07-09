// 기존 콘텐츠의 빈 URL 문제를 해결하는 유틸리티

export const fixEmptyUrls = () => {
  console.log('=== 콘텐츠 URL 수정 시작 ===');
  
  const contents = JSON.parse(localStorage.getItem('demoFactoryContents') || '[]');
  let hasChanges = false;
  
  contents.forEach((content, contentIndex) => {
    if (content.files && content.files.length > 0) {
      content.files.forEach((file, fileIndex) => {
        if (!file.url || file.url.trim() === '') {
          console.log(`빈 URL 발견: ${file.name} (콘텐츠 ${contentIndex + 1})`);
          
          // 임시 placeholder URL 설정 (사용자가 다시 업로드할 때까지)
          content.files[fileIndex].url = `placeholder://missing-file/${file.name}`;
          content.files[fileIndex].needsReupload = true;
          hasChanges = true;
          
          console.log(`임시 URL 설정: ${file.name}`);
        }
      });
    }
  });
  
  if (hasChanges) {
    localStorage.setItem('demoFactoryContents', JSON.stringify(contents));
    console.log('✅ 콘텐츠 업데이트 완료');
    console.log('⚠️  빈 URL이 있던 파일들을 다시 업로드해주세요');
  } else {
    console.log('✅ 모든 파일 URL이 정상입니다');
  }
  
  return hasChanges;
};

// 특정 콘텐츠의 파일 URL 상태 확인
export const checkContentUrls = (contentId) => {
  const contents = JSON.parse(localStorage.getItem('demoFactoryContents') || '[]');
  const content = contents.find(c => c.id === contentId);
  
  if (!content) {
    console.log('콘텐츠를 찾을 수 없습니다');
    return;
  }
  
  console.log(`=== 콘텐츠 "${content.title}" URL 상태 ===`);
  
  if (!content.files || content.files.length === 0) {
    console.log('파일이 없습니다');
    return;
  }
  
  content.files.forEach((file, index) => {
    const status = file.url && file.url.trim() !== '' ? '✅ 정상' : '❌ 빈 URL';
    console.log(`${index + 1}. ${file.name}: ${status}`);
    if (file.url) {
      console.log(`   URL: ${file.url.substring(0, 50)}...`);
    }
  });
};
