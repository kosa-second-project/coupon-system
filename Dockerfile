# 1. Java 21 실행 환경(경량화 버전) 설정
FROM eclipse-temurin:21-jre-alpine

# 2. 작업 디렉토리 생성
WORKDIR /app

# 3. 로컬에서 Gradle로 빌드한 실행 가능한 jar 파일을 컨테이너 내부로 복사
COPY build/libs/*.jar app.jar

# 4. 스프링 부트 기본 포트 노출
EXPOSE 8080

# 5. 어플리케이션 실행 명령어
ENTRYPOINT ["java", "-jar", "app.jar"]
