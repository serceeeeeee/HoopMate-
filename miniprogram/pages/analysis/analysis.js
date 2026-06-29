const { request } = require("../../utils/request");
const { DEFAULT_USER_ID } = require("../../utils/config");
const { clampPercent } = require("../../utils/format");

Page({
  data: {
    ranges: [
      { label: "近 7 次", limit: 7 },
      { label: "近 12 次", limit: 12 },
      { label: "全部", limit: 50 }
    ],
    rangeIndex: 1,
    summary: {},
    trendRows: [],
    categoryRows: [],
    zoneRows: [],
    durationRows: [],
    conclusion: "暂无训练数据，请先记录一次训练。"
  },

  onShow() { this.loadData(); },

  selectRange(e) {
    const index = Number(e.currentTarget.dataset.index);
    this.setData({ rangeIndex: index }, () => this.loadData());
  },

  loadData() {
    const range = this.data.ranges[this.data.rangeIndex];
    Promise.all([
      request({ url: `/api/analysis/summary?user_id=${DEFAULT_USER_ID}` }),
      request({ url: `/api/analysis/trend?user_id=${DEFAULT_USER_ID}&limit=${range.limit}` }),
      request({ url: `/api/analysis/category?user_id=${DEFAULT_USER_ID}` }),
      request({ url: `/api/analysis/zone?user_id=${DEFAULT_USER_ID}` })
    ]).then(([summary, trend, category, zone]) => {
      const maxDuration = Math.max.apply(null, (trend.durations || [0]).concat([1]));
      const trendRows = (trend.dates || []).map((date, idx) => ({
        date,
        rate: trend.shooting_rates[idx] || 0,
        rateWidth: clampPercent(trend.shooting_rates[idx] || 0),
        duration: trend.durations[idx] || 0,
        durationHeight: Math.max(8, Math.round((trend.durations[idx] || 0) / maxDuration * 100))
      }));
      const maxZone = Math.max.apply(null, (zone.items || []).map(item => item.rate).concat([1]));
      const zoneRows = (zone.items || []).map(item => ({
        ...item,
        width: clampPercent(Math.round(item.rate / maxZone * 100))
      }));
      const categoryRows = (category.items || []).map(item => ({ ...item, percentWidth: clampPercent(item.percent) }));
      this.setData({
        summary,
        trendRows,
        durationRows: trendRows,
        categoryRows,
        zoneRows,
        conclusion: this.buildConclusion(summary, trendRows, categoryRows, zoneRows)
      });
    }).catch(() => {});
  },

  buildConclusion(summary, trendRows, categoryRows, zoneRows) {
    if (!summary.total_sessions) return "暂无训练数据，请先记录一次训练。";
    const topCategory = categoryRows[0] ? categoryRows[0].category : "训练";
    const weakest = zoneRows.length ? zoneRows.slice().sort((a, b) => a.rate - b.rate)[0].zone : "投篮稳定性";
    const rates = trendRows.map(item => item.rate);
    let trendText = "整体表现保持稳定";
    if (rates.length >= 2) {
      const diff = Math.round((rates[rates.length - 1] - rates[0]) * 10) / 10;
      trendText = diff >= 0 ? `近段命中率提升 ${diff}%` : `近段命中率下降 ${Math.abs(diff)}%`;
    }
    return `${trendText}；当前训练投入主要集中在“${topCategory}”，建议下一阶段重点关注“${weakest}”。`;
  },

  goAdvice() { wx.switchTab({ url: "/pages/advice/advice" }); }
});
