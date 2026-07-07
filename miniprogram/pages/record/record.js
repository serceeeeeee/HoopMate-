var kit = null; try { kit = require('../../services/stableData'); } catch(e) { kit = null; }
function todayFallback() { var d = new Date(); var m = d.getMonth() + 1; var day = d.getDate(); return d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day); }
function tag(rate) { if (rate >= 60) return { tagText:'Excellent', tagLevel:'excellent' }; if (rate >= 45) return { tagText:'Good', tagLevel:'good' }; return { tagText:'Need Work', tagLevel:'work' }; }
Page({
  data: {
    categories: ['投篮','运球','体能','综合','比赛'],
    form: { training_date: todayFallback(), category: '投篮', duration_min: 60, intensity: 6, total_shots: 100, made_shots: 50, free_throw_attempts: 20, free_throw_makes: 15, mid_attempts: 35, mid_makes: 18, three_attempts: 30, three_makes: 12, note: '' },
    previewRate: 50,
    records: []
  },
  onLoad: function() { this.refresh(); this.updateRate(); },
  onShow: function() { this.refresh(); },
  refresh: function() {
    if (!kit) return;
    var arr = kit.sessions();
    for (var i = 0; i < arr.length; i++) { var t = tag(arr[i].shooting_rate); arr[i].tagText = t.tagText; arr[i].tagLevel = t.tagLevel; }
    this.setData({ records: arr });
  },
  chooseCategory: function(e) { this.setData({ 'form.category': e.currentTarget.dataset.value }); },
  onInput: function(e) { var key = e.currentTarget.dataset.field; var val = e.detail.value; var obj = {}; obj['form.' + key] = val; this.setData(obj); this.updateRate(); },
  updateRate: function() { var f = this.data.form; var total = Number(f.total_shots || 0); var made = Number(f.made_shots || 0); var r = total > 0 ? Math.round(made / total * 1000) / 10 : 0; this.setData({ previewRate: r }); },
  save: function() {
    var f = this.data.form; if (Number(f.made_shots || 0) > Number(f.total_shots || 0)) { wx.showToast({ title:'命中数不能大于出手数', icon:'none' }); return; }
    if (kit) kit.saveSession(f); this.refresh(); wx.showToast({ title:'记录成功', icon:'success' });
  },
  loadDemo: function() { if (kit) kit.resetSessions(); this.refresh(); wx.showToast({ title:'示例数据已加载', icon:'success' }); },
  exportCsv: function() {
    var arr = this.data.records; var lines = ['training_date,category,duration_min,intensity,total_shots,made_shots,note'];
    for (var i=0;i<arr.length;i++) lines.push([arr[i].training_date,arr[i].category,arr[i].duration_min,arr[i].intensity,arr[i].total_shots,arr[i].made_shots,(arr[i].note||'').replace(/,/g,'，')].join(','));
    wx.setClipboardData({ data: lines.join('\n'), success: function(){ wx.showToast({ title:'CSV已复制', icon:'success' }); } });
  },
  importCsv: function() {
    var self = this;
    if (!wx.chooseMessageFile) { wx.showToast({ title:'当前环境不支持文件选择', icon:'none' }); return; }
    wx.chooseMessageFile({ count:1, type:'file', extension:['csv'], success:function(res){
      var path = res.tempFiles && res.tempFiles[0] ? res.tempFiles[0].path : '';
      if (!path) return;
      wx.getFileSystemManager().readFile({ filePath:path, encoding:'utf8', success:function(r){ self.parseCsv(r.data); }, fail:function(){ wx.showToast({ title:'读取CSV失败', icon:'none' }); } });
    }});
  },
  parseCsv: function(text) {
    if (!kit) return; var lines = String(text || '').split(/\r?\n/); var count = 0;
    for (var i=1;i<lines.length;i++) { var p = lines[i].split(','); if (p.length >= 6) { kit.saveSession({ training_date:p[0], category:p[1], duration_min:p[2], intensity:p[3], total_shots:p[4], made_shots:p[5], note:p[6] || 'CSV导入' }); count++; } }
    this.refresh(); wx.showToast({ title:'导入' + count + '条', icon:'success' });
  },
  remove: function(e) { var self=this; var id=e.currentTarget.dataset.id; wx.showModal({ title:'删除记录', content:'确认删除这条训练记录？', success:function(res){ if(res.confirm && kit){ kit.deleteSession(id); self.refresh(); } } }); },
  goDetail: function(e) { wx.navigateTo({ url:'/pages/workout-detail/workout-detail?id=' + e.currentTarget.dataset.id }); }
});
