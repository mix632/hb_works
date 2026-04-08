'use strict';

const { dateFormat } = require('../utils/dateUtil');

const MIN_DATE_STR = '1901-01-02 00:00:00';
const MIN_DATE = new Date(MIN_DATE_STR);

class BaseModel {
  CopyData(oldData) { return oldData || {}; }

  CopyDatas(datas) {
    if (datas && datas.length > 0) {
      for (let i = 0; i < datas.length; i++) datas[i] = this.CopyData(datas[i]);
    }
    return datas;
  }
}

function formatDate(d, fmt = 'YYYY-MM-DD HH:mm:ss') {
  if (!d) return MIN_DATE_STR;
  return dateFormat(d, fmt);
}

function parseBool(v) {
  return v === true || v === 'true' || v === 1 || v === '1';
}

function safeParse(str, defaultValue = []) {
  if (!str) return defaultValue;
  try { return typeof str === 'string' ? JSON.parse(str) : str; } catch { return str; }
}

module.exports = { BaseModel, MIN_DATE, MIN_DATE_STR, formatDate, parseBool, safeParse };
