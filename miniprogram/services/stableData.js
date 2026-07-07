// HoopMate 稳定演示数据层
// 设计目标：不依赖后端、不在模块加载时访问 wx，保证微信开发者工具中页面始终可渲染。
var SESSION_KEY = 'hm_stable_sessions_v1';
var PROFILE_KEY = 'hm_stable_profile_v1';

function pad2(n) { return n < 10 ? '0' + n : '' + n; }
function today() {
  var d = new Date();
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}
function daysAgo(n) {
  var d = new Date();
  d.setDate(d.getDate() - n);
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}
function rate(makes, attempts) {
  var a = Number(attempts || 0);
  if (a <= 0) return 0;
  return Math.round(Number(makes || 0) / a * 1000) / 10;
}
function safeWx() { return typeof wx !== 'undefined' ? wx : null; }
function getSync(key) {
  var w = safeWx();
  if (!w || !w.getStorageSync) return null;
  try { return w.getStorageSync(key); } catch (e) { return null; }
}
function setSync(key, value) {
  var w = safeWx();
  if (!w || !w.setStorageSync) return;
  try { w.setStorageSync(key, value); } catch (e) {}
}

function baseSessions() {
  return [
    { id: 9007, training_date: today(), category: '投篮', duration_min: 68, intensity: 7, total_shots: 120, made_shots: 70, free_throw_attempts: 20, free_throw_makes: 17, mid_attempts: 36, mid_makes: 22, three_attempts: 44, three_makes: 22, note: '弧顶三分手感较好，右侧底角偏短。' },
    { id: 9006, training_date: daysAgo(1), category: '综合', duration_min: 75, intensity: 8, total_shots: 105, made_shots: 54, free_throw_attempts: 18, free_throw_makes: 14, mid_attempts: 32, mid_makes: 17, three_attempts: 38, three_makes: 15, note: '加入运球急停后命中率下降，需要降低出手速度。' },
    { id: 9005, training_date: daysAgo(3), category: '投篮', duration_min: 60, intensity: 6, total_shots: 96, made_shots: 51, free_throw_attempts: 18, free_throw_makes: 15, mid_attempts: 30, mid_makes: 16, three_attempts: 34, three_makes: 14, note: '中距离稳定，三分出手节奏还需统一。' },
    { id: 9004, training_date: daysAgo(5), category: '体能', duration_min: 50, intensity: 7, total_shots: 70, made_shots: 34, free_throw_attempts: 12, free_throw_makes: 9, mid_attempts: 22, mid_makes: 10, three_attempts: 24, three_makes: 9, note: '体能训练后投篮稳定性下降。' },
    { id: 9003, training_date: daysAgo(7), category: '投篮', duration_min: 58, intensity: 6, total_shots: 90, made_shots: 44, free_throw_attempts: 16, free_throw_makes: 13, mid_attempts: 30, mid_makes: 15, three_attempts: 30, three_makes: 11, note: '罚球不错，底角三分需要加强。' },
    { id: 9002, training_date: daysAgo(9), category: '运球', duration_min: 52, intensity: 6, total_shots: 72, made_shots: 34, free_throw_attempts: 10, free_throw_makes: 8, mid_attempts: 24, mid_makes: 12, three_attempts: 24, three_makes: 9, note: '弱侧手运球后急停投篮不稳定。' },
    { id: 9001, training_date: daysAgo(11), category: '投篮', duration_min: 55, intensity: 5, total_shots: 80, made_shots: 36, free_throw_attempts: 12, free_throw_makes: 9, mid_attempts: 28, mid_makes: 13, three_attempts: 28, three_makes: 10, note: '基础定点训练，作为阶段起点。' }
  ];
}

