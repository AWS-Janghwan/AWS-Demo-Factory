// 브라우저 콘솔에서 실행할 삭제 API 테스트 스크립트

async function testDeleteAPI() {
  console.log("🔍 삭제 API 테스트 시작...");

  try {
    // 1. 현재 콘텐츠 목록 가져오기
    console.log("📋 콘텐츠 목록 조회...");
    const listResponse = await fetch("/api/content/list");
    const listData = await listResponse.json();

    if (
      !listData.success ||
      !listData.contents ||
      listData.contents.length === 0
    ) {
      console.log("❌ 삭제할 콘텐츠가 없습니다.");
      return;
    }

    const firstContent = listData.contents[0];
    console.log("🎯 삭제할 콘텐츠:", {
      id: firstContent.id,
      title: firstContent.title,
    });

    // 2. 삭제 API 호출
    console.log("🗑️ 삭제 API 호출...");
    const deleteResponse = await fetch(`/api/content/${firstContent.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("📊 삭제 응답 상태:", deleteResponse.status);
    console.log("📊 삭제 응답 헤더:", [...deleteResponse.headers.entries()]);

    if (deleteResponse.ok) {
      const deleteData = await deleteResponse.json();
      console.log("✅ 삭제 성공:", deleteData);

      // 3. 삭제 후 목록 다시 확인
      console.log("🔄 삭제 후 목록 재확인...");
      const newListResponse = await fetch("/api/content/list");
      const newListData = await newListResponse.json();

      console.log("📊 삭제 전 개수:", listData.contents.length);
      console.log("📊 삭제 후 개수:", newListData.contents.length);

      if (newListData.contents.length === listData.contents.length - 1) {
        console.log("🎉 삭제 API 정상 작동!");
      } else {
        console.log("❌ 삭제가 반영되지 않음");
      }
    } else {
      const errorText = await deleteResponse.text();
      console.log("❌ 삭제 실패:", deleteResponse.status, errorText);
    }
  } catch (error) {
    console.error("💥 테스트 중 오류:", error);
  }
}

// 실행
testDeleteAPI();
