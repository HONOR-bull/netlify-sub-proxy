// 从环境变量读取GitHub Token（安全！）
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// GitHub仓库信息（这些可以写在代码里，因为不敏感）
const GITHUB_USERNAME = 'HONOR-bull';  // 你的GitHub用户名
const REPO_NAME = 'test';               // 仓库名
const FILE_PATH = 'xp.yaml';             // 文件名
const BRANCH = 'main';                   // 分支名

exports.handler = async function(event, context) {
  // 设置CORS头，允许所有域名访问（订阅转换网站需要）
  const headers = {
    'Content-Type': 'text/plain; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // 处理预检请求（OPTIONS）
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // 只允许GET请求
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: 'Method Not Allowed'
    };
  }

  try {
    // 检查Token是否存在
    if (!GITHUB_TOKEN) {
      console.error('GITHUB_TOKEN环境变量未设置');
      return {
        statusCode: 500,
        headers,
        body: '服务器配置错误：未找到GitHub Token'
      };
    }

    // 构建GitHub原始文件URL
    const githubUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/${BRANCH}/${FILE_PATH}`;
    
    console.log(`正在请求: ${githubUrl}`);

    // 向GitHub发起请求，携带Token认证
    const response = await fetch(githubUrl, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'User-Agent': 'Netlify-Function-Proxy',
        'Accept': 'application/vnd.github.v3.raw'
      }
    });

    // 检查GitHub响应
    if (!response.ok) {
      console.error(`GitHub返回错误: ${response.status}`);
      return {
        statusCode: response.status,
        headers,
        body: `从GitHub获取文件失败 (HTTP ${response.status})`
      };
    }

    // 获取文件内容
    const content = await response.text();
    
    // 检查内容是否为空
    if (!content || content.trim() === '') {
      console.error('GitHub返回的内容为空');
      return {
        statusCode: 404,
        headers,
        body: '节点文件内容为空'
      };
    }

    // 返回节点内容
    return {
      statusCode: 200,
      headers,
      body: content
    };

  } catch (error) {
    // 捕获任何异常
    console.error('代理函数执行错误:', error.message);
    return {
      statusCode: 500,
      headers,
      body: `代理服务器内部错误: ${error.message}`
    };
  }
};
