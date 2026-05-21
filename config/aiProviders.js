module.exports = [
  {
    key: 'hdm-ai',
    name: 'HDM AI',
    baseUrl: process.env.HDM_AI_BASE_URL || 'https://hdmai-server.onrender.com/api/v1',
    models: ['hdm-default'],
    requiresApiKey: false
  },
  {
    key: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    requiresApiKey: true
  },
  {
    key: 'anthropic',
    name: 'Anthropic (Claude)',
    baseUrl: 'https://api.anthropic.com/v1',
    models: ['claude-3-opus', 'claude-3.5-sonnet', 'claude-3-haiku'],
    requiresApiKey: true
  },
  {
    key: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat'],
    requiresApiKey: true
  },
  {
    key: 'gemini',
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: ['gemini-pro', 'gemini-1.5-pro'],
    requiresApiKey: true
  },
  {
    key: 'mistral',
    name: 'Mistral AI',
    baseUrl: 'https://api.mistral.ai/v1',
    models: ['mistral-large', 'mistral-medium', 'mistral-small'],
    requiresApiKey: true
  },
  {
    key: 'cohere',
    name: 'Cohere',
    baseUrl: 'https://api.cohere.ai/v1',
    models: ['command-r', 'command-r-plus'],
    requiresApiKey: true
  }
];