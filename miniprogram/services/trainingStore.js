// 本地演示数据层：当后端未启动或接口失败时，保证小程序仍能完整展示和切换页面。
const STORAGE_SESSIONS = "hm_local_sessions_v2";
const STORAGE_PROFILE = "hm_local_profile_v2";
function pad2(n) { return n < 10 ? "0" + n : String(n); }

function todayText() {
  const d = new Date();
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return y + "-" + m + "-" + day;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return y + "-" + m + "-" + day;
}

function safeRate(made, total) {
  const t = Number(total || 0);
  if (t <= 0) return 0;
  return Math.round(Number(made || 0) / t * 1000) / 10;
}

function createDemoSessions() {
  return [
    { id: 1007, user_id: 1, training_date: todayText(), category: "投篮", duration_min: 68, intensity: 7, total_shots: 120, made_shots: 70, free_throw_attempts: 20, free_throw_makes: 17, mid_attempts: 36, mid_makes: 22, three_attempts: 44, three_makes: 22, note: "弧顶三分手感较好，右侧底角偏短。" },
    { id: 1006, user_id: 1, training_date: daysAgo(1), category: "综合", duration_min: 75, intensity: 8, total_shots: 105, made_shots: 54, free_throw_attempts: 18, free_throw_makes: 14, mid_attempts: 32, mid_makes: 17, three_attempts: 38, three_makes: 15, note: "加入运球急停后命中率下降，需要降低出手速度。" },
    { id: 1005, user_id: 1, training_date: daysAgo(3), category: "投篮", duration_min: 60, intensity: 6, total_shots: 96, made_shots: 51, free_throw_attempts: 18, free_throw_makes: 15, mid_attempts: 30, mid_makes: 16, three_attempts: 34, three_makes: 14, note: "中距离稳定，三分出手节奏还需统一。" },
    { id: 1004, user_id: 1, training_date: daysAgo(5), category: "体能", duration_min: 50, intensity: 7, total_shots: 70, made_shots: 34, free_throw_attempts: 12, free_throw_makes: 9, mid_attempts: 22, mid_makes: 10, three_attempts: 24, three_makes: 9, note: "体能训练后投篮稳定性下降。" },
    { id: 1003, user_id: 1, training_date: daysAgo(7), category: "投篮", duration_min: 58, intensity: 6, total_shots: 90, made_shots: 44, free_throw_attempts: 16, free_throw_makes: 13, mid_attempts: 30, mid_makes: 15, three_attempts: 30, three_makes: 11, note: "罚球不错，底角三分需要加强。" },
    { id: 1002, user_id: 1, training_date: daysAgo(9), category: "运球", duration_min: 52, intensity: 6, total_shots: 72, made_shots: 34, free_throw_attempts: 10, free_throw_makes: 8, mid_attempts: 24, mid_makes: 12, three_attempts: 24, three_makes: 9, note: "弱侧手运球后急停投篮不稳定。" },
    { id: 1001, user_id: 1, training_date: daysAgo(11), category: "投篮", duration_min: 55, intensity: 5, total_shots: 80, made_shots: 36, free_throw_attempts: 12, free_throw_makes: 9, mid_attempts: 28, mid_makes: 13, three_attempts: 28, three_makes: 10, note: "基础定点训练，作为阶段起点。" }
  ].map(enrichSession);
}

function enrichSession(item) {
  const total = Number(item.total_shots || 0);
  const made = Number(item.made_shots || 0);
  const ftA = Number(item.free_throw_attempts || 0);
  const ftM = Number(item.free_throw_makes || 0);
  const midA = Number(item.mid_attempts || 0);
  const midM = Number(item.mid_makes || 0);
  const threeA = Number(item.three_attempts || 0);
  const threeM = Number(item.three_makes || 0);
  const paintA = Math.max(0, total - ftA - midA - threeA);
  const paintM = Math.max(0, made - ftM - midM - threeM);
  return Object.assign({}, item, {
    total_shots: total,
    made_shots: made,
    shooting_rate: safeRate(made, total),
    paint_attempts: paintA,
    paint_makes: paintM,
    paint_rate: safeRate(paintM, paintA),
    free_throw_rate: safeRate(ftM, ftA),
    mid_rate: safeRate(midM, midA),
    three_rate: safeRate(threeM, threeA)
  });
}

function ensureSessions() {
  let sessions = wx.getStorageSync(STORAGE_SESSIONS);
  if (!sessions || !sessions.length) {
    sessions = createDemoSessions();
    wx.setStorageSync(STORAGE_SESSIONS, sessions);
  }
  return sessions.map(enrichSession).sort(function(a, b) { return String(b.training_date).localeCompare(String(a.training_date)); });
}

