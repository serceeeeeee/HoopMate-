var kit=null; try{ kit=require('../../services/stableData'); }catch(e){ kit=null; }
Page({
  data:{ session:{}, zones:[], heatmapSummary:[], points:[], advices:[], selectedZone:{}, selectedZoneKey:'', selectedZoneTitle:'', summaryText:'训练表现稳定。' },
  onLoad:function(opt){
    var s=kit?kit.getSession(opt&&opt.id):null;
    if(!s&&kit){ var arr=kit.sessions(); s=arr[0]; }
    if(s&&kit){
      var zones=kit.heatmapZones(s);
      var info=kit.heatmapInsight?kit.heatmapInsight(zones):{text:this.text(zones),best:null};
      var selected=info.best || this.firstValidZone(zones) || zones[0] || {};
      this.setData({
        session:s,
        zones:zones,
        heatmapSummary:kit.heatmapSummary?kit.heatmapSummary(zones):[],
        points:kit.shotPoints(s),
        advices:kit.adviceList(s),
        selectedZone:selected,
        selectedZoneKey:selected.key || selected.id || '',
        selectedZoneTitle:selected.detailName || selected.name || '',
        summaryText: info.text || this.text(zones)
      });
    }
  },
  firstValidZone:function(zones){ for(var i=0;i<zones.length;i++){ if(Number(zones[i].attempts||0)>0) return zones[i]; } return null; },
  onHeatmapZoneChange:function(e){ var zone=e.detail; if(zone){ this.setData({selectedZone:zone, selectedZoneKey:zone.key || zone.id || '', selectedZoneTitle:zone.detailName || zone.name || ''}); } },
  selectZone:function(e){ var id=e.currentTarget.dataset.id; var zones=this.data.zones; for(var i=0;i<zones.length;i++){ if(zones[i].id===id || zones[i].key===id){ this.setData({selectedZone:zones[i], selectedZoneKey:zones[i].key || zones[i].id || '', selectedZoneTitle:zones[i].detailName || zones[i].name || ''}); break; } } },
  text:function(zones){ var valid=[]; for(var i=0;i<zones.length;i++){ if(zones[i].attempts>0) valid.push(zones[i]); } if(!valid.length)return '本次训练暂无区域投篮数据。'; valid.sort(function(a,b){return b.percentage-a.percentage;}); return '本次最佳区域为' + valid[0].name + '，建议继续保持；可重点复盘低命中率区域的出手节奏。'; }
});