function enrich(s) {
  s = s || {};
  var total = Number(s.total_shots || 0);
  var made = Number(s.made_shots || 0);
  var ftA = Number(s.free_throw_attempts || 0);
  var ftM = Number(s.free_throw_makes || 0);
  var midA = Number(s.mid_attempts || 0);
  var midM = Number(s.mid_makes || 0);
  var threeA = Number(s.three_attempts || 0);
  var threeM = Number(s.three_makes || 0);
  var paintA = Math.max(0, total - ftA - midA - threeA);
  var paintM = Math.max(0, made - ftM - midM - threeM);
  var item = {};
  for (var k in s) item[k] = s[k];
  item.total_shots = total;
  item.made_shots = made;
  item.shooting_rate = rate(made, total);
  item.paint_attempts = paintA;
  item.paint_makes = paintM;
  item.paint_rate = rate(paintM, paintA);
  item.free_throw_rate = rate(ftM, ftA);
  item.mid_rate = rate(midM, midA);
  item.three_rate = rate(threeM, threeA);
  item.accuracy = item.shooting_rate;
  return item;
}

function sessions() {
  var saved = getSync(SESSION_KEY);
  if (!saved || !saved.length) {
    saved = baseSessions();
    setSync(SESSION_KEY, saved);
  }
  var arr = [];
  for (var i = 0; i < saved.length; i++) arr.push(enrich(saved[i]));
  arr.sort(function(a, b) { return String(b.training_date).localeCompare(String(a.training_date)); });
  return arr;
}
function resetSessions() {
  var arr = baseSessions();
  setSync(SESSION_KEY, arr);
  return sessions();
}
function saveSession(form) {
  var arr = sessions();
  form = form || {};
  var next = enrich({
    id: Date.now(),
    training_date: form.training_date || today(),
    category: form.category || '投篮',
    duration_min: Number(form.duration_min || 60),
    intensity: Number(form.intensity || 6),
    total_shots: Number(form.total_shots || 0),
    made_shots: Number(form.made_shots || 0),
    free_throw_attempts: Number(form.free_throw_attempts || 0),
    free_throw_makes: Number(form.free_throw_makes || 0),
    mid_attempts: Number(form.mid_attempts || 0),
    mid_makes: Number(form.mid_makes || 0),
    three_attempts: Number(form.three_attempts || 0),
    three_makes: Number(form.three_makes || 0),
    note: form.note || ''
  });
  arr.unshift(next);
  setSync(SESSION_KEY, arr);
  return next;
}
function deleteSession(id) {
  var arr = sessions();
  var next = [];
  for (var i = 0; i < arr.length; i++) {
    if (String(arr[i].id) !== String(id)) next.push(arr[i]);
  }
  setSync(SESSION_KEY, next);
  return next;
}
function getSession(id) {
  var arr = sessions();
  for (var i = 0; i < arr.length; i++) {
    if (String(arr[i].id) === String(id)) return arr[i];
  }
  return arr[0] || null;
}
function profile() {
  var defaults = { nickname: 'Hooper', skill_level: '中级', position: 'SG', weekly_goal_sessions: 4, weekly_goal_minutes: 240, target_accuracy: 55, stage_goal: '4 周内把三分命中率提升到 38%，保持每周至少 4 次训练。' };
  var saved = getSync(PROFILE_KEY);
  if (!saved) {
    setSync(PROFILE_KEY, defaults);
    return defaults;
  }
  var next = {};
  var k;
  for (k in defaults) next[k] = defaults[k];
  for (k in saved) next[k] = saved[k];
  return next;
}
function saveProfile(form) {
  var current = profile();
  for (var k in form) current[k] = form[k];
  setSync(PROFILE_KEY, current);
  return current;
}
function summary(arr) {
  arr = arr || sessions();
  var totalShots = 0, madeShots = 0, duration = 0;
  var paintA = 0, paintM = 0, midA = 0, midM = 0, threeA = 0, threeM = 0, ftA = 0, ftM = 0;
  var seven = new Date(); seven.setDate(seven.getDate() - 6);
  var sevenKey = seven.getFullYear() + '-' + pad2(seven.getMonth() + 1) + '-' + pad2(seven.getDate());
  var recent = 0;
  for (var i = 0; i < arr.length; i++) {
    var s = enrich(arr[i]);
    totalShots += s.total_shots; madeShots += s.made_shots; duration += Number(s.duration_min || 0);
    paintA += s.paint_attempts; paintM += s.paint_makes;
    midA += Number(s.mid_attempts || 0); midM += Number(s.mid_makes || 0);
    threeA += Number(s.three_attempts || 0); threeM += Number(s.three_makes || 0);
    ftA += Number(s.free_throw_attempts || 0); ftM += Number(s.free_throw_makes || 0);
    if (String(s.training_date) >= sevenKey) recent++;
  }
  var last3 = arr.slice(0, 3);
  var prev3 = arr.slice(3, 6);
  var lM = 0, lA = 0, pM = 0, pA = 0;
  for (var a = 0; a < last3.length; a++) { lM += Number(last3[a].made_shots || 0); lA += Number(last3[a].total_shots || 0); }
  for (var b = 0; b < prev3.length; b++) { pM += Number(prev3[b].made_shots || 0); pA += Number(prev3[b].total_shots || 0); }
  return {
    total_sessions: arr.length,
    total_duration: duration,
    total_shots: totalShots,
    made_shots: madeShots,
    avg_shooting_rate: rate(madeShots, totalShots),
    recent_7day_sessions: recent,
    recent_7day_rate_change: Math.round((rate(lM, lA) - rate(pM, pA)) * 10) / 10,
    latest_date: arr[0] ? arr[0].training_date : '暂无',
    paint_rate: rate(paintM, paintA),
    ft_rate: rate(ftM, ftA),
    mid_rate: rate(midM, midA),
    three_rate: rate(threeM, threeA),
    total_load: duration ? duration * 7 : 0
  };
}
function formatPct(value) {
  var n = Math.round(Number(value || 0) * 10) / 10;
  return Math.abs(n - Math.round(n)) < 0.01 ? String(Math.round(n)) : String(n);
}
function colorByPercentage(attempts, pct) {
  if (Number(attempts || 0) <= 0) return { color:'#F1F2F4', level:'empty', textColor:'#8A94A6' };
  pct = Number(pct || 0);
  if (pct <= 35) return { color:'#FFE8DC', level:'low', textColor:'#111827' };
  if (pct <= 45) return { color:'#FFC7AD', level:'medium-low', textColor:'#111827' };
  if (pct <= 55) return { color:'#FF9B63', level:'medium', textColor:'#111827' };
  return { color:'#FF5A1F', level:'high', textColor:'#111827' };
}
function heatmapZones(session) {
  // 专业 9 区域半场热区数据。
  // 当前实习项目 MVP 中，默认使用稳定演示数据，确保没有后端或真实投篮点位时也能呈现专业热区图。
  // 后续接入摄像头识别或真实点位时，只需要按同一数据结构替换这里的数据源。
  var scale = 1;
  if (session) {
    var s = enrich(session);
    scale = Number(s.total_shots || 0) > 0 ? Number(s.total_shots || 0) / 633 : 0;
  }
  function scaleAttempts(n) { return scale === 1 ? n : Math.max(0, Math.round(n * scale)); }
  function madeByPct(attempts, pct, fixedMakes) {
    if (scale === 1 && typeof fixedMakes === 'number') return fixedMakes;
    return attempts > 0 ? Math.round(attempts * pct / 100) : 0;
  }
  var defs = [
    { key:'leftCorner', name:'左底角', shortName:'左底角', group:'three', attempts:35, makes:12, percentage:34.3, layoutClass:'zone-left-corner' },
    { key:'leftMid', name:'左中距', shortName:'左中距', group:'mid', attempts:61, makes:29, percentage:47.5, layoutClass:'zone-left-mid' },
    { key:'leftPaint', name:'左禁区', shortName:'左禁区', group:'paint', attempts:24, makes:9, percentage:37.5, layoutClass:'zone-left-paint' },
    { key:'centerPaint', name:'中禁区', shortName:'中禁区', group:'paint', attempts:81, makes:49, percentage:60.5, layoutClass:'zone-center-paint' },
    { key:'rightPaint', name:'右禁区', shortName:'右禁区', group:'paint', attempts:27, makes:11, percentage:40.7, layoutClass:'zone-right-paint' },
    { key:'rightMid', name:'右中距', shortName:'右中距', group:'mid', attempts:60, makes:27, percentage:45, layoutClass:'zone-right-mid' },
    { key:'rightCorner', name:'右底角', shortName:'右底角', group:'three', attempts:37, makes:14, percentage:37.8, layoutClass:'zone-right-corner' },
    { key:'topArc', name:'弧顶', shortName:'弧顶', group:'three', attempts:54, makes:26, percentage:48.1, layoutClass:'zone-top-arc' },
    { key:'centerMid', name:'中距离', shortName:'中距离', group:'mid', attempts:87, makes:45, percentage:52, layoutClass:'zone-center-mid' }
  ];
  // 出手占比按投篮区域总出手数计算：禁区 103 + 中距离 202 + 三分 222 = 527。
  var totalAttempts = scale === 1 ? 527 : scaleAttempts(527);
  var out = [];
  for (var d = 0; d < defs.length; d++) {
    var def = defs[d];
    var attempts = scaleAttempts(def.attempts);
    var makes = madeByPct(attempts, def.percentage, def.makes);
    var pct = attempts > 0 ? (scale === 1 ? def.percentage : rate(makes, attempts)) : 0;
    var color = '#F1F2F4';
    if (attempts > 0 && pct < 35) color = '#FFE8DC';
    else if (attempts > 0 && pct < 45) color = '#FFC7AD';
    else if (attempts > 0 && pct < 55) color = '#FF9B63';
    else if (attempts > 0) color = '#FF5A1F';
    out.push({
      id:def.key,
      key:def.key,
      name:def.name,
      shortName:def.shortName,
      group:def.group,
      layoutClass:def.layoutClass,
      levelClass:'heat-rate-zone',
      attempts:attempts,
      makes:makes,
      percentage:pct,
      label:attempts ? (Math.abs(pct - Math.round(pct)) < 0.05 ? Math.round(pct) + '%' : pct + '%') : '—',
      sub:attempts ? makes + '/' + attempts : '无出手',
      color:color,
      textColor:'#111827',
      share: totalAttempts ? rate(attempts, totalAttempts) : 0
    });
  }
  return out;
}

