const { request } = require("../../utils/request");
const { DEFAULT_USER_ID } = require("../../utils/config");

Page({
  data: {
    summary: {},
    recommendations: [],
    cards: [],
    plan: [],
    status: "待记录",
    statusTag: "暂无数据"
  },

  onShow() { this.loadData(); },

  loadData() {
    request({ url: `/api/recommendations?user_id=${DEFAULT_USER_ID}` })
      .then(data => {
        const summary = data.summary || {};
        const recommendations = data.recommendations || [];
        this.setData({
          summary,
          recommendations,
          cards: recommendations.map((text, index) => this.toAdviceCard(text, index)),
          plan: this.buildPlan(summary),
          status: this.buildStatus(summary),
          statusTag: this.buildStatusTag(summary)
        });
      })
      .catch(() => {});
  },

  toAdviceCard(text, index) {
    let title = "综合训练建议";
    let type = "综合";
    let priority = "中";
    let target = "保持训练连续性";
    if (text.indexOf("三分") >= 0) { title = "三分专项建议"; type = "投篮"; priority = "高"; target = "提升外线稳定性"; }
    else if (text.indexOf("罚球") >= 0) { title = "罚球稳定性建议"; type = "投篮"; priority = "中"; target = "提升固定节奏"; }
    else if (text.indexOf("体能") >= 0 || text.indexOf("强度") >= 0 || text.indexOf("恢复") >= 0) { title = "训练负荷与恢复建议"; type = "恢复"; priority = "中"; target = "避免疲劳累积"; }
    else if (text.indexOf("运球") >= 0) { title = "控球专项建议"; type = "运球"; priority = "中"; target = "补足弱侧控球"; }
    else if (text.indexOf("次数") >= 0 || text.indexOf("频率") >= 0 || text.indexOf("连续") >= 0) { title = "训练频率建议"; type = "频率"; priority = "高"; target = "形成固定训练节奏"; }
    return { id: index + 1, title, type, priority, content: text, target };
  },

  buildStatus(summary) {
    if (!summary.total_sessions) return "待建立训练数据";
    if ((summary.avg_shooting_rate || 0) >= 55 && (summary.recent_7day_sessions || 0) >= 3) return "状态稳定提升中";
    if ((summary.recent_7day_sessions || 0) < 2) return "训练连续性需加强";
    return "处于提升阶段";
  },

  buildStatusTag(summary) {
    if (!summary.total_sessions) return "请先记录训练";
    if ((summary.avg_intensity || 0) >= 8) return "注意恢复";
    if ((summary.avg_shooting_rate || 0) >= 55) return "表现稳定";
    return "继续优化";
  },

  buildPlan(summary) {
    if (!summary.total_sessions) {
      return [
        { day: "第 1 次", title: "基础记录", minutes: 45, detail: "完成一次投篮训练并记录数据" },
        { day: "第 2 次", title: "投篮复盘", minutes: 50, detail: "罚球 + 中投，建立基准命中率" },
        { day: "第 3 次", title: "综合训练", minutes: 60, detail: "运球 + 体能 + 投篮" }
      ];
    }
    const lowThree = (summary.three_rate || 0) > 0 && (summary.three_rate || 0) < 35;
    return [
      { day: "周一", title: "投篮基础", minutes: 45, detail: "罚球 30 次 + 中投 5 组" },
      { day: "周三", title: lowThree ? "三分专项" : "控球体能", minutes: 60, detail: lowThree ? "底角和弧顶定点三分" : "弱侧手运球 + 折返跑" },
      { day: "周五", title: "综合训练", minutes: 70, detail: "移动接球投篮 + 对抗上篮" },
      { day: "周日", title: "复盘恢复", minutes: 35, detail: "低强度投篮 + 拉伸恢复" }
    ];
  },

  refreshAdvice() { this.loadData(); wx.showToast({ title: "建议已更新", icon: "success" }); },
  goRecord() { wx.switchTab({ url: "/pages/record/record" }); }
});
