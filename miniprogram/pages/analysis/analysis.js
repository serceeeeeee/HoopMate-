var kit = null; try { kit = require('../../services/stableData'); } catch(e) { kit = null; }
Page({
  data: {
    summary: { avg_shooting_rate: 51, made_shots: 323, total_shots: 633, paint_rate: 41.7, mid_rate: 52, three_rate: 40.5 },
    zones: [], heatmapSummary: [], points: [], trend: [], categories: [], selectedZone: {}, selectedZoneKey: '', analysisText: '暂无热区数据，请先记录训练。'
  },
  onLoad: function(){ this.refresh(); },
  onShow: function(){ this.refresh(); },
  refresh: function(){
    if (!kit) return;
    var sm = kit.summary();
    var zones = kit.heatmapZones();
    var info = kit.heatmapInsight ? kit.heatmapInsight(zones) : { text: this.buildText(zones) };
    var selected = info.best || this.firstValidZone(zones) || zones[0] || {};
    this.setData({
      summary: sm,
      zones: zones,
      heatmapSummary: kit.heatmapSummary ? kit.heatmapSummary(zones) : [],
      points: kit.shotPoints(),
      trend: kit.trend(),
      categories: kit.categories(),
      selectedZone: selected,
      selectedZoneKey: selected.key || selected.id || '',
      analysisText: info.text || this.buildText(zones)
    });
  },
  firstValidZone: function(zones) {
    for (var i = 0; i < zones.length; i++) if (Number(zones[i].attempts || 0) > 0) return zones[i];
    return null;
  },
  buildText: function(zones){
    var valid=[]; for(var i=0;i<zones.length;i++){ if(Number(zones[i].attempts)>0) valid.push(zones[i]); }
    if(!valid.length) return '暂无热区数据，请先完成一次训练记录。';
    valid.sort(function(a,b){ return b.percentage-a.percentage; }); var best=valid[0]; var weak=valid[valid.length-1];
    return '最佳区域：' + best.name + '（' + best.percentage + '%）；待提升区域：' + weak.name + '（' + weak.percentage + '%）。建议保持优势区域训练量，并为薄弱区域安排专项出手。';
  },
  onHeatmapZoneChange: function(e){
    var zone = e.detail;
    if (zone) this.setData({ selectedZone: zone, selectedZoneKey: zone.key || zone.id || '' });
  },
  selectZone: function(e){
    var id=e.currentTarget.dataset.id; var zones=this.data.zones;
    for(var i=0;i<zones.length;i++){ if(zones[i].id===id || zones[i].key===id){ this.setData({ selectedZone: zones[i], selectedZoneKey: zones[i].key || zones[i].id || '' }); break; } }
  }
});