function replaceDemoSessions() {
  const sessions = createDemoSessions();
  wx.setStorageSync(STORAGE_SESSIONS, sessions);
  return sessions;
}

function saveSession(form) {
  const sessions = ensureSessions();
  const id = Date.now();
  const next = enrichSession(Object.assign({}, form, { id: id, user_id: 1 }));
  sessions.unshift(next);
  wx.setStorageSync(STORAGE_SESSIONS, sessions);
  return next;
}

function deleteSession(id) {
  const sessions = ensureSessions().filter(function(item) { return String(item.id) !== String(id); });
  wx.setStorageSync(STORAGE_SESSIONS, sessions);
  return sessions;
}

function getSession(id) {
  const sessions = ensureSessions();
  for (let i = 0; i < sessions.length; i += 1) {
    if (String(sessions[i].id) === String(id)) return sessions[i];
  }
  return sessions[0] || null;
}

function getProfile() {
  const defaults = { id: 1, nickname: "Hooper", skill_level: "中级", position: "SG", weekly_goal_sessions: 4, weekly_goal_minutes: 240, target_accuracy: 55, stage_goal: "4 周内把三分命中率提升到 38%，保持每周至少 4 次训练。" };
  const saved = wx.getStorageSync(STORAGE_PROFILE);
  if (!saved) {
    wx.setStorageSync(STORAGE_PROFILE, defaults);
    return defaults;
  }
  return Object.assign({}, defaults, saved);
}

function saveProfile(profile) {
  const next = Object.assign({}, getProfile(), profile);
  wx.setStorageSync(STORAGE_PROFILE, next);
  return next;
}

function buildSummary(sessions) {
  sessions = (sessions || ensureSessions()).map(enrichSession);
  const totalSessions = sessions.length;
  let totalShots = 0, madeShots = 0, totalDuration = 0, totalLoad = 0;
  let ftA = 0, ftM = 0, midA = 0, midM = 0, threeA = 0, threeM = 0, paintA = 0, paintM = 0;
  const sevenDate = new Date();
  sevenDate.setDate(sevenDate.getDate() - 6);
  const sevenKey = sevenDate.toISOString().slice(0, 10);
  let recentSessions = 0;
  sessions.forEach(function(s) {
    totalShots += Number(s.total_shots || 0);
    madeShots += Number(s.made_shots || 0);
    totalDuration += Number(s.duration_min || 0);
    totalLoad += Number(s.duration_min || 0) * Number(s.intensity || 0);
    ftA += Number(s.free_throw_attempts || 0); ftM += Number(s.free_throw_makes || 0);
    midA += Number(s.mid_attempts || 0); midM += Number(s.mid_makes || 0);
    threeA += Number(s.three_attempts || 0); threeM += Number(s.three_makes || 0);
    paintA += Number(s.paint_attempts || 0); paintM += Number(s.paint_makes || 0);
    if (String(s.training_date) >= sevenKey) recentSessions += 1;
  });
  const latest = sessions[0] || {};
  const last3 = sessions.slice(0, 3);
  const prev3 = sessions.slice(3, 6);
  const lastRate = safeRate(last3.reduce(function(a, s) { return a + Number(s.made_shots || 0); }, 0), last3.reduce(function(a, s) { return a + Number(s.total_shots || 0); }, 0));
  const prevRate = safeRate(prev3.reduce(function(a, s) { return a + Number(s.made_shots || 0); }, 0), prev3.reduce(function(a, s) { return a + Number(s.total_shots || 0); }, 0));
  return {
    total_sessions: totalSessions,
    total_duration: totalDuration,
    avg_duration: totalSessions ? Math.round(totalDuration / totalSessions) : 0,
    total_shots: totalShots,
    made_shots: madeShots,
    avg_shooting_rate: safeRate(madeShots, totalShots),
    recent_7day_sessions: recentSessions,
    recent_7day_rate_change: Math.round((lastRate - prevRate) * 10) / 10,
    total_load: totalLoad,
    latest_date: latest.training_date || "暂无",
    paint_rate: safeRate(paintM, paintA),
    free_throw_rate: safeRate(ftM, ftA),
    mid_rate: safeRate(midM, midA),
    three_rate: safeRate(threeM, threeA)
  };
}

function buildTrend(limit) {
  const sessions = ensureSessions().slice(0, limit || 10).reverse();
  return {
    dates: sessions.map(function(s) { return String(s.training_date).slice(5); }),
    shooting_rates: sessions.map(function(s) { return s.shooting_rate; }),
    durations: sessions.map(function(s) { return Number(s.duration_min || 0); })
  };
}

