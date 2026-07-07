var kit=null; try{ kit=require('../../services/stableData'); }catch(e){ kit=null; }
Page({
  data:{ categories:['全部','NBA','CBA','国际篮球','训练技巧'], activeCategory:'全部', all:[], list:[] },
  onLoad:function(){ this.load(); },
  onPullDownRefresh:function(){ this.load(); wx.stopPullDownRefresh(); },
  load:function(){ var all=kit?kit.newsList():[]; this.setData({ all:all }); this.filter(); },
  chooseCategory:function(e){ this.setData({ activeCategory:e.currentTarget.dataset.value }); this.filter(); },
  filter:function(){ var a=this.data.activeCategory; var out=[]; var all=this.data.all; for(var i=0;i<all.length;i++){ if(a==='全部'||all[i].category===a) out.push(all[i]); } this.setData({ list:out }); },
  goDetail:function(e){ wx.navigateTo({ url:'/pages/news-detail/news-detail?id='+e.currentTarget.dataset.id }); }
});
