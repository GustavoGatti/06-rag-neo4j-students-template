const defaultModel = process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini';

export const config = {
  apiKey: process.env.OPENROUTER_API_KEY ?? '',
  httpReferer: process.env.OPENROUTER_HTTP_REFERER ?? 'http://localhost:4000',
  xTitle: process.env.OPENROUTER_X_TITLE ?? 'IA Devs - Sales Analytics Reporter',
  models: [defaultModel],
  provider: {
    sort: {
      by: 'throughput',
      partition: 'none',
    },
  },
  temperature: 0.7,
  neo4j: {
    uri: 'neo4j://localhost:7687',
    username: 'neo4j',
    password: 'password',
  },
  maxCorrectionAttempts: 1,
  maxSubQuestions: 3,
  port: Number(process.env.PORT ?? 4000),
};

export default config;