function buildCategory() {
  const sessions = ensureSessions();
  const map = {};
  let total = 0;
  sessions.forEach(function(s) {
    const key = s.category || "投篮";
    const minutes = Number(s.duration_min || 0);
    map[key] = (map[key] || 0) + minutes;
    total += minutes;
  });
  return Object.keys(map).map(function(key) {
    return { label: key, value: map[key], percent: total ? Math.round(map[key] / total * 1000) / 10 : 0 };
  });
}

function buildZones(session) {
  const sessions = session ? [enrichSession(session)] : ensureSessions();
  const zones = [
    { key: "paint", zone: "禁区", attempts: 0, makes: 0 },
    { key: "mid", zone: "中距离", attempts: 0, makes: 0 },
    { key: "three", zone: "三分", attempts: 0, makes: 0 },
    { key: "ft", zone: "罚球", attempts: 0, makes: 0 }
  ];
  sessions.forEach(function(s) {
    zones[0].attempts += Number(s.paint_attempts || 0); zones[0].makes += Number(s.paint_makes || 0);
    zones[1].attempts += Number(s.mid_attempts || 0); zones[1].makes += Number(s.mid_makes || 0);
    zones[2].attempts += Number(s.three_attempts || 0); zones[2].makes += Number(s.three_makes || 0);
    zones[3].attempts += Number(s.free_throw_attempts || 0); zones[3].makes += Number(s.free_throw_makes || 0);
  });
  return zones.map(function(z) {
    const rate = safeRate(z.makes, z.attempts);
    let level = "level-0";
    if (z.attempts > 0 && rate >= 60) level = "level-4";
    else if (z.attempts > 0 && rate >= 50) level = "level-3";
    else if (z.attempts > 0 && rate >= 40) level = "level-2";
    else if (z.attempts > 0) level = "level-1";
    return Object.assign({}, z, { rate: rate, level: level, label: rate + "%", sub: z.makes + "/" + z.attempts });
  });
}

function buildShotPoints(session) {
  const zones = buildZones(session);
  const base = [
    { x: 48, y: 24, zone: "禁区" }, { x: 38, y: 31, zone: "禁区" }, { x: 58, y: 31, zone: "禁区" },
    { x: 30, y: 47, zone: "中距离" }, { x: 44, y: 53, zone: "中距离" }, { x: 61, y: 50, zone: "中距离" },
    { x: 16, y: 70, zone: "三分" }, { x: 31, y: 78, zone: "三分" }, { x: 51, y: 83, zone: "三分" }, { x: 70, y: 78, zone: "三分" }, { x: 84, y: 70, zone: "三分" },
    { x: 50, y: 58, zone: "罚球" }
  ];
  const zoneRate = {};
  zones.forEach(function(z) { zoneRate[z.zone] = z.rate; });
  return base.map(function(p, idx) {
    const r = zoneRate[p.zone] || 0;
    return Object.assign({ id: "p" + idx, made: ((idx * 17 + Math.round(r)) % 100) < r }, p);
  });
}

function buildAdvice(summary, zones) {
  summary = summary || buildSummary();
  zones = zones || buildZones();
  const weakest = zones.filter(function(z) { return z.attempts > 0; }).sort(function(a, b) { return a.rate - b.rate; })[0];
  const list = [];
  if (summary.avg_shooting_rate >= 55) list.push({ type: "投篮表现", priority: "中", text: "整体命中率较稳定，可以加入移动接球投篮和轻对抗训练。", action: "下次训练增加 4 组移动接球，每组 10 球。" });
  else list.push({ type: "投篮稳定性", priority: "高", text: "整体命中率仍有提升空间，建议先稳定定点投篮节奏。", action: "从近距离开始，连续命中 5 球后再后撤到中距离。" });
  if (weakest) list.push({ type: "短板区域", priority: "高", text: "当前最需要提升的区域是" + weakest.zone + "，命中率约 " + weakest.rate + "% 。", action: "为该区域单独安排 30-50 次出手，并记录偏差方向。" });
  if (summary.recent_7day_sessions < 3) list.push({ type: "训练频率", priority: "中", text: "近 7 天训练次数偏少，建议固定每周训练日。", action: "至少安排 3 次训练，保持数据连续性。" });
  else list.push({ type: "训练连续性", priority: "低", text: "近期训练节奏不错，保持当前频率并关注恢复。", action: "高强度训练后安排 10 分钟拉伸和放松。" });
  return list;
}

module.exports = {
  todayText,
  safeRate,
  ensureSessions,
  replaceDemoSessions,
  saveSession,
  deleteSession,
  getSession,
  getProfile,
  saveProfile,
  buildSummary,
  buildTrend,
  buildCategory,
  buildZones,
  buildShotPoints,
  buildAdvice
};
