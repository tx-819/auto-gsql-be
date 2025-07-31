#!/usr/bin/env python3
"""
本地嵌入服务
使用Sentence Transformers提供文本嵌入功能
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import uvicorn
import logging
from typing import List, Optional
import os

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="本地嵌入服务", version="1.0.0")

# 全局模型变量
model = None
current_model_name = None

class EmbeddingRequest(BaseModel):
    text: str
    model_name: Optional[str] = "BAAI/bge-large-zh-v1.5"

class EmbeddingResponse(BaseModel):
    embedding: List[float]
    model_name: str
    vector_size: int

def load_model(model_name: str):
    """加载指定的嵌入模型"""
    global model, current_model_name
    
    if model is None or current_model_name != model_name:
        logger.info(f"正在加载模型: {model_name}")
        try:
            model = SentenceTransformer(model_name)
            current_model_name = model_name
            logger.info(f"模型加载成功: {model_name}")
        except Exception as e:
            logger.error(f"模型加载失败: {e}")
            raise HTTPException(status_code=500, detail=f"模型加载失败: {e}")

@app.on_event("startup")
async def startup_event():
    """服务启动时加载默认模型"""
    default_model = os.getenv("DEFAULT_MODEL", "BAAI/bge-large-zh-v1.5")
    load_model(default_model)

@app.post("/embed", response_model=EmbeddingResponse)
async def embed_text(request: EmbeddingRequest):
    """生成文本嵌入向量"""
    try:
        # 加载模型（如果需要）
        load_model(request.model_name)
        
        # 生成嵌入向量
        embedding = model.encode(request.text)
        
        return EmbeddingResponse(
            embedding=embedding.tolist(),
            model_name=current_model_name,
            vector_size=len(embedding)
        )
    except Exception as e:
        logger.error(f"嵌入生成失败: {e}")
        raise HTTPException(status_code=500, detail=f"嵌入生成失败: {e}")

@app.post("/embed_batch")
async def embed_batch(texts: List[str], model_name: str = "BAAI/bge-large-zh-v1.5"):
    """批量生成文本嵌入向量"""
    try:
        # 加载模型
        load_model(model_name)
        
        # 批量生成嵌入向量
        embeddings = model.encode(texts)
        
        return {
            "embeddings": embeddings.tolist(),
            "model_name": current_model_name,
            "vector_size": embeddings.shape[1],
            "batch_size": len(texts)
        }
    except Exception as e:
        logger.error(f"批量嵌入生成失败: {e}")
        raise HTTPException(status_code=500, detail=f"批量嵌入生成失败: {e}")

@app.get("/models")
async def get_available_models():
    """获取可用的模型列表"""
    return {
        "models": [
            {
                "name": "BAAI/bge-large-zh-v1.5",
                "description": "中文优化的大模型",
                "vector_size": 1024
            },
            {
                "name": "BAAI/bge-large-en-v1.5", 
                "description": "英文优化的大模型",
                "vector_size": 1024
            },
            {
                "name": "BAAI/bge-base-zh-v1.5",
                "description": "中文优化的基础模型",
                "vector_size": 768
            },
            {
                "name": "BAAI/bge-small-zh-v1.5",
                "description": "中文优化的轻量模型", 
                "vector_size": 512
            },
            {
                "name": "all-MiniLM-L6-v2",
                "description": "通用轻量模型",
                "vector_size": 384
            }
        ],
        "current_model": current_model_name
    }

@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "current_model": current_model_name
    }

@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "本地嵌入服务",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    # 从环境变量获取配置
    host = os.getenv("HOST", "localhost")
    port = int(os.getenv("PORT", "8888"))
    default_model = os.getenv("DEFAULT_MODEL", "BAAI/bge-large-zh-v1.5")
    
    logger.info(f"启动嵌入服务: {host}:{port}")
    logger.info(f"默认模型: {default_model}")
    
    uvicorn.run(
        app, 
        host=host, 
        port=port,
        log_level="info"
    ) 