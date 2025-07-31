# 嵌入模型实现方案

本文档介绍系统中支持的各种嵌入模型实现方式，以及如何选择最适合的方案。

## 1. OpenAI 嵌入模型

### 优点

- 稳定可靠，API成熟
- 支持多种语言
- 向量质量高
- 使用简单

### 缺点

- 需要API密钥
- 有调用费用
- 依赖网络连接
- 数据隐私问题

### 使用示例

```typescript
const config: EmbeddingConfig = {
  type: 'openai',
  apiKey: 'your-openai-api-key',
  model: 'text-embedding-ada-002',
};

const embedding = await embeddingService.generateEmbedding('你好世界', config);
```

## 2. 本地嵌入模型

### 优点

- 数据隐私保护
- 无API调用费用
- 离线可用
- 可自定义模型

### 缺点

- 需要本地计算资源
- 模型文件较大
- 部署复杂
- 性能依赖硬件

### 实现方式

#### 2.1 Python + FastAPI 服务

创建 `embedding_service.py`:

```python
from fastapi import FastAPI
from sentence_transformers import SentenceTransformer
import uvicorn

app = FastAPI()
model = SentenceTransformer('BAAI/bge-large-zh-v1.5')

@app.post("/embed")
async def embed_text(text: str, model_name: str = "BAAI/bge-large-zh-v1.5"):
    embedding = model.encode(text)
    return {"embedding": embedding.tolist()}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

#### 2.2 Node.js + ONNX Runtime

```typescript
import * as ort from 'onnxruntime-node';

class LocalEmbeddingProvider {
  private session: ort.InferenceSession;

  async loadModel(modelPath: string) {
    this.session = await ort.InferenceSession.create(modelPath);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // 文本预处理
    const input = this.preprocessText(text);

    // 运行推理
    const results = await this.session.run({ input });

    return results.output.data as number[];
  }
}
```

## 3. 云服务提供商

### 3.1 百度文心

```typescript
const config: EmbeddingConfig = {
  type: 'baidu',
  accessToken: 'your-baidu-access-token',
};

const embedding = await embeddingService.generateEmbedding('你好世界', config);
```

### 3.2 阿里云通义千问

```typescript
const config: EmbeddingConfig = {
  type: 'ali',
  apiKey: 'your-ali-api-key',
};

const embedding = await embeddingService.generateEmbedding('你好世界', config);
```

## 4. 轻量级方案

### 4.1 TF-IDF + 降维

```typescript
import { TfIdf } from 'natural';
import { PCA } from 'ml-pca';

class TFIDFEmbeddingProvider {
  private tfidf = new TfIdf();
  private pca: PCA;

  addDocuments(documents: string[]) {
    documents.forEach((doc) => this.tfidf.addDocument(doc));
  }

  generateEmbedding(text: string): number[] {
    const vector = this.tfidf.tfidfs(text);
    return this.pca.predict([vector])[0];
  }
}
```

### 4.2 词袋模型 + 哈希

```typescript
class BagOfWordsEmbeddingProvider {
  private vocabulary = new Map<string, number>();
  private vectorSize = 768;

  generateEmbedding(text: string): number[] {
    const words = text.toLowerCase().split(/\s+/);
    const vector = new Array(this.vectorSize).fill(0);

    words.forEach((word) => {
      const hash = this.hashString(word);
      const index = hash % this.vectorSize;
      vector[index] += 1;
    });

    return this.normalize(vector);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash);
  }
}
```

## 5. 性能对比

| 方案     | 准确度 | 速度 | 成本 | 隐私 | 部署复杂度 |
| -------- | ------ | ---- | ---- | ---- | ---------- |
| OpenAI   | 高     | 快   | 高   | 低   | 低         |
| 本地BGE  | 高     | 中   | 低   | 高   | 高         |
| 百度文心 | 中     | 快   | 中   | 中   | 低         |
| TF-IDF   | 低     | 快   | 低   | 高   | 低         |
| 词袋模型 | 低     | 很快 | 低   | 高   | 低         |

## 6. 选择建议

### 6.1 生产环境

- **高精度要求**: OpenAI 或本地BGE模型
- **成本敏感**: 本地BGE模型
- **隐私要求高**: 本地模型
- **快速部署**: 云服务提供商

### 6.2 开发测试

- **快速原型**: TF-IDF或词袋模型
- **功能验证**: OpenAI API
- **性能测试**: 本地模型

### 6.3 特定场景

- **中文文本**: BGE模型
- **多语言**: OpenAI
- **实时应用**: 轻量级方案
- **离线环境**: 本地模型

## 7. 配置示例

### 环境变量配置

```bash
# 嵌入模型类型
EMBEDDING_TYPE=openai  # openai, local, baidu, ali

# OpenAI配置
OPENAI_API_KEY=your-api-key
OPENAI_EMBEDDING_MODEL=text-embedding-ada-002

# 本地服务配置
LOCAL_EMBEDDING_URL=http://localhost:8000/embed
LOCAL_EMBEDDING_MODEL=BAAI/bge-large-zh-v1.5

# 百度配置
BAIDU_ACCESS_TOKEN=your-access-token

# 阿里云配置
ALI_API_KEY=your-api-key
```

### 代码配置

```typescript
// 根据环境选择嵌入方式
const getEmbeddingConfig = (): EmbeddingConfig => {
  const type = process.env.EMBEDDING_TYPE || 'openai';

  switch (type) {
    case 'openai':
      return {
        type: 'openai',
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_EMBEDDING_MODEL,
      };
    case 'local':
      return {
        type: 'local',
        baseURL: process.env.LOCAL_EMBEDDING_URL,
        model: process.env.LOCAL_EMBEDDING_MODEL,
      };
    case 'baidu':
      return {
        type: 'baidu',
        accessToken: process.env.BAIDU_ACCESS_TOKEN,
      };
    default:
      return {
        type: 'openai',
        apiKey: process.env.OPENAI_API_KEY,
      };
  }
};
```

## 8. 迁移指南

### 从OpenAI迁移到本地模型

1. **安装依赖**

```bash
pip install sentence-transformers fastapi uvicorn
```

2. **启动本地服务**

```bash
python embedding_service.py
```

3. **更新配置**

```typescript
const config: EmbeddingConfig = {
  type: 'local',
  baseURL: 'http://localhost:8000/embed',
  model: 'BAAI/bge-large-zh-v1.5',
};
```

4. **测试验证**

```typescript
const embedding = await embeddingService.generateEmbedding('测试文本', config);
console.log('向量维度:', embedding.length);
```

## 9. 最佳实践

1. **模型选择**: 根据语言和精度要求选择合适的模型
2. **缓存策略**: 对相同文本的嵌入结果进行缓存
3. **错误处理**: 实现重试机制和降级策略
4. **监控指标**: 监控嵌入质量和性能指标
5. **成本控制**: 合理使用API调用，避免不必要的请求
