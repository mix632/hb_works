'use strict';

const crypto = require('crypto');

/** SQL 字符串中单引号转义 */
function sqlEsc(s) {
  return String(s ?? '').replace(/'/g, "''");
}

function md5Hex(str) {
  return crypto.createHash('md5').update(String(str || ''), 'utf8').digest('hex');
}

module.exports = { sqlEsc, md5Hex };
