'use strict';

const jwt = require('jsonwebtoken');
const config = require('../core/serverConfig');

/**
 * Fastify 插件：JWT 鉴权
 * jwt.verify 同时完成验签 + 解码，无需单独的 jwt-decode
 */
async function authPlugin(app, opts) {
  app.decorateRequest('userId', 0);
  app.decorateRequest('isAdmin', false);

  const whitelist = ['/', '/health'];
  const isWhitelisted = (url) => whitelist.some(p => url === p || url.startsWith(p + '?'));

  app.addHook('onRequest', async (req, reply) => {
    const authHeader = req.headers.authorization;
    if (isWhitelisted(req.url)) return;

    if (!authHeader) {
      reply.code(401).send({ Succeed: false, Message: '未授权访问', Code: 401 });
      return;
    }

    const token = authHeader.replace('Bearer ', '').replace(/"/g, '');
    if (!token || token === 'undefined') {
      reply.code(401).send({ Succeed: false, Message: '未授权访问', Code: 401 });
      return;
    }

    try {
      const payload = jwt.verify(token, config.tokenPrivateKey);
      if (payload) {
        req.userId = payload.userId ? parseInt(payload.userId) : 0;
        req.isAdmin = req.userId === 1;
      }
    } catch {
      reply.code(401).send({ Succeed: false, Message: '无效或过期的 token', Code: 401 });
    }
  });
}

module.exports = authPlugin;
