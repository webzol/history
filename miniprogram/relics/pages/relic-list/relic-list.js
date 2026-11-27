const font = require('../../../utils/font.js');
const share = require('../../../utils/share.js');
const { ERAS, TYPES, RELICS, DETAIL_PATH, imagePath, shareMessage } = require('../../catalog.js');
const remote = require('../../remote.js');

const { PAGE_SIZE } = remote;
const TYPE_OPTIONS = ['全部', ...TYPES];
const ERA_OPTIONS = ['不限', ...ERAS];

Page({
  data: {
    fontClass: 'm',
    types: TYPE_OPTIONS,
    eras: ERA_OPTIONS,
    typeIndex: 0,
    eraIndex: 0,
    filterSheet: null,
    rows: [],
    count: 0,
    hasMore: false,
    hasLocalMore: false,
    remoteState: ''
  },

  onLoad() {
    this.unloaded = false;
    share.enableMenu();
    font.apply(this);
    this.updateFilters(0, 0);
    this.loadManifest();
  },

  onShow() { font.apply(this); },

  onUnload() { this.unloaded = true; },

  loadManifest() {
    if (this.manifestPending) return;
    this.manifestPending = true;
    this.setData({ remoteState: 'loading' });
    remote.getManifest((error, manifest) => {
      this.manifestPending = false;
      if (this.unloaded) return;
      if (error) return this.setData({ remoteState: 'retry' });
      this.manifest = manifest;
      this.syncRemoteGroup(this.data.typeIndex, this.data.eraIndex);
      this.setData({ count: this.totalCount(), hasMore: this.data.rows.length < this.totalCount(), remoteState: '' });
      if (!this.matches.length && this.group) this.loadMore();
    });
  },

  openFilter(e) {
    const kind = e.currentTarget.dataset.kind;
    const isType = kind === 'type';
    this.setData({ filterSheet: {
      kind,
      title: isType ? '选择器类' : '选择时代',
      options: isType ? TYPE_OPTIONS : ERA_OPTIONS,
      selected: isType ? this.data.typeIndex : this.data.eraIndex
    } });
  },

  closeFilter() { this.setData({ filterSheet: null }); },

  onFilterPick(e) {
    const sheet = this.data.filterSheet;
    const index = Number(e.currentTarget.dataset.index);
    if (!sheet || !Number.isInteger(index) || index < 0 || index >= sheet.options.length) return;
    if (index === sheet.selected) return this.closeFilter();
    this.updateFilters(sheet.kind === 'type' ? index : this.data.typeIndex,
      sheet.kind === 'era' ? index : this.data.eraIndex);
  },

  noop() {},

  resetFilters() { this.updateFilters(0, 0); },

  updateFilters(typeIndex, eraIndex) {
    this.filterRevision = (this.filterRevision || 0) + 1;
    this.remotePage = 0;
    this.matches = RELICS.filter(item => (!typeIndex || item.type === TYPE_OPTIONS[typeIndex])
      && (!eraIndex || item.eras.includes(ERA_OPTIONS[eraIndex])));
    this.syncRemoteGroup(typeIndex, eraIndex);
    const remoteState = this.manifestPending ? 'loading' : this.manifest ? '' : this.data.remoteState;
    this.setData({ typeIndex, eraIndex, filterSheet: null, remoteState, count: this.totalCount(), ...this.nextRows(0) });
    if (!this.matches.length && this.group) this.loadMore();
  },

  syncRemoteGroup(typeIndex, eraIndex) {
    this.group = remote.groupFor(this.manifest, typeIndex ? TYPE_OPTIONS[typeIndex] : '', eraIndex ? ERA_OPTIONS[eraIndex] : '');
  },

  totalCount() { return this.matches.length + (this.group?.count || 0); },

  nextRows(offset) {
    const batch = this.matches.slice(offset, offset + PAGE_SIZE).map(({ id, title, period, shortPeriod, type }) => ({
      id, title, period: shortPeriod || period, type, thumb: imagePath(id, 'thumb')
    }));
    const loaded = offset + batch.length;
    return { rows: offset ? this.data.rows.concat(batch) : batch, hasMore: loaded < this.totalCount(), hasLocalMore: loaded < this.matches.length };
  },

  loadMore() {
    const loaded = this.data.rows.length;
    if (loaded < this.matches.length) return this.setData(this.nextRows(loaded));
    if (!this.group || this.data.remoteState === 'loading' || loaded >= this.totalCount()) return;
    const revision = this.filterRevision;
    this.setData({ remoteState: 'loading' });
    remote.getPage(this.group, this.remotePage, (error, data) => {
      if (this.unloaded || revision !== this.filterRevision) return;
      if (error) return this.setData({ remoteState: 'retry' });
      this.remotePage += 1;
      const rows = this.data.rows.concat(data.rows.map(({ id, title, period, type }) => ({
        id, title, period, type, thumb: remote.imageUrl(id, 'thumb')
      })));
      this.setData({ rows, hasMore: rows.length < this.totalCount(), remoteState: '' });
    });
  },

  retryRemote() {
    if (this.manifest) this.loadMore();
    else this.loadManifest();
  },

  onThumbError(e) {
    const { index, id, url } = e.currentTarget.dataset;
    const row = this.data.rows[index];
    if (!row || row.id !== id || row.thumb !== url) return;
    const alt = remote.alternateImage(url);
    this.setData({ [`rows[${index}].thumb`]: alt || '' });
  },

  openRelic(e) {
    wx.navigateTo({ url: `${DETAIL_PATH}?id=${encodeURIComponent(e.currentTarget.dataset.id)}` });
  },

  goBack() {
    wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/home/home' }) });
  },

  onShareAppMessage() { return shareMessage(); },

  onShareTimeline() {
    const { title, imageUrl } = this.onShareAppMessage();
    return { title, imageUrl };
  }
});
