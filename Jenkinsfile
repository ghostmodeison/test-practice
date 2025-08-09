@Library("Shared") _
pipeline {
    agent { label "chandan" }

    environment {
        IMAGE_NAME = "envr"
        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    stages { 
        stage("Hello") {
            steps {
                script {
                    hello()
                }
            }
        }

        stage("Code Checkout") {
            steps {
                script {
                    clone("https://github.com/ghostmodeison/test-practice", "main")
                }
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

        stage("Run with Docker Compose") {
            steps {
                echo "📦 Deploying locally with Docker Compose"
                sh """
                    docker-compose down || true
                    docker-compose up -d --build
                """
            }
        }
    }

    post {
        success {
            echo "✅ App built and running locally on port 3000"
        }
        failure {
            echo "❌ Build/Deploy failed"
        }
    }
}
