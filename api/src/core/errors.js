'use strict';

class AppError extends Error {
  constructor(message, code = 500, data = null) {
    super(message);
    this.code = code;
    this.data = data;
  }
}

class NotFoundError extends AppError {
  constructor(msg = '数据不存在') { super(msg, 404); }
}

class ValidationError extends AppError {
  constructor(msg = '参数校验失败') { super(msg, 400); }
}

class AuthError extends AppError {
  constructor(msg = '未授权访问') { super(msg, 401); }
}

/**
 * 统一返回格式（兼容现有前端）
 */
function R({ Succeed = false, Message = '', Data = null, Data1 = null, Code = 200, params, notEncryption, toRuoyi = false } = {}) {
  const obj = { Succeed, Message, Data, Data1, Code };
  if (params) Object.assign(obj, params);
  if (toRuoyi) { obj.code = Succeed ? 200 : 500; obj.msg = Message; obj.data = obj.Data; }
  if (notEncryption !== undefined) obj.notEncryption = notEncryption;
  return obj;
}

module.exports = { AppError, NotFoundError, ValidationError, AuthError, R };
