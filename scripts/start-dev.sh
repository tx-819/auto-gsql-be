#!/bin/bash

echo "🚀 启动多轮对话系统开发环境..."

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker未运行，请先启动Docker"
    exit 1
fi

# 启动依赖服务
echo "📦 启动依赖服务 (MySQL, Redis, Qdrant)..."
docker-compose -f docker-compose.dev.yml up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
docker-compose -f docker-compose.dev.yml ps

# 安装依赖
echo "📥 安装项目依赖..."
pnpm install

# 启动开发服务器
echo "🔥 启动NestJS开发服务器..."
pnpm run start:dev 