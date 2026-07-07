var kit=null; try{ kit=require('../../services/stableData'); }catch(e){ kit=null; }
Page({
  data:{ form:{ nickname:'Hooper', skill_level:'中级', position:'SG', weekly_goal_sessions:4, weekly_goal_minutes:240, target_accuracy:55, stage_goal:'提升中距离和三分稳定性' }, levels:['初级','中级','高级'], positions:['PG','SG','SF','PF','C'] },
  onLoad:function(){ this.load(); }, onShow:function(){ this.load(); },
  load:function(){ if(kit) this.setData({ form: kit.profile() }); },
  onInput:function(e){ var k=e.currentTarget.dataset.field; var o={}; o['form.'+k]=e.detail.value; this.setData(o); },
  choose:function(e){ var k=e.currentTarget.dataset.field; var o={}; o['form.'+k]=e.currentTarget.dataset.value; this.setData(o); },
  save:function(){ if(kit) kit.saveProfile(this.data.form); wx.showToast({ title:'已保存', icon:'success' }); },
  goGames:function(){ wx.navigateTo({ url:'/pages/games/games' }); }, goPlayers:function(){ wx.navigateTo({ url:'/pages/players/players' }); }, goAdvice:function(){ wx.navigateTo({ url:'/pages/advice/advice' }); }, goAbout:function(){ wx.navigateTo({ url:'/pages/about/about' }); }
});
