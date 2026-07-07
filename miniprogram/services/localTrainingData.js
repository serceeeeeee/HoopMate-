// 本地演示数据：当后端未启动或请求失败时，页面仍可正常展示，避免首页空白。
const localSessions = [
  {
    id: 1001,
    training_date: '2026-07-01',
    category: '投篮',
    duration_min: 60,
    intensity: 6,
    total_shots: 100,
    made_shots: 48,
    shooting_rate: 48,
    free_throw_attempts: 20,
    free_throw_makes: 16,
    mid_attempts: 35,
    mid_makes: 18,
    three_attempts: 30,
    three_makes: 9,
    training_load: 360,
    note: '中距离手感稳定，三分出手节奏需要继续调整。'
  },
  {
    id: 1002,
    training_date: '2026-07-03',
    category: '投篮',
    duration_min: 75,
    intensity: 7,
    total_shots: 120,
    made_shots: 66,
    shooting_rate: 55,
    free_throw_attempts: 25,
    free_throw_makes: 20,
    mid_attempts: 40,
    mid_makes: 23,
    three_attempts: 35,
    three_makes: 13,
    training_load: 525,
    note: '定点投篮提升明显，底角三分表现较好。'
  },
  {
    id: 1003,
    training_date: '2026-07-05',
    category: '综合',
    duration_min: 90,
    intensity: 8,
    total_shots: 140,
    made_shots: 72,
    shooting_rate: 51.4,
    free_throw_attempts: 30,
    free_throw_makes: 22,
    mid_attempts: 45,
    mid_makes: 24,
    three_attempts: 40,
    three_makes: 14,
    training_load: 720,
    note: '训练强度较高，后半段命中率略有下降。'
  }
];

const localProfile = {
  id: 1,
  nickname: 'Hooper',
  position: 'SG',
  skill_level: '中级',
  weekly_goal_sessions: 4,
  weekly_goal_minutes: 240,
  target_shooting_rate: 55,
  stage_goal: '提升中距离和三分稳定性'
};

function calcRate(makes, attempts) {
  return attempts > 0 ? Math.round((makes / attempts) * 1000) / 10 : 0;
}

function getLocalSummary() {
  const totalShots = localSessions.reduce((sum, item) => sum + Number(item.total_shots || 0), 0);
  const madeShots = localSessions.reduce((sum, item) => sum + Number(item.made_shots || 0), 0);
  const totalDuration = localSessions.reduce((sum, item) => sum + Number(item.duration_min || 0), 0);
  const ftAtt = localSessions.reduce((sum, item) => sum + Number(item.free_throw_attempts || 0), 0);
  const ftMade = localSessions.reduce((sum, item) => sum + Number(item.free_throw_makes || 0), 0);
  const midAtt = localSessions.reduce((sum, item) => sum + Number(item.mid_attempts || 0), 0);
  const midMade = localSessions.reduce((sum, item) => sum + Number(item.mid_makes || 0), 0);
  const threeAtt = localSessions.reduce((sum, item) => sum + Number(item.three_attempts || 0), 0);
  const threeMade = localSessions.reduce((sum, item) => sum + Number(item.three_makes || 0), 0);
  const latest = localSessions[localSessions.length - 1];
  return {
    total_sessions: localSessions.length,
    total_duration: totalDuration,
    total_shots: totalShots,
    made_shots: madeShots,
    avg_shooting_rate: calcRate(madeShots, totalShots),
    recent_7day_sessions: localSessions.length,
    recent_7day_rate_change: 3.4,
    latest_date: latest.training_date,
    paint_rate: calcRate(ftMade, ftAtt),
    mid_rate: calcRate(midMade, midAtt),
    three_rate: calcRate(threeMade, threeAtt),
    training_load: localSessions.reduce((sum, item) => sum + Number(item.training_load || 0), 0)
  };
}

function getLocalTrend() {
  const maxDuration = Math.max.apply(null, localSessions.map(item => item.duration_min).concat([1]));
  return {
    dates: localSessions.map(item => item.training_date.slice(5)),
    shooting_rates: localSessions.map(item => item.shooting_rate),
    durations: localSessions.map(item => item.duration_min),
    durationMax: maxDuration
  };
}

function getLocalCategory() {
  return {
    items: [
      { name: '投篮', count: 2, percent: 66.7 },
      { name: '综合', count: 1, percent: 33.3 }
    ]
  };
}

function getLocalZones() {
  return {
    zones: [
      { code: 'paint', zone: '禁区', shortName: '禁区', attempts: 55, made: 38, rate: 69.1, color: '#FF9B6A' },
      { code: 'mid', zone: '中距离', shortName: '中投', attempts: 120, made: 65, rate: 54.2, color: '#FFB58F' },
      { code: 'leftCorner', zone: '左底角三分', shortName: '左底角', attempts: 30, made: 11, rate: 36.7, color: '#FFD8C8' },
      { code: 'rightCorner', zone: '右底角三分', shortName: '右底角', attempts: 28, made: 10, rate: 35.7, color: '#FFD8C8' },
      { code: 'topThree', zone: '弧顶三分', shortName: '弧顶', attempts: 47, made: 15, rate: 31.9, color: '#FFE8DF' }
    ]
  };
}

function getLocalShotPoints() {
  const pts = [];
  const coords = [
    [45, 15, true, 'paint'], [53, 18, true, 'paint'], [40, 23, false, 'paint'],
    [35, 42, true, 'mid'], [62, 45, true, 'mid'], [52, 55, false, 'mid'],
    [18, 72, true, 'leftCorner'], [82, 72, false, 'rightCorner'], [48, 78, true, 'topThree'],
    [58, 80, false, 'topThree'], [28, 68, true, 'leftCorner'], [74, 70, true, 'rightCorner']
  ];
  coords.forEach((item, index) => pts.push({ id: index + 1, x: item[0], y: item[1], made: item[2], zone: item[3], label: item[2] ? '命中' : '未中' }));
  return { points: pts };
}

module.exports = {
  localSessions,
  localProfile,
  getLocalSummary,
  getLocalTrend,
  getLocalCategory,
  getLocalZones,
  getLocalShotPoints
};
