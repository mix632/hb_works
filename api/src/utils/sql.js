'use strict';

function stringIsEmpty(str) {
  if (!str) return true;
  return !(str.toString().length > 0);
}

function AppendSQL({ oldSql, appendSQL, linkType = 'and' }) {
  if (stringIsEmpty(oldSql)) return appendSQL;
  if (stringIsEmpty(appendSQL)) return oldSql;
  return `(${oldSql}) ${linkType} (${appendSQL})`;
}

function SqlStringJoin({ ids, separator = ',', boundary = "'" }) {
  if (!ids) return '';
  if (!Array.isArray(ids)) ids = ids.split(separator);
  return ids.map(i => `${boundary}${i}${boundary}`).join(separator);
}

module.exports = { stringIsEmpty, AppendSQL, SqlStringJoin };
