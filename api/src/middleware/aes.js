'use strict';

const crypto = require('crypto');
const config = require('../core/serverConfig');

async function aesPlugin(app) {
  if (!config.aes || !config.aes.isUse) return;

  const key = Buffer.from(config.aes.key, 'base64');
  const iv = Buffer.from(config.aes.iv, 'base64');

  function encrypt(text) {
    if (!text) return text;
    if (typeof text === 'object') text = JSON.stringify(text);
    else if (typeof text !== 'string') text = String(text);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    return cipher.update(text, 'utf8', 'base64') + cipher.final('base64');
  }

  app.addHook('onSend', async (req, reply, payload) => {
    if (!payload || typeof payload !== 'string') return payload;
    try {
      const body = JSON.parse(payload);
      if (body.notEncryption) return payload;
      if (body.msg) body.msg = encrypt(body.msg);
      if (body.Data) body.Data = encrypt(body.Data);
      if (body.msg) body.msg = encrypt(body.msg);
      if (body.data) body.data = encrypt(body.data);
      return JSON.stringify(body);
    } catch {
      return payload;
    }
  });
}

module.exports = aesPlugin;
