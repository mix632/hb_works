'use strict';

const { AppError } = require('../core/errors');

async function errorHandlerPlugin(app) {
  app.setErrorHandler((error, req, reply) => {
    const code = error instanceof AppError ? error.code : (error.statusCode || 500);

    if (code >= 500) {
      req.log.error({ err: error, url: req.url, method: req.method }, 'Internal error');
    }

    reply.code(code).send({
      Succeed: false,
      Message: error.message || '服务器错误',
      Code: code,
    });
  });

  app.setNotFoundHandler((req, reply) => {
    reply.code(404).send({ Succeed: false, Message: '接口不存在', Code: 404 });
  });
}

module.exports = errorHandlerPlugin;
