# Web Search MCP Server

一个为 AgentX 平台设计的网页搜索 MCP（Model Context Protocol）服务器，提供强大的网页搜索和内容抓取功能。

## 🚀 功能特性

- **网页搜索**: 使用 Google Custom Search API 进行互联网搜索
- **内容抓取**: 抓取指定网页的文本内容和元数据
- **智能组合**: 搜索并自动抓取前几个结果的内容
- **多语言支持**: 支持中文、英文等多种语言搜索
- **模拟模式**: 无需API密钥即可测试基本功能

## 🛠️ 工具列表

### 1. web_search
在互联网上搜索信息，返回相关的网页链接和摘要。

**参数**:
- `query` (必需): 搜索查询关键词
- `maxResults` (可选): 最大返回结果数量，默认10
- `language` (可选): 搜索语言，默认zh-CN

### 2. web_scrape
抓取指定网页的内容，提取文本和元数据。

**参数**:
- `url` (必需): 要抓取的网页URL
- `extractText` (可选): 是否提取纯文本内容，默认true
- `extractMetadata` (可选): 是否提取元数据，默认true

### 3. web_search_and_scrape
搜索网页并抓取前几个结果的内容。

**参数**:
- `query` (必需): 搜索查询关键词
- `maxResults` (可选): 最大抓取结果数量，默认3
- `language` (可选): 搜索语言，默认zh-CN

## 📦 安装和配置

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
复制 `env.example` 为 `.env` 并配置：

```bash
cp env.example .env
```

编辑 `.env` 文件：
```env
# Google Custom Search API 配置
SEARCH_API_KEY=your_google_api_key
SEARCH_ENGINE_ID=your_search_engine_id

# 可选配置
SEARCH_PROVIDER=google
REQUEST_TIMEOUT=10000
MAX_RESULTS=10
LOG_LEVEL=info
```

### 3. 获取 Google Custom Search API 密钥

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Custom Search API
4. 创建 API 密钥
5. 创建自定义搜索引擎：
   - 访问 [Google Custom Search](https://cse.google.com/)
   - 创建新的搜索引擎
   - 获取搜索引擎ID

## 🚀 运行

### 开发模式
```bash
npm run dev
```

### 生产模式
```bash
npm run build
npm start
```

## 🔧 在 AgentX 中集成

### 1. 部署到 MCP Gateway

在 AgentX 中，通过以下方式部署此 MCP 服务器：

```bash
# 使用 npm 安装命令
npm install -g web-search-mcp

# 或者使用 git 克隆
git clone https://github.com/Mantraa-Zzz/mcp.git
cd mcp
npm install
npm run build
```

### 2. 配置 AgentX

在 AgentX 的 `.env` 文件中确保 MCP Gateway 配置正确：

```env
# MCP Gateway 配置
MCP_GATEWAY_BASE_URL=http://localhost:8081
MCP_GATEWAY_API_KEY=123456
```

### 3. 重启 AgentX 容器

```bash
docker restart agentx
```

## 📝 使用示例

### 在 AgentX 中创建 Agent 时使用

1. 登录 AgentX 管理界面
2. 创建新的 Agent
3. 在工具配置中选择 "web_search" 相关工具
4. Agent 将能够使用网页搜索功能

### 示例对话

**用户**: "帮我搜索最新的 AI 技术趋势"

**Agent**: 我将为您搜索最新的 AI 技术趋势信息。

*调用 web_search 工具*
- 查询: "最新 AI 技术趋势 2024"
- 返回相关网页链接和摘要

**用户**: "抓取第一个搜索结果的内容"

**Agent**: 我将抓取第一个搜索结果的详细内容。

*调用 web_scrape 工具*
- URL: [第一个搜索结果的URL]
- 返回完整的网页内容

## 🔍 测试

### 模拟模式测试
即使没有配置 Google API 密钥，服务器也会返回模拟数据，方便测试基本功能。

### 真实 API 测试
配置正确的 API 密钥后，可以获取真实的搜索结果。

## 📋 技术栈

- **TypeScript**: 主要开发语言
- **@modelcontextprotocol/sdk**: MCP 协议实现
- **Axios**: HTTP 客户端
- **Cheerio**: HTML 解析和内容提取
- **dotenv**: 环境变量管理

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 📄 许可证

MIT License

## 🔗 相关链接

- [AgentX 项目](https://github.com/Mantraa-Zzz/AgentX)
- [MCP 协议文档](https://modelcontextprotocol.io/)
- [Google Custom Search API](https://developers.google.com/custom-search/v1/introduction)
