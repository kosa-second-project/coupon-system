pipeline {
    agent any

    environment {
        // Docker Hub 정보 설정
        DOCKER_HUB_USER  = 'youngmankim' // 본인 Docker Hub ID로 변경 완료
        IMAGE_NAME       = 'coupon-system'
        TAG              = "${env.BUILD_NUMBER}"

        // AWS EC2 정보 설정
        EC2_IP           = '13.209.144.130'     // 본인의 EC2 탄력적 IP로 변경해 주세요!
        
        // AWS RDS 연결 정보 설정 (배포 시 주입될 환경변수)
        RDS_HOST         = 'coupon-db.c5m2o0k6c9vb.ap-northeast-2.rds.amazonaws.com'
        RDS_USER         = 'admin'

        // AWS S3 및 CloudFront 설정 추가 (실제 값으로 변경해 주세요!)
        S3_BUCKET_NAME   = 'coupon-system-frontend-youngman'
        CLOUDFRONT_DIST_ID = 'E27ZT54U1YCQ61'
        AWS_REGION       = 'ap-northeast-2'
    }

    stages {
        stage('Clone Repository') {
            steps {
                checkout scm
            }
        }

        // ==================== 1. 백엔드 빌드 및 배포 스테이지 ====================
        stage('Build Boot Application') {
            when {
                anyOf {
                    changeset "src/**"
                    changeset "build.gradle"
                    changeset "Dockerfile"
                    changeset "Jenkinsfile"
                    triggeredBy 'UserIdCause'
                }
            }
            steps {
                echo 'Building Spring Boot Application...'
                sh 'chmod +x ./gradlew'
                sh './gradlew clean build -x test'
            }
        }

        stage('Build & Push Docker Image') {
            when {
                anyOf {
                    changeset "src/**"
                    changeset "build.gradle"
                    changeset "Dockerfile"
                    changeset "Jenkinsfile"
                    triggeredBy 'UserIdCause'
                }
            }
            steps {
                echo 'Building Docker Image...'
                withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh "docker login -u ${DOCKER_USER} -p ${DOCKER_PASS}"
                    sh "docker build -t ${DOCKER_HUB_USER}/${IMAGE_NAME}:${TAG} ."
                    sh "docker build -t ${DOCKER_HUB_USER}/${IMAGE_NAME}:latest ."
                    sh "docker push ${DOCKER_HUB_USER}/${IMAGE_NAME}:${TAG}"
                    sh "docker push ${DOCKER_HUB_USER}/${IMAGE_NAME}:latest"
                }
            }
        }

        stage('Deploy to AWS EC2') {
            when {
                anyOf {
                    changeset "src/**"
                    changeset "build.gradle"
                    changeset "Dockerfile"
                    changeset "Jenkinsfile"
                    triggeredBy 'UserIdCause'
                }
            }
            steps {
                echo 'Deploying to AWS EC2 via SSH...'
                // RDS 비밀번호를 Jenkins Credentials에서 동적으로 가져옵니다 (보안)
                withCredentials([string(credentialsId: 'rds-password', variable: 'RDS_PASS')]) {
                    sshagent(['ec2-ssh-key']) {
                        sh """
                        ssh -o StrictHostKeyChecking=no ubuntu@${EC2_IP} "
                            # 1. 최신 이미지 가져오기
                            docker pull ${DOCKER_HUB_USER}/${IMAGE_NAME}:latest
                            
                            # 2. 기존 실행 중인 컨테이너가 있다면 중지 및 삭제
                            if [ \\\$(docker ps -a -q -f name=${IMAGE_NAME}) ]; then
                                echo 'Stopping and removing existing container...'
                                docker stop ${IMAGE_NAME}
                                docker rm ${IMAGE_NAME}
                            fi
                            
                            # 3. 안 쓰는 오래된 Docker 이미지 삭제 (디스크 용량 절약)
                            docker image prune -f
                            
                            # 4. 새 컨테이너 실행 (RDS 연결용 환경변수 주입)
                            docker run -d \\
                                --name ${IMAGE_NAME} \\
                                -p 8080:8080 \\
                                -e SPRING_PROFILES_ACTIVE=prod \\
                                -e DB_HOST=${RDS_HOST} \\
                                -e DB_USERNAME=${RDS_USER} \\
                                -e DB_PASSWORD=${RDS_PASS} \\
                                ${DOCKER_HUB_USER}/${IMAGE_NAME}:latest
                                
                            echo 'Deployment Completed!'
                        "
                        """
                    }
                }
            }
        }

        // ==================== 2. 프론트엔드 빌드 및 배포 스테이지 ====================
        stage('Build Frontend') {
            when {
                anyOf {
                    changeset "frontend/**"
                    triggeredBy 'UserIdCause'
                }
            }
            steps {
                echo 'Building Frontend (Vite)...'
                dir('frontend') {
                    sh 'echo "VITE_API_URL=http://13.209.144.130:8080" > .env.production'
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Deploy Frontend to S3 & CloudFront') {
            when {
                anyOf {
                    changeset "frontend/**"
                    triggeredBy 'UserIdCause'
                }
            }
            steps {
                echo 'Deploying Frontend to AWS S3 & CloudFront...'
                // AWS IAM 자격증명을 Jenkins Credentials(Secret text)에서 로드합니다.
                withCredentials([
                    string(credentialsId: 'aws-access-key-id', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh """
                        export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
                        export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
                        export AWS_DEFAULT_REGION=${AWS_REGION}
                        
                        # 1. S3 버킷과 frontend/dist 폴더 동기화 (--delete 옵션으로 안쓰는 파일 삭제)
                        aws s3 sync frontend/dist s3://${S3_BUCKET_NAME} --delete
                        
                        # 2. CloudFront 캐시 무효화 (사용자에게 즉시 배포본 반영)
                        aws cloudfront create-invalidation --distribution-id ${CLOUDFRONT_DIST_ID} --paths "/*"
                    """
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline Succeeded!'
        }
        failure {
            echo 'Pipeline Failed!'
        }
    }
}
