# MES Chatbot Architecture

<!-- ![alt text](../../source/img/1_arc.png) -->

<img src="../../source/img/GenAI_1_arc.png" width="1200">



# Architecture 설명
 1. 데이터베이스 스키마가 DB에서 검색되어 프롬프트에 입력

 2. 사용자가 MES에 저장된 운영 데이터에 접근해야만 답변할 수 있는 질의 수행

 3. LLM(대규모 언어 모델)이 스키마와 사용자 질문을 기반으로 SQL 쿼리를 생성

 4. 생성된 쿼리가 MES에서 실행되고, 그 결과로 데이터셋을 데이터프레임 형태로 반환

 5. 데이터프레임이 질문과 함께 LLM에 전달되어 MES로부터 실시간 정보 제공

