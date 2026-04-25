'use strict';

const Sequelize = require('sequelize');
const path = require('path');
const os = require('os');
const Redis = require('ioredis');

const cfg = require(path.join(process.cwd(), 'config.json'));
const env = cfg[cfg.useConfig];

class ServerConfig {
  constructor() {
    this.config = cfg;
    this.currentConfig = env;

    this.dbConfig = {
      host: env.db.host,
      port: env.db.port,
      username: env.db.username,
      password: env.db.password,
      database: env.db.database,
      type: env.db.type,
      dialectOptions: env.db.dialectOptions || {},
      onePageCount: env.db.page_one_page_count || 30,
    };

    // 按 CPU 核心数动态分配连接池，保证总连接数 ≤ MySQL max_connections（默认 151）
    // PM2 cluster 模式下每个进程分到 maxPoolPerProcess 个连接
    const cpuCount = os.cpus().length;
    const maxTotal = env.db.max_connections || 120;
    const maxPoolPerProcess = Math.max(5, Math.floor(maxTotal / cpuCount));
    const pool = { max: maxPoolPerProcess, min: 2, idle: 10000, acquire: 15000, evict: 1000 };
    const common = { dialect: this.dbConfig.type, dialectOptions: this.dbConfig.dialectOptions, pool, logging: false, timezone: '+08:00' };

    const repl = env.db_replication;
    this.sequelize = repl && repl.isUse
      ? new Sequelize(this.dbConfig.database, this.dbConfig.username, this.dbConfig.password, { port: this.dbConfig.port, replication: repl.config, ...common })
      : new Sequelize(this.dbConfig.database, this.dbConfig.username, this.dbConfig.password, { host: this.dbConfig.host, port: this.dbConfig.port, ...common });

    this.redisConfig = env.redis;
    this.redis = null;
    if (this.redisConfig.isUse) {
      this.redis = new Redis(this.redisConfig);
    }

    this.mongodbConfig = env.mongodb || { isUse: false };

    this.httpPort = env.port;
    this.tokenPrivateKey = env.tokenPrivateKey || 'mamsllsla';
    this.aes = env.aes || { isUse: false };
    this.dbType = { mysql: 'mysql', sqlserver: 'mssql' };

    this.upload = {
      path: 'upload',
      fullPath: path.join(process.cwd(), 'upload'),
    };
    if (cfg.uploadBaseDir) {
      this.upload.fullPath = path.join(cfg.uploadBaseDir, 'upload');
    }
  }
}

module.exports = new ServerConfig();
