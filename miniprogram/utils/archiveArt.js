// 资料库条目配图（2026-10-24）：detail 页头卡画片按条目取图。
// 优先级：主站人物/事件专属图（archiveArtMatch.js 标题匹配，零下载）>
// 资料库自抓图（archiveArtRemote.js 清单，data/img/archive/<栏目>/<id>.jpg，jsDelivr）>
// ''（无图，详情页只保留分类题图）。仅 figures/emperors/events/wars 四类有图。
// 远端图加载失败时用 eraImages.altArt 换备用域名重试一次。
const eraImages = require('./eraImages.js');
const MATCH = require('./archiveArtMatch.js');
const REMOTE = require('./archiveArtRemote.js');

const ARCHIVE_BASE = eraImages.IMG_BASE + '/archive';

function matchedImage(kind, id) {
  const hit = MATCH[kind] && MATCH[kind][id];
  if (!hit) return '';
  if (hit[0] === 'p') {
    return eraImages.PERSON_ART[hit[1]] || eraImages.remotePerson(hit[1]) || '';
  }
  return eraImages.EVENT_ART[hit[1]] || eraImages.remoteEvent(hit[1]) || '';
}

function remoteImage(kind, id) {
  const ids = REMOTE[kind];
  return ids && ids.indexOf(id) >= 0 ? ARCHIVE_BASE + '/' + kind + '/' + id + '.jpg' : '';
}

function entryImage(kind, id) {
  return matchedImage(kind, id) || remoteImage(kind, id);
}

module.exports = { entryImage, matchedImage, remoteImage };
