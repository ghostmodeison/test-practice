@Library("Shared") _
pipeline {
    agent { label "chandan" }

    environment {
        IMAGE_NAME = "envr"
        IMAGE_TAG = "${BUILD_NUMBER}"
        ECR_REPO_URI = "058264451049.dkr.ecr.ap-south-1.amazonaws.com/envr-jenkins"
        AWS_REGION = "ap-south-1"
    }

    stages {
        stage("Code Checkout") {
            steps {
                git branch: 'main', url: 'https://github.com/ghostmodeison/test-practice'
            }
        }

        stage("Build Docker Image") {
            steps {
                echo "🚀 Building Docker image locally"
                sh """
                    docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
                """
            }
        }

        stage("Login to ECR") {
            steps {
                echo "🔐 Logging in to AWS ECR"
                sh """
                    aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REPO_URI}
                """
            }
        }

        stage("Tag and Push to ECR") {
            steps {
                echo "📤 Tagging and pushing Docker image to ECR"
                sh """
                    docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${ECR_REPO_URI}:${IMAGE_TAG}
                    docker push ${ECR_REPO_URI}:${IMAGE_TAG}
                """
            }
        }
    }

    post {
        success {
            echo "✅ App built and pushed to ECR successfully"
        }
        failure {
            echo "❌ Build or push failed"
        }
    }
}
