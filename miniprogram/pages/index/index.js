const { request } = require("../../utils/request");
const { DEFAULT_USER_ID } = require("../../utils/config");
const { clampPercent } = require("../../utils/format");

Page({
  data: {
    summary: {},
    profile: {},
    latest: null,
    weekProgress: 0,
    targetRateProgress: 0,
    loading: false
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    Promise.all([
      request({ url: `/api/analysis/summary?user_id=${DEFAULT_USER_ID}` }),
      request({ url: `/api/users/profile?user_id=${DEFAULT_USER_ID}` }),
      request({ url: `/api/training/sessions?user_id=${DEFAULT_USER_ID}&limit=1` })
    ]).then(([summary, profile, sessions]) => {
      const weeklyGoal = Number(profile.weekly_goal_sessions || 3);
      const targetRate = Number(profile.target_shooting_rate || 55);
      this.setData({
        summary,
        profile,
        latest: (sessions && sessions[0]) || null,
        weekProgress: clampPercent(Math.round((summary.recent_7day_sessions || 0) / weeklyGoal * 100)),
        targetRateProgress: clampPercent(Math.round((summary.avg_shooting_rate || 0) / targetRate * 100))
      });
    }).catch(() => {});
  },

  goRecord() { wx.switchTab({ url: "/pages/record/record" }); },
  goAnalysis() { wx.switchTab({ url: "/pages/analysis/analysis" }); },
  goAdvice() { wx.switchTab({ url: "/pages/advice/advice" }); },
  goProfile() { wx.switchTab({ url: "/pages/profile/profile" }); },
  goPlayers() { wx.navigateTo({ url: "/pages/players/players" }); },
  goAbout() { wx.navigateTo({ url: "/pages/about/about" }); },

  seedDemo() {
    this.setData({ loading: true });
    request({ url: `/api/demo/seed?user_id=${DEFAULT_USER_ID}`, method: "POST" })
      .then((res) => {
        wx.showToast({ title: res.message || "示例数据已加载", icon: "success" });
        this.loadData();
      })
      .finally(() => this.setData({ loading: false }));
  }
});
