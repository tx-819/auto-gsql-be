#!/bin/bash

# 本地嵌入服务启动脚本

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 启动本地嵌入服务..."

# 设置pip镜像源（可选）
# 可用的镜像源：
# - 清华：https://pypi.tuna.tsinghua.edu.cn/simple/
# - 阿里云：https://mirrors.aliyun.com/pypi/simple/
# - 豆瓣：https://pypi.douban.com/simple/
# - 中科大：https://pypi.mirrors.ustc.edu.cn/simple/

# 默认使用阿里云镜像源
PIP_INDEX_URL=${PIP_INDEX_URL:-"https://mirrors.aliyun.com/pypi/simple/"}

echo "📦 使用pip镜像源: $PIP_INDEX_URL"

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安装，请先安装Python3"
    exit 1
fi

# 检查pip
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 未安装，请先安装pip3"
    exit 1
fi

# 设置环境变量
export HOST=${HOST:-"localhost"}
export PORT=${PORT:-"8888"}
export DEFAULT_MODEL=${DEFAULT_MODEL:-"BAAI/bge-large-zh-v1.5"}

echo "📋 配置信息:"
echo "   - 主机: $HOST"
echo "   - 端口: $PORT"
echo "   - 默认模型: $DEFAULT_MODEL"

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "📦 创建Python虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
echo "🔧 激活虚拟环境..."
source venv/bin/activate

# 安装依赖
echo "📥 安装依赖包..."
pip install -i $PIP_INDEX_URL -r requirements.txt

# 检查模型是否已下载
echo "🔍 检查模型文件..."
python3 -c "
from sentence_transformers import SentenceTransformer
import os
model_name = os.getenv('DEFAULT_MODEL', 'BAAI/bge-large-zh-v1.5')
print(f'正在下载模型: {model_name}')
model = SentenceTransformer(model_name)
print(f'模型加载成功: {model_name}')
"

if [ $? -eq 0 ]; then
    echo "✅ 模型准备完成"
else
    echo "❌ 模型下载失败"
    exit 1
fi

# 启动服务
echo "🌐 启动嵌入服务..."
echo "   访问地址: http://$HOST:$PORT"
echo "   API文档: http://$HOST:$PORT/docs"
echo "   健康检查: http://$HOST:$PORT/health"
echo ""
echo "按 Ctrl+C 停止服务"

python3 embedding_service.py 