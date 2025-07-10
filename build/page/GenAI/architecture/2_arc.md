# Historian Demo Architecture

<!-- ![alt text](../../source/img/1_arc.png) -->

<img src="../../source/img/GenAI_2_arc.png" width="1200">



# Architecture 설명
1. 제조 현장의 히스토리안 서버에서 발생하는 데이터를 실시간으로 AWS 클라우드로 전송

2. Amazon MSK와 Telegraf를 통해 데이터를 Timestream으로 전송하여 실시간 모니터링

3. Amazon Managed Grafana에서 수집된 데이터를 시각화하여 실시간 장비 상태와 공정 데이터를 확인

4. 히스토리안 데이터는 Amazon S3에 저장되고, AWS Glue와 Athena를 통해 분석 가능한 데이터 세트로 변환

5. Athena와 QuickSight를 통해 데이터 시각화와 보고서를 생성하여 사용자가 직관적으로 데이터를 분석
