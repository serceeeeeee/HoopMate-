var kit = null;
try { kit = require('../../services/stableData'); } catch (e) { kit = null; }
function fallbackSummary() { return { total_shots: 683, made_shots: 323, avg_shooting_rate: 47.3, recent_7day_sessions: 4, recent_7day_rate_change: 5.3, latest_date: '今日', paint_rate: 58, three_rate: 41 }; }
Page({
  data: {
    summary: fallbackSummary(),
    profile: { weekly_goal_sessions: 4 },
    latest: { id: 1, category: '投篮', training_date: '今日', duration_min: 60, intensity: 7, total_shots: 100, shooting_rate: 50, note: '示例训练记录' },
    weekProgress: 100,
    rateChangeText: '+5.3%',
    todayStatus: '今日训练状态',
    todayStatusShort: '已加载'
  },
  onLoad: function() { this.refresh(); },
  onShow: function() { this.refresh(); },
  refresh: function() {
    if (!kit) return;
    var arr = kit.sessions();
    var sm = kit.summary(arr);
    var pf = kit.profile();
    var latest = arr[0] || this.data.latest;
    var goal = Number(pf.weekly_goal_sessions || 4);
    var progress = Math.round((sm.recent_7day_sessions || 0) / goal * 100);
    if (progress > 100) progress = 100;
    var change = Number(sm.recent_7day_rate_change || 0);
    var today = kit.today();
    this.setData({
      summary: sm,
      profile: pf,
      latest: latest,
      weekProgress: progress,
      rateChangeText: change > 0 ? '+' + change + '%' : change + '%',
      todayStatus: latest.training_date === today ? '今日已完成训练' : '今日暂无训练',
      todayStatusShort: latest.training_date === today ? '已完成' : '未训练'
    });
  },
  seedDemo: function() { if (kit) kit.resetSessions(); this.refresh(); wx.showToast({ title: '示例数据已刷新', icon: 'success' }); },
  goRecord: function() { wx.switchTab({ url: '/pages/record/record' }); },
  goAnalysis: function() { wx.switchTab({ url: '/pages/analysis/analysis' }); },
  goNews: function() { wx.switchTab({ url: '/pages/news/news' }); },
  goProfile: function() { wx.switchTab({ url: '/pages/profile/profile' }); },
  goGames: function() { wx.navigateTo({ url: '/pages/games/games' }); },
  goDetail: function() { wx.navigateTo({ url: '/pages/workout-detail/workout-detail?id=' + this.data.latest.id }); }
});
