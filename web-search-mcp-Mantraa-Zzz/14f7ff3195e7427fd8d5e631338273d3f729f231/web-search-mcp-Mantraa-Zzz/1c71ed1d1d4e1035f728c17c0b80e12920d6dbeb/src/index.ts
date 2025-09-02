#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 搜索结果显示接口
interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  rank: number;
}

// 网页内容接口
interface WebPageContent {
  url: string;
  title: string;
  content: string;
  metadata: {
    description?: string;
    keywords?: string;
    author?: string;
    publishedDate?: string;
  };
}

class WebSearchMCPServer {
  private server: Server;
  private searchApiKey: string;
  private searchEngineId: string;
  private searchProvider: string;
  private requestTimeout: number;
  private maxResults: number;

  constructor() {
    this.server = new Server(
      {
        name: 'web-search-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // 从环境变量获取配置
    this.searchApiKey = process.env.SEARCH_API_KEY || '';
    this.searchEngineId = process.env.SEARCH_ENGINE_ID || '';
    this.searchProvider = process.env.SEARCH_PROVIDER || 'google';
    this.requestTimeout = parseInt(process.env.REQUEST_TIMEOUT || '10000');
    this.maxResults = parseInt(process.env.MAX_RESULTS || '10');

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // 列出可用工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'web_search',
            description: '在互联网上搜索信息，返回相关的网页链接和摘要',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: '搜索查询关键词',
                },
                maxResults: {
                  type: 'number',
                  description: '最大返回结果数量（默认10）',
                  default: 10,
                },
                language: {
                  type: 'string',
                  description: '搜索语言（如：zh-CN, en-US）',
                  default: 'zh-CN',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'web_scrape',
            description: '抓取指定网页的内容，提取文本和元数据',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: '要抓取的网页URL',
                },
                extractText: {
                  type: 'boolean',
                  description: '是否提取纯文本内容（默认true）',
                  default: true,
                },
                extractMetadata: {
                  type: 'boolean',
                  description: '是否提取元数据（默认true）',
                  default: true,
                },
              },
              required: ['url'],
            },
          },
          {
            name: 'web_search_and_scrape',
            description: '搜索网页并抓取前几个结果的内容',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: '搜索查询关键词',
                },
                maxResults: {
                  type: 'number',
                  description: '最大抓取结果数量（默认3）',
                  default: 3,
                },
                language: {
                  type: 'string',
                  description: '搜索语言（如：zh-CN, en-US）',
                  default: 'zh-CN',
                },
              },
              required: ['query'],
            },
          },
        ] as Tool[],
      };
    });

    // 处理工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'web_search':
            return await this.handleWebSearch(args);
          case 'web_scrape':
            return await this.handleWebScrape(args);
          case 'web_search_and_scrape':
            return await this.handleWebSearchAndScrape(args);
          default:
            throw new Error(`未知工具: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `错误: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async handleWebSearch(args: any) {
    const { query, maxResults = 10, language = 'zh-CN' } = args;

    if (!this.searchApiKey || !this.searchEngineId) {
      // 如果没有配置API密钥，使用模拟数据
      return this.getMockSearchResults(query, maxResults);
    }

    try {
      const results = await this.performWebSearch(query, maxResults, language);
      
      const formattedResults = results.map((result, index) => 
        `${index + 1}. **${result.title}**\n   URL: ${result.url}\n   摘要: ${result.snippet}\n`
      ).join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `搜索 "${query}" 的结果：\n\n${formattedResults}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`搜索失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async handleWebScrape(args: any) {
    const { url, extractText = true, extractMetadata = true } = args;

    try {
      const content = await this.scrapeWebPage(url, extractText, extractMetadata);
      
      let result = `网页内容抓取结果：\n\n`;
      result += `**标题**: ${content.title}\n`;
      result += `**URL**: ${content.url}\n\n`;
      
      if (extractMetadata && content.metadata) {
        result += `**元数据**:\n`;
        if (content.metadata.description) {
          result += `- 描述: ${content.metadata.description}\n`;
        }
        if (content.metadata.keywords) {
          result += `- 关键词: ${content.metadata.keywords}\n`;
        }
        if (content.metadata.author) {
          result += `- 作者: ${content.metadata.author}\n`;
        }
        if (content.metadata.publishedDate) {
          result += `- 发布日期: ${content.metadata.publishedDate}\n`;
        }
        result += `\n`;
      }
      
      if (extractText) {
        result += `**内容摘要** (前500字符):\n${content.content.substring(0, 500)}${content.content.length > 500 ? '...' : ''}`;
      }

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`网页抓取失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async handleWebSearchAndScrape(args: any) {
    const { query, maxResults = 3, language = 'zh-CN' } = args;

    try {
      // 首先进行搜索
      const searchResults = await this.performWebSearch(query, maxResults, language);
      
      let result = `搜索 "${query}" 并抓取内容：\n\n`;
      
      // 然后抓取每个结果的内容
      for (let i = 0; i < searchResults.length; i++) {
        const searchResult = searchResults[i];
        result += `## ${i + 1}. ${searchResult.title}\n`;
        result += `**URL**: ${searchResult.url}\n`;
        result += `**搜索摘要**: ${searchResult.snippet}\n\n`;
        
        try {
          const scrapedContent = await this.scrapeWebPage(searchResult.url, true, false);
          result += `**抓取内容摘要** (前300字符):\n${scrapedContent.content.substring(0, 300)}${scrapedContent.content.length > 300 ? '...' : ''}\n\n`;
        } catch (scrapeError) {
          result += `**抓取失败**: ${scrapeError instanceof Error ? scrapeError.message : String(scrapeError)}\n\n`;
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`搜索和抓取失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async performWebSearch(query: string, maxResults: number, language: string): Promise<SearchResult[]> {
    const url = `https://www.googleapis.com/customsearch/v1`;
    const params = {
      key: this.searchApiKey,
      cx: this.searchEngineId,
      q: query,
      num: Math.min(maxResults, 10),
      lr: `lang_${language}`,
    };

    const response = await axios.get(url, {
      params,
      timeout: this.requestTimeout,
    });

    const items = response.data.items || [];
    return items.map((item: any, index: number) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      rank: index + 1,
    }));
  }

  private async scrapeWebPage(url: string, extractText: boolean, extractMetadata: boolean): Promise<WebPageContent> {
    const response = await axios.get(url, {
      timeout: this.requestTimeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    const $ = cheerio.load(response.data);
    
    const title = $('title').text().trim() || '无标题';
    let content = '';
    let metadata: any = {};

    if (extractText) {
      // 移除脚本和样式标签
      $('script, style, nav, header, footer, aside').remove();
      content = $('body').text().replace(/\s+/g, ' ').trim();
    }

    if (extractMetadata) {
      metadata = {
        description: $('meta[name="description"]').attr('content') || 
                    $('meta[property="og:description"]').attr('content'),
        keywords: $('meta[name="keywords"]').attr('content'),
        author: $('meta[name="author"]').attr('content') || 
                $('meta[property="article:author"]').attr('content'),
        publishedDate: $('meta[property="article:published_time"]').attr('content') ||
                      $('meta[name="date"]').attr('content'),
      };
    }

    return {
      url,
      title,
      content,
      metadata,
    };
  }

  private getMockSearchResults(query: string, maxResults: number): any {
    const mockResults = [
      {
        title: `关于"${query}"的搜索结果1`,
        url: 'https://example.com/result1',
        snippet: `这是关于"${query}"的示例搜索结果摘要1。`,
        rank: 1,
      },
      {
        title: `关于"${query}"的搜索结果2`,
        url: 'https://example.com/result2',
        snippet: `这是关于"${query}"的示例搜索结果摘要2。`,
        rank: 2,
      },
      {
        title: `关于"${query}"的搜索结果3`,
        url: 'https://example.com/result3',
        snippet: `这是关于"${query}"的示例搜索结果摘要3。`,
        rank: 3,
      },
    ].slice(0, maxResults);

    const formattedResults = mockResults.map((result) => 
      `${result.rank}. **${result.title}**\n   URL: ${result.url}\n   摘要: ${result.snippet}\n`
    ).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `搜索 "${query}" 的结果（模拟数据）:\n\n${formattedResults}\n\n注意：这是模拟数据，请配置SEARCH_API_KEY和SEARCH_ENGINE_ID以获取真实搜索结果。`,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Web Search MCP Server 已启动');
  }
}

// 启动服务器
const server = new WebSearchMCPServer();
server.run().catch(console.error);
