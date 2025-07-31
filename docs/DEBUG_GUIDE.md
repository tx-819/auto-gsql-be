# 调试指南

## 1. VS Code 断点调试

### 设置断点

1. 在 VS Code 中打开你想要调试的文件
2. 点击行号左侧的空白区域设置断点（会出现红色圆点）
3. 推荐在以下位置设置断点：
   - `src/chat/services/chat.service.ts` 的 `sendMessage` 方法
   - `src/chat/services/embedding.service.ts` 的 `generateEmbedding` 方法
   - `src/chat/chat.controller.ts` 的 `sendMessage` 方法

### 启动调试

1. 按 `F5` 或点击 VS Code 左侧的调试图标
2. 选择 "Debug NestJS Application" 配置
3. 应用将在调试模式下启动，端口 9229

### 调试控制

- `F5`: 继续执行
- `F10`: 单步跳过（Step Over）
- `F11`: 单步进入（Step Into）
- `Shift+F11`: 单步跳出（Step Out）
- `F9`: 切换断点

## 2. 命令行调试

### 方法一：使用 npm 脚本

```bash
# 启动调试模式
npm run start:debug

# 或者
pnpm start:debug
```

### 方法二：手动启动

```bash
# 启动应用并开启调试
node --inspect-brk -r tsconfig-paths/register -r ts-node/register src/main.ts

# 或者使用 nodemon（如果已安装）
nodemon --inspect src/main.ts
```

## 3. 测试调试

### 调试单元测试

```bash
npm run test:debug
```

### 调试 E2E 测试

```bash
# 先启动应用
npm run start:debug

# 在另一个终端运行测试
npm run test:e2e
```

## 4. 调试 EmbeddingService

### 设置断点的关键位置

1. **EmbeddingService.generateEmbedding()**

   ```typescript
   // src/chat/services/embedding.service.ts:40
   async generateEmbedding(text: string, config: EmbeddingConfig): Promise<number[]> {
     const provider = this.providers.get(config.type); // 在这里设置断点
     if (!provider) {
       throw new Error(`Unsupported embedding type: ${config.type}`);
     }
   ```

2. **ChatService.sendMessage()**

   ```typescript
   // src/chat/services/chat.service.ts:52
   async sendMessage(dto: SendMessageDto): Promise<ChatResponse> {
     // 在这里设置断点查看传入的参数
     const { userId, content, topicId, apiKey, baseURL, model, embeddingModel } = dto;
   ```

3. **ChatController.sendMessage()**
   ```typescript
   // src/chat/chat.controller.ts:35
   async sendMessage(
     @Request() req: { user: { username: string; id: number } },
     @Body() dto: SendMessageRequestDto,
   ): Promise<ChatResponse> {
     console.log('sendMessage', dto); // 这里已经有日志
   ```

### 调试不同嵌入提供者

1. **OpenAI 嵌入**

   ```typescript
   // 在 OpenAIEmbeddingProvider.generateEmbedding() 设置断点
   const response = await openai.embeddings.create({
     model: config.model || 'text-embedding-ada-002',
     input: text,
   });
   ```

2. **本地嵌入**

   ```typescript
   // 在 LocalEmbeddingProvider.generateEmbedding() 设置断点
   const response = await fetch('http://localhost:8888/embed', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       text,
       model: config.model || 'BAAI/bge-large-zh-v1.5',
     }),
   });
   ```

3. **百度文心嵌入**
   ```typescript
   // 在 BaiduEmbeddingProvider.generateEmbedding() 设置断点
   const response = await fetch(
     'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/embeddings/embedding-v1',
     {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         Authorization: `Bearer ${config.accessToken}`,
       },
       body: JSON.stringify({ input: text }),
     },
   );
   ```

## 5. 调试技巧

### 查看变量值

- 在调试面板的 "Variables" 部分查看所有局部变量
- 在 "Watch" 部分添加表达式来监控特定值
- 在控制台中使用 `console.log()` 输出调试信息

### 条件断点

1. 右键点击断点
2. 选择 "Edit Breakpoint"
3. 输入条件表达式，例如：`config.type === 'local'`

### 日志断点

1. 右键点击断点
2. 选择 "Edit Breakpoint"
3. 选择 "Log Message"
4. 输入日志消息，例如：`Embedding type: {config.type}`

## 6. 常见问题

### 断点不生效

1. 确保 TypeScript 源码映射已启用
2. 检查 `tsconfig.json` 中的 `sourceMap: true`
3. 重新启动调试会话

### 无法连接到调试器

1. 检查端口 9229 是否被占用
2. 确保防火墙没有阻止连接
3. 尝试使用不同的端口

### 调试信息不完整

1. 确保 `skipFiles` 配置正确
2. 检查 `outFiles` 路径是否正确
3. 重新编译项目：`npm run build`
