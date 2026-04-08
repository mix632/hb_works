'use strict';

const pad2 = n => String(n).padStart(2, '0');

/**
 * 轻量日期格式化（替代 moment.js，2KB vs 300KB）
 * 支持 tokens: YYYY MM DD HH mm ss
 */
function dateFormat(date, fmt = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return fmt
    .replace('YYYY', d.getFullYear())
    .replace('MM', pad2(d.getMonth() + 1))
    .replace('DD', pad2(d.getDate()))
    .replace('HH', pad2(d.getHours()))
    .replace('mm', pad2(d.getMinutes()))
    .replace('ss', pad2(d.getSeconds()));
}

function nowStr(fmt = 'YYYY-MM-DD HH:mm:ss') {
  return dateFormat(new Date(), fmt);
}

module.exports = { dateFormat, nowStr };