function courtHeatmapZones(session) {
  // 专业半场 9 区域热区图数据。
  // 该结构用于 Canvas 热区组件，区域和数值与分析页演示指标保持一致。
  // 后续若接入真实投篮点位，可在这里按坐标聚合为同一格式。
  var zones = [
    { key: 'leftCorner', name: '左底角', made: 12, attempts: 35 },
    { key: 'leftMid', name: '左中距', made: 29, attempts: 61 },
    { key: 'leftPaint', name: '左禁区', made: 9, attempts: 24 },
    { key: 'centerPaint', name: '中禁区', made: 49, attempts: 81 },
    { key: 'rightPaint', name: '右禁区', made: 11, attempts: 27 },
    { key: 'rightMid', name: '右中距', made: 27, attempts: 60 },
    { key: 'rightCorner', name: '右底角', made: 14, attempts: 37 },
    { key: 'topArc', name: '弧顶', made: 26, attempts: 54 },
    { key: 'centerMid', name: '中距离', made: 45, attempts: 87, percentage: 52 }
  ];
  var totalAttempts = 0;
  for (var i = 0; i < zones.length; i++) totalAttempts += zones[i].attempts;
  for (var j = 0; j < zones.length; j++) {
    var z = zones[j];
    z.id = z.key;
    z.makes = z.made;
    z.percentage = z.percentage != null ? z.percentage : rate(z.made, z.attempts);
    z.label = z.percentage + '%';
    z.sub = z.made + '/' + z.attempts;
    z.share = totalAttempts ? rate(z.attempts, totalAttempts) : 0;
  }
  return zones;
}

