'use strict';

const { dateFormat } = require('./dateUtil');
const { stringIsEmpty, AppendSQL, SqlStringJoin } = require('./sql');
const { R } = require('../core/errors');
const { formatDate, parseBool, safeParse } = require('../core/baseModel');

module.exports = {
  stringIsEmpty,
  AppendSQL,
  SqlStringJoin,
  BaseRetrun: R,
  formatDate,
  parseBool,
  safeParse,

  filter2Array({ list }) {
    if (!list) return [];
    if (typeof list === 'string') list = list.split(',');
    return list.filter(e => e != null && e !== '');
  },

  objectDateToString({ model }) {
    if (!model || typeof model !== 'object') return model;
    for (const key of Object.keys(model)) {
      const val = model[key];
      if (val instanceof Date) model[key] = dateFormat(val);
      else if (val && typeof val === 'object' && !Array.isArray(val)) this.objectDateToString({ model: val });
      else if (Array.isArray(val)) val.forEach(item => { if (typeof item === 'object') this.objectDateToString({ model: item }); });
    }
    return model;
  },

  trim(str, s) {
    if (!str) return str;
    if (!s) return str.trim();
    return str.replace(new RegExp(`^[${s}]+|[${s}]+$`, 'g'), '');
  },

  formatZero(num, length) {
    return String(num).padStart(length, '0');
  },
};
