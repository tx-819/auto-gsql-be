<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# 多轮对话系统后端

基于NestJS构建的智能多轮对话系统，支持上下文记忆、话题聚合、自动标题生成等功能。

## 核心功能

- 🤖 **多轮对话**: 支持上下文记忆的连续对话
- 🏷️ **话题聚合**: 自动按相似度聚合对话到话题
- 📝 **自动标题**: 为每个话题生成简短标题
- 💾 **历史记录**: 持久化存储所有对话数据
- 🔍 **向量检索**: 高效检索相关上下文

## 技术栈

- **后端框架**: NestJS (TypeScript)
- **AI模型**: OpenAI GPT-3.5-turbo + text-embedding-ada-002
- **缓存**: Redis (短期上下文、话题标题缓存)
- **数据库**: MySQL (长期存储消息和话题)
- **向量数据库**: Qdrant (向量存储与检索)

## 快速开始

### 1. 环境准备

```bash
# 克隆项目
git clone <repository-url>
cd auto-gsql-be

# 安装依赖
pnpm install
```

### 2. 配置环境变量

复制环境变量模板并配置：

```bash
cp .env.example .env
```

配置以下关键变量：

- `OPENAI_API_KEY`: OpenAI API密钥
- `DB_*`: MySQL数据库配置
- `REDIS_*`: Redis配置
- `QDRANT_URL`: Qdrant向量数据库地址

### 3. 启动开发环境

```bash
# 使用脚本启动（推荐）
./scripts/start-dev.sh

# 或手动启动
docker-compose -f docker-compose.dev.yml up -d
pnpm run start:dev
```

### 4. API测试

使用提供的HTTP测试文件测试API：

```bash
# 使用VS Code REST Client插件或Postman
# 文件位置: test/chat-api.http
```

## API接口

### 发送消息

```http
POST /chat/send
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "content": "用户消息内容",
  "topicId": 123  // 可选，指定话题ID
}
```

### 获取话题列表

```http
GET /chat/topics
Authorization: Bearer <jwt-token>
```

### 获取话题消息

```http
GET /chat/topics/{topicId}/messages
Authorization: Bearer <jwt-token>
```

### 归档话题

```http
PUT /chat/topics/{topicId}/archive
Authorization: Bearer <jwt-token>
```

## 项目结构

```
src/
├── chat/                    # 聊天模块
│   ├── entities/           # 数据实体
│   ├── services/           # 业务服务
│   ├── chat.controller.ts  # 控制器
│   └── chat.module.ts      # 模块定义
├── auth/                   # 认证模块
├── users/                  # 用户模块
└── common/                 # 公共模块
```

## 开发

```bash
# 开发模式
pnpm run start:dev

# 构建
pnpm run build

# 测试
pnpm run test
pnpm run test:e2e

# 代码格式化
pnpm run format
```

## 部署

1. 配置生产环境变量
2. 构建项目: `pnpm run build`
3. 启动生产服务: `pnpm run start:prod`

## 文档

详细功能说明请参考: [docs/CHAT_SYSTEM.md](docs/CHAT_SYSTEM.md)

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