function heatmapSummary(zones) {
  // 顶部三栏汇总按训练大类展示，保持和分析页核心指标一致。
  var sm = summary();
  return [
    { label:'禁区', attempts:103, makes:43, percentage:41.7, value:'41.7%', sub:'43/103' },
    { label:'中距离', attempts:202, makes:105, percentage:52, value:'52%', sub:'105/202' },
    { label:'三分', attempts:222, makes:90, percentage:40.5, value:'40.5%', sub:'90/222' }
  ];
}

function heatmapInsight(zones) {
  zones = zones || heatmapZones();
  var valid = [];
  for (var i = 0; i < zones.length; i++) if (Number(zones[i].attempts || 0) > 0) valid.push(zones[i]);
  if (!valid.length) return { text:'暂无热区数据，请先完成一次投篮训练记录。', best:null, weak:null, highVolumeWeak:null };
  valid.sort(function(a,b){ return b.percentage - a.percentage; });
  var best = valid[0];
  var weak = valid[valid.length - 1];
  var highVolumeWeak = null;
  for (var k = 0; k < valid.length; k++) {
    if (valid[k].attempts >= 50 && valid[k].percentage < 50) { highVolumeWeak = valid[k]; break; }
  }
  var text = '最佳区域：' + (best.detailName || best.name) + '（' + best.label + '，' + best.makes + '/' + best.attempts + '）；待提升区域：' + weak.name + '（' + weak.label + '）。';
  if (highVolumeWeak) text += ' ' + highVolumeWeak.name + ' 出手较多但效率偏低，建议下次训练安排专项复盘。';
  else text += ' 建议保持优势区域训练量，并逐步提升低命中率区域的稳定性。';
  return { text:text, best:best, weak:weak, highVolumeWeak:highVolumeWeak };
}
function trend() {
  var arr = sessions().slice(0, 10).reverse();
  var out = [];
  for (var i = 0; i < arr.length; i++) out.push({ label: String(arr[i].training_date).slice(5), rate: arr[i].shooting_rate, duration: arr[i].duration_min, height: Math.max(8, Math.min(100, arr[i].shooting_rate)) });
  return out;
}
function categories() {
  var arr = sessions(); var map = {}; var total = 0;
  for (var i = 0; i < arr.length; i++) { var k = arr[i].category || '投篮'; map[k] = (map[k] || 0) + Number(arr[i].duration_min || 0); total += Number(arr[i].duration_min || 0); }
  var out = [];
  for (var key in map) out.push({ name:key, value:map[key], percent:total ? rate(map[key], total) : 0 });
  return out;
}
function shotPoints(session) {
  var zs = heatmapZones(session); var map = {}; for (var i = 0; i < zs.length; i++) map[zs[i].key] = zs[i].percentage;
  var base = [
    ['centerPaint',50,51], ['centerPaint',47,55], ['centerPaint',54,58],
    ['leftPaint',36,50], ['rightPaint',64,51], ['centerMid',50,23],
    ['leftMid',28,22], ['leftMid',33,26], ['rightMid',68,22], ['rightMid',72,27],
    ['leftCorner',10,72], ['rightCorner',90,72], ['topArc',50,88], ['topArc',45,84], ['topArc',56,84]
  ];
  var out = [];
  for (var j = 0; j < base.length; j++) {
    var b = base[j]; var pct = map[b[0]] || 0;
    out.push({ id:'p'+j, zone:b[0], x:b[1], y:b[2], made: ((j * 23 + Math.round(pct)) % 100) < pct });
  }
  return out;
}
function newsList() {
  return [
    { id:'n1', category:'训练技巧', title:'如何用 30 分钟完成一次高质量投篮训练', source:'HoopMate Lab', publishedAt:'今天 09:30', summary:'从近筐热身、中距离节奏到三分专项，建立可记录、可复盘的训练流程。', imageUrl:'' },
    { id:'n2', category:'NBA', title:'关键投篮数据如何影响球员表现评估', source:'Basket Data', publishedAt:'昨天 18:20', summary:'命中率只是起点，出手区域、出手难度和稳定性共同决定训练方向。', imageUrl:'' },
    { id:'n3', category:'CBA', title:'青年球员专项训练更重视投篮选择', source:'Hoop News', publishedAt:'周二 12:00', summary:'区域命中率和训练频率可以帮助球员更快发现短板。', imageUrl:'' },
    { id:'n4', category:'国际篮球', title:'国际赛场的空间型打法对投篮训练的启发', source:'Global Court', publishedAt:'周一 20:15', summary:'侧翼三分和转换投篮成为外线训练的重要组成。', imageUrl:'' }
  ];
}
function gamesList() {
  return [
    { id:'g1', league:'NBA', homeTeam:'Lakers', awayTeam:'Warriors', homeScore:0, awayScore:0, startTime:'今晚 08:30', status:'Upcoming', venue:'Los Angeles' },
    { id:'g2', league:'CBA', homeTeam:'广东', awayTeam:'辽宁', homeScore:96, awayScore:92, startTime:'昨天 19:35', status:'Finished', venue:'东莞' },
    { id:'g3', league:'NCAA', homeTeam:'Duke', awayTeam:'Kansas', homeScore:51, awayScore:48, startTime:'进行中', status:'Live', venue:'Durham' },
    { id:'g4', league:'国际赛事', homeTeam:'Spain', awayTeam:'France', homeScore:0, awayScore:0, startTime:'明天 21:00', status:'Upcoming', venue:'Madrid' }
  ];
}
function adviceList(session) {
  var sm = summary(); var zs = heatmapZones(session); var valid = [];
  for (var i = 0; i < zs.length; i++) if (zs[i].attempts > 0) valid.push(zs[i]);
  valid.sort(function(a,b){ return a.percentage - b.percentage; });
  var weak = valid[0] || null; valid.sort(function(a,b){ return b.percentage - a.percentage; }); var best = valid[0] || null;
  var list = [];
  list.push({ title:'投篮稳定性', priority: sm.avg_shooting_rate >= 55 ? '中' : '高', text: sm.avg_shooting_rate >= 55 ? '整体命中率较稳定，可以逐步加入移动接球投篮。' : '整体命中率仍有提升空间，建议先稳定定点投篮节奏。', action:'每次训练保留 20 次罚球和 30 次中距离作为基准组。' });
  if (weak) list.push({ title:'短板区域', priority:'高', text:'当前最需要提升的区域是' + weak.name + '，命中率约 ' + weak.percentage + '%。', action:'为该区域单独安排 30-50 次出手，并记录偏差方向。' });
  if (best) list.push({ title:'优势区域', priority:'低', text:'表现最好的区域是' + best.name + '，可以作为比赛中的优先出手点。', action:'保持该区域训练量，增加轻对抗条件下的出手。' });
  return list;
}

module.exports = {
  today: today,
  rate: rate,
  sessions: sessions,
  resetSessions: resetSessions,
  saveSession: saveSession,
  deleteSession: deleteSession,
  getSession: getSession,
  profile: profile,
  saveProfile: saveProfile,
  summary: summary,
  heatmapZones: heatmapZones,
  courtHeatmapZones: courtHeatmapZones,
  heatmapSummary: heatmapSummary,
  heatmapInsight: heatmapInsight,
  trend: trend,
  categories: categories,
  shotPoints: shotPoints,
  newsList: newsList,
  gamesList: gamesList,
  adviceList: adviceList
};
