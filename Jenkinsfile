pipeline {
    agent any

    environment {
        // Docker Hub 정보 설정
        DOCKER_HUB_USER  = 'youngmankim' // 본인 Docker Hub ID로 변경 완료
        IMAGE_NAME       = 'coupon-system'
        TAG              = "${env.BUILD_NUMBER}"

        // AWS EC2 정보 설정
        EC2_IP           = 'localhost'     // 본인의 EC2 탄력적 IP로 변경해 주세요!
        
        // AWS RDS 연결 정보 설정 (배포 시 주입될 환경변수)
        RDS_HOST         = 'coupon-db.c5m2o0k6c9vb.ap-northeast-2.rds.amazonaws.com'
        RDS_USER         = 'admin'
    }

    stages {
        stage('Clone Repository') {
            steps {
                checkout scm
            }
        }

        stage('Build Boot Application') {
            steps {
                echo 'Building Spring Boot Application...'
                sh 'chmod +x ./gradlew'
                sh './gradlew clean build -x test'
            }
        }

        stage('Build & Push Docker Image') {
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
