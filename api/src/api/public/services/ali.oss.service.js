'use strict';

const { dateFormat, nowStr } = require('../../../utils/dateUtil');
const BaseService = require('../../../core/baseService');
const { R } = require('../../../core/errors');
const util = require('../../../utils');
const config = require('../../../core/serverConfig');
const serviceRegistry = require('../../../core/serviceRegistry');
const { md5Hex } = require('./ruoyiUtil');
const { koaBody } = require('koa-body'); 

class AliOssService extends BaseService {
  constructor() {
    super({ prefix: '/api/alioss' });
  }

  get factory() {
    return require('../factory');
  }

  // ─── 路由：/public/user/*；若依兼容：/ruoyi/system/user*、POST /ruoyi/resetPwd ──
  registerRoutes(app) {
    const p = this.prefix;
    app.post(`${p}/upload`, koaBody({ multipart: true }), (req, reply) => this.upload(req, reply));
    app.get(`${p}/exists`, (req, reply) => this.exists(req, reply));
    app.put(`${p}/put`, (req, reply) => this.put(req, reply));

    this.init();
  }

  async init() {
    const OSS = await require('ali-oss');
    this.store = new OSS({
      region: config.currentConfig.aliyun.oss.region,
      accessKeyId: config.currentConfig.aliyun.accessKeyId,
      accessKeySecret: config.currentConfig.aliyun.accessKeySecret,
      bucket: config.currentConfig.aliyun.oss.bucket,
    });
  }

  async putBufferToOss(buffer, filepath, filename) {
    try {
      const result = await this.store.put(filepath, buffer);
      return {
        name: filename,
        path: result.name,
      };
    } catch (err) {
      console.error('上传失败:', err);
      throw err;
    }
  }

  async put(req, reply) {
    const params = this._params(req);
    try {
      const { objectKey, filePath, buffer, bufferBase64 } = params || {};
      if (!objectKey) {
        return R({ succeed: false, msg: 'objectKey 必填' });
      }
      let buf;
      if (filePath != null && filePath !== '') {
        const abs = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
        buf = await fs.readFile(abs);
      } else if (Buffer.isBuffer(buffer)) {
        buf = buffer;
      } else if (buffer && buffer.type === 'Buffer' && Array.isArray(buffer.data)) {
        buf = Buffer.from(buffer.data);
      } else if (bufferBase64 != null && bufferBase64 !== '') {
        buf = Buffer.from(bufferBase64, 'base64');
      } else {
        return R({ succeed: false, msg: '请传入 filePath、buffer 或 bufferBase64 之一' });
      }
      const item = await this.putBufferToOss(buf, objectKey, path.basename(objectKey));
      return R({ succeed: true, data: item });
    } catch (error) {
      return R({ succeed: false, msg: error.message });
    }
  }

  async exists(req, reply) {
    const params = this._params(req);
    const objectKey = params && (params.path);
    if (!objectKey) {
      return R({ succeed: false, msg: 'path 不能为空' });
    }
    try {
      await this.store.head(objectKey);
      return R({ succeed: true, data: true });
    } catch (e) {
      if (e.status === 404 || e.code === 'NoSuchKey' || (e.name && e.name.includes('NoSuch'))) {
        return R({ succeed: true, data: false });
      }
      return R({ succeed: false, msg: e.message });
    }
  }

  /** 若依：管理员重置用户密码 — PUT|POST /system/user/resetPwd */
  async upload(req, reply) {
    return 10
    console.log(1)
    try {
      const raw = ctx && ctx.request && ctx.request.files && ctx.request.files.file;
      if (!raw) {
        return R({ succeed: false, msg: '未发现文件' });
      }
      const files = Array.isArray(raw) ? raw : [raw];
      const results = [];
      for (const file of files) {
        const buffer = await fs.readFile(file.filepath);
        const original = file.originalFilename || '';
        const ext = path.extname(original) || '';
        const filepath = `${params.path ? `${params.path}/` : ''}${UUID.v4()}${ext}`;
        const item = await this.putBufferToOss(buffer, filepath, original);
        results.push(item);
      }
      return R({ succeed: true, data: results });
    } catch (error) {
      return R({ succeed: false, msg: error.message });
    }
  }
}

module.exports = new AliOssService();