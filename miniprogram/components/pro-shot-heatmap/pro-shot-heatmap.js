function rate(makes, attempts) {
  attempts = Number(attempts || 0);
  if (!attempts) return 0;
  return Math.round(Number(makes || 0) / attempts * 1000) / 10;
}
function buildSummary(zones) {
  zones = zones || [];
  var groups = { paint:{label:'禁区', a:0, m:0}, mid:{label:'中距离', a:0, m:0}, three:{label:'三分', a:0, m:0} };
  for (var i = 0; i < zones.length; i++) {
    var g = groups[zones[i].group];
    if (!g) continue;
    g.a += Number(zones[i].attempts || 0);
    g.m += Number(zones[i].makes || zones[i].made || 0);
  }
  return [groups.paint, groups.mid, groups.three].map(function(g){
    var pct = rate(g.m, g.a);
    return { label:g.label, value:g.a ? pct + '%' : '—', sub:g.a ? g.m + '/' + g.a : '无出手' };
  });
}
function buildInsight(zones) {
  zones = zones || [];
  var valid = [];
  for (var i = 0; i < zones.length; i++) if (Number(zones[i].attempts || 0) > 0) valid.push(zones[i]);
  if (!valid.length) return '暂无热区数据，请先完成一次投篮训练记录。';
  valid.sort(function(a,b){ return Number(b.percentage || 0) - Number(a.percentage || 0); });
  var best = valid[0];
  var weak = valid[valid.length - 1];
  return '最佳区域：' + (best.detailName || best.name) + '（' + best.label + '）；待提升区域：' + weak.name + '（' + weak.label + '）。';
}
Component({
  properties: {
    zones: { type: Array, value: [] },
    title: { type: String, value: '投篮热区图' },
    subtitle: { type: String, value: '颜色越深代表命中率越高，浅灰代表无出手区域' },
    interactive: { type: Boolean, value: true },
    showLegend: { type: Boolean, value: true },
    showInsight: { type: Boolean, value: true }
  },
  data: { summary: [], selectedZone: {}, selectedZoneTitle: '', insightText: '' },
  observers: { 'zones': function(zones) { this.rebuild(zones || []); } },
  lifetimes: { attached: function(){ this.rebuild(this.data.zones || []); } },
  methods: {
    rebuild: function(zones) {
      var selected = {};
      for (var i = 0; i < zones.length; i++) { if (Number(zones[i].attempts || 0) > 0) { selected = zones[i]; break; } }
      this.setData({ summary: buildSummary(zones), selectedZone: selected, selectedZoneTitle: selected.detailName || selected.name || '', insightText: buildInsight(zones) });
    },
    selectZone: function(e) {
      if (!this.data.interactive) return;
      var id = e.currentTarget.dataset.id;
      var zones = this.data.zones || [];
      for (var i = 0; i < zones.length; i++) {
        if (zones[i].id === id) {
          this.setData({ selectedZone: zones[i], selectedZoneTitle: zones[i].detailName || zones[i].name || '' });
          this.triggerEvent('zonechange', zones[i]);
          return;
        }
      }
    }
  }
});
