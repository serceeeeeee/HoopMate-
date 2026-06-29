const { request } = require("../../utils/request");
const { DEFAULT_USER_ID } = require("../../utils/config");

Page({
  data: { sessions: [] },

  onShow() { this.loadData(); },

  loadData() {
    request({ url: `/api/training/sessions?user_id=${DEFAULT_USER_ID}&limit=100` })
      .then(data => this.setData({ sessions: data || [] }))
      .catch(() => {});
  },

  remove(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: "确认删除",
      content: "删除后该条训练记录无法恢复。",
      success: (res) => {
        if (!res.confirm) return;
        request({ url: `/api/training/sessions/${id}?user_id=${DEFAULT_USER_ID}`, method: "DELETE" })
          .then(() => {
            wx.showToast({ title: "已删除", icon: "success" });
            this.loadData();
          });
      }
    });
  }
});
