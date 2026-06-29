const { request } = require("../../utils/request");
const { API_BASE, DEFAULT_USER_ID } = require("../../utils/config");

Page({
  data: {
    profile: {},
    levels: ["初级", "中级", "高级"],
    positions: ["PG", "SG", "SF", "PF", "C"],
    exportUrl: "",
    avatarLetter: "H",
    selectedPosition: "SG"
  },

  onShow() { this.loadProfile(); },

  loadProfile() {
    request({ url: `/api/users/profile?user_id=${DEFAULT_USER_ID}` })
      .then(data => this.setData({
        profile: data,
        avatarLetter: (data.nickname || "H").slice(0, 1),
        selectedPosition: data.position || "SG"
      }))
      .catch(() => {});
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`profile.${field}`]: e.detail.value });
  },

  onNumberInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`profile.${field}`]: Number(e.detail.value || 0) });
  },

  chooseLevel(e) {
    this.setData({ "profile.skill_level": e.currentTarget.dataset.value });
  },

  choosePosition(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({ "profile.position": value, selectedPosition: value });
  },

  save() {
    const payload = Object.assign({}, this.data.profile);
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    request({ url: `/api/users/profile?user_id=${DEFAULT_USER_ID}`, method: "PUT", data: payload })
      .then(data => {
        this.setData({ profile: data, avatarLetter: (data.nickname || "H").slice(0, 1), selectedPosition: data.position || "SG" });
        wx.showToast({ title: "保存成功", icon: "success" });
      });
  },

  seedDemo() {
    request({ url: `/api/demo/seed?user_id=${DEFAULT_USER_ID}`, method: "POST" })
      .then(data => wx.showToast({ title: data.message || "已加载", icon: "success" }));
  },

  exportCsv() {
    const url = `${API_BASE}/api/export/csv?user_id=${DEFAULT_USER_ID}`;
    this.setData({ exportUrl: url });
    wx.setClipboardData({ data: url });
    wx.showToast({ title: "导出链接已复制", icon: "success" });
  },

  clearLocal() {
    wx.clearStorageSync();
    wx.showToast({ title: "本地缓存已清理", icon: "success" });
  },

  goPlayers() { wx.navigateTo({ url: "/pages/players/players" }); },
  goAbout() { wx.navigateTo({ url: "/pages/about/about" }); }
});
