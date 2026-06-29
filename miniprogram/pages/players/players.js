const { request } = require("../../utils/request");
const fallback = require("./players_demo");

Page({
  data: {
    summary: {},
    players: [],
    allPlayers: [],
    bars: [],
    scatter: [],
    positions: ["全部", "PG", "SG", "SF", "PF", "C"],
    positionIndex: 0,
    selectedPosition: "全部",
    description: "合成示例球员数据，仅用于展示数据可视化能力。"
  },

  onLoad() { this.loadData(); },

  loadData() {
    request({ url: "/api/player-demo/stats" })
      .then(data => this.applyData(data))
      .catch(() => this.applyData(fallback));
  },

  applyData(data) {
    const players = data.players || [];
    this.setData({
      summary: data.summary || {},
      allPlayers: players,
      description: data.description || this.data.description
    }, () => this.filterPlayers());
  },

  onPositionChange(e) {
    const index = Number(e.detail.value);
    this.setData({ positionIndex: index, selectedPosition: this.data.positions[index] }, () => this.filterPlayers());
  },

  filterPlayers() {
    const pos = this.data.positions[this.data.positionIndex];
    let rows = this.data.allPlayers.slice();
    if (pos !== "全部") rows = rows.filter(item => item.position === pos);
    rows.sort((a, b) => b.points - a.points);
    const maxPoints = Math.max.apply(null, rows.map(item => item.points).concat([1]));
    const bars = rows.map(item => ({ ...item, width: Math.round(item.points / maxPoints * 100) }));
    const scatter = rows.map(item => ({
      ...item,
      x: Math.max(4, Math.min(92, Math.round((item.shooting_rate - 35) / 30 * 100))),
      y: Math.max(4, Math.min(92, Math.round((item.points - 10) / 16 * 100))),
      size: Math.max(22, Math.min(46, Math.round(item.efficiency_score * 1.5)))
    }));
    this.setData({ players: rows, bars, scatter });
  }
});
