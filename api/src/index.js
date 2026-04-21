'use strict';

const path = require('path');
const fs = require('fs-extra');
const Fastify = require('fastify');
const config = require('./core/serverConfig');
const dictCache = require('./core/dictCache');

async function start() {
  const isDev = process.env.NODE_ENV !== 'production';

  // ─── 创建 Fastify 实例（自带 pino 日志） ─────────────────────
  const app = Fastify({
    logger: {
      level: isDev ? 'info' : 'warn',
      transport: isDev ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:yyyy-mm-dd HH:MM:ss' } } : undefined,
    },
    bodyLimit: 10 * 1024 * 1024,
    trustProxy: true,
    requestTimeout: 30000,
    connectionTimeout: 10000,
  });

  // ─── 全局插件 ────────────────────────────────────────────────
  await app.register(require('@fastify/cors'), {
    // 任意来源：自动回显请求 Origin（兼容 credentials）
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'istoken', 'repeatsubmit', 'repeatSubmit'],
    maxAge: 86400,
  });
  await app.register(require('@fastify/formbody'));
  await app.register(require('@fastify/multipart'), {
    limits: {
      fileSize: 50 * 1024 * 1024,
      files: 10,
    },
  });
  await app.register(require('@fastify/rate-limit'), {
    max: 200,
    timeWindow: '1 minute',
    keyGenerator: (req) => req.ip,
  });

  // ─── 中间件 ──────────────────────────────────────────────────
  await app.register(require('./middleware/errorHandler'));
  await app.register(require('./middleware/auth'));
  await app.register(require('./middleware/aes'));

  // ─── 请求计时 ────────────────────────────────────────────────
  app.addHook('onResponse', (req, reply, done) => {
    const ms = reply.elapsedTime;
    if (ms > 1000) {
      req.log.warn({ url: req.url, ms: ms.toFixed(0) }, 'slow request');
    }
    done();
  });

  // ─── 健康检查 ────────────────────────────────────────────────
  app.get('/', async () => ({ status: 'ok', time: new Date().toISOString() }));
  app.get('/health', async () => {
    try {
      await config.sequelize.authenticate();
      return { status: 'ok', db: 'connected', redis: config.redis ? 'connected' : 'disabled' };
    } catch (err) {
      return { status: 'error', db: err.message };
    }
  });

  // ─── 动态加载业务模块 ────────────────────────────────────────
  const runModules = config.config.runModules ? config.config.runModules.split(',') : [];
  const modulesDir = path.join(__dirname, 'api');

  for (const moduleName of runModules) {
    const modulePath = path.join(modulesDir, moduleName.trim());
    const indexFile = path.join(modulePath, 'index.js');
    try {
      await fs.access(indexFile);
      const modulePlugin = require(indexFile);
      await app.register(modulePlugin, { prefix: '' });
    } catch (err) {
      if (err.code === 'ENOENT') {
        app.log.warn(`Module [${moduleName}] not found, skipping`);
      } else {
        app.log.error({ err }, `Module [${moduleName}] load failed`);
      }
    }
  }

  // ─── 加载字典缓存 ────────────────────────────────────────────
  await dictCache.loadAll(app.log);

  // ─── 启动 ────────────────────────────────────────────────────
  const port = config.httpPort || 9031;
  await app.listen({ port, host: '0.0.0.0' });
  app.log.info(`Server started on http://localhost:${port}`);

  // 优雅关闭
  const shutdown = async (signal) => {
    app.log.info(`${signal} received, shutting down...`);
    await app.close();
    if (config.redis) config.redis.disconnect();
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
