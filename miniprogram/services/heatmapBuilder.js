// HoopMate 投篮热区数据构建器
// 作用：把后端/本地训练数据统一转换成专业半场热区图所需的数据结构。
// 兼容两类输入：
// 1. 聚合区域：paint / mid / three / ft
// 2. 细分区域：restricted / paint / free_throw / mid_left / top_3 等

function toNumber(value, fallback) {
  const n = Number(value);
  return isNaN(n) ? (fallback || 0) : n;
}

function round1(value) {
  return Math.round(toNumber(value, 0) * 10) / 10;
}

function safeRate(makes, attempts) {
  attempts = toNumber(attempts, 0);
  if (attempts <= 0) return 0;
  return round1(toNumber(makes, 0) / attempts * 100);
}

const ZONE_META = [
  { key: "restricted", name: "近筐", shortName: "近筐", group: "paint" },
  { key: "paint", name: "禁区", shortName: "禁区", group: "paint" },
  { key: "free_throw", name: "罚球", shortName: "罚球", group: "free_throw" },
  { key: "mid_left", name: "左中距离", shortName: "左中", group: "mid" },
  { key: "mid_center", name: "正面中距离", shortName: "正中", group: "mid" },
  { key: "mid_right", name: "右中距离", shortName: "右中", group: "mid" },
  { key: "left_corner_3", name: "左底角三分", shortName: "左底角", group: "three" },
  { key: "left_wing_3", name: "左侧翼三分", shortName: "左翼", group: "three" },
  { key: "top_3", name: "弧顶三分", shortName: "弧顶", group: "three" },
  { key: "right_wing_3", name: "右侧翼三分", shortName: "右翼", group: "three" },
  { key: "right_corner_3", name: "右底角三分", shortName: "右底角", group: "three" }
];

const META_BY_KEY = ZONE_META.reduce(function(map, item) {
  map[item.key] = item;
  return map;
}, {});

function normalizeKey(raw) {
  const value = String(raw || "").trim();
  const lower = value.toLowerCase();
  const map = {
    restricted: "restricted",
    rim: "restricted",
    basket: "restricted",
    paint: "paint",
    in_the_paint: "paint",
    ft: "free_throw",
    free_throw: "free_throw",
    freeThrow: "free_throw",
    mid: "mid",
    mid_range: "mid",
    midrange: "mid",
    mid_left: "mid_left",
    mid_center: "mid_center",
    mid_right: "mid_right",
    three: "three",
    three_point: "three",
    threePoint: "three",
    left_corner_3: "left_corner_3",
    left_wing_3: "left_wing_3",
    top_3: "top_3",
    right_wing_3: "right_wing_3",
    right_corner_3: "right_corner_3",
    "近筐": "restricted",
    "篮下": "restricted",
    "禁区": "paint",
    "罚球": "free_throw",
    "罚球区": "free_throw",
    "中距离": "mid",
    "中投": "mid",
    "三分": "three",
    "左中距离": "mid_left",
    "正面中距离": "mid_center",
    "右中距离": "mid_right",
    "左底角三分": "left_corner_3",
    "左侧翼三分": "left_wing_3",
    "弧顶三分": "top_3",
    "右侧翼三分": "right_wing_3",
    "右底角三分": "right_corner_3"
  };
  return map[value] || map[lower] || lower;
}

function allocateInteger(total, weights) {
  total = Math.max(0, Math.round(toNumber(total, 0)));
  const sum = weights.reduce(function(a, b) { return a + b; }, 0) || 1;
  let values = weights.map(function(w) { return Math.floor(total * w / sum); });
  let remain = total - values.reduce(function(a, b) { return a + b; }, 0);
  let idx = 0;
  while (remain > 0 && values.length) {
    values[idx % values.length] += 1;
    remain -= 1;
    idx += 1;
  }
  return values;
}

function splitAggregate(source, specs) {
  const attempts = Math.max(0, Math.round(toNumber(source.attempts, 0)));
  const makes = Math.max(0, Math.round(toNumber(source.makes, 0)));
  const baseRate = safeRate(makes, attempts);
  const partsAttempts = allocateInteger(attempts, specs.map(function(s) { return s.weight; }));
  let parts = specs.map(function(spec, idx) {
    const partAttempts = partsAttempts[idx] || 0;
    const estimatedRate = Math.max(0, Math.min(100, baseRate + toNumber(spec.rateAdjust, 0)));
    return {
      key: spec.key,
      attempts: partAttempts,
      makes: Math.min(partAttempts, Math.round(partAttempts * estimatedRate / 100))
    };
  });

  // 调整拆分后的命中数，使细分区域加总尽量等于原聚合命中数。
  let diff = makes - parts.reduce(function(sum, p) { return sum + p.makes; }, 0);
  let guard = 0;
  while (diff !== 0 && guard < 200 && parts.length) {
    const i = guard % parts.length;
    if (diff > 0 && parts[i].makes < parts[i].attempts) {
      parts[i].makes += 1;
      diff -= 1;
    } else if (diff < 0 && parts[i].makes > 0) {
      parts[i].makes -= 1;
      diff += 1;
    }
    guard += 1;
  }
  return parts;
}

function compactSourceZones(zones) {
  const map = {};
  (zones || []).forEach(function(z) {
    const key = normalizeKey(z.key || z.code || z.id || z.zone || z.name);
    const attempts = toNumber(z.attempts, 0);
    const makes = toNumber(z.makes, 0);
    if (!map[key]) map[key] = { key: key, attempts: 0, makes: 0, raw: [] };
    map[key].attempts += attempts;
    map[key].makes += makes;
    map[key].raw.push(z);
  });
  return map;
}

function expandToDetailedZones(zones) {
  const source = compactSourceZones(zones);
  const detail = {};

  // 已经是细分区域时直接使用。
  ZONE_META.forEach(function(meta) {
    if (source[meta.key]) {
      detail[meta.key] = {
        key: meta.key,
        name: meta.name,
        shortName: meta.shortName,
        group: meta.group,
        attempts: Math.round(source[meta.key].attempts),
        makes: Math.round(source[meta.key].makes)
      };
    }
  });

  // 兼容旧数据：把禁区 / 中距离 / 三分聚合数据拆成更细区域，保证视觉层次更接近专业热区分析。
  if (source.paint && !detail.restricted && !detail.paint) {
    splitAggregate(source.paint, [
      { key: "restricted", weight: 0.42, rateAdjust: 6 },
      { key: "paint", weight: 0.58, rateAdjust: -3 }
    ]).forEach(function(p) { detail[p.key] = Object.assign({}, META_BY_KEY[p.key], p); });
  }
  if (source.mid && !detail.mid_left && !detail.mid_center && !detail.mid_right) {
    splitAggregate(source.mid, [
      { key: "mid_left", weight: 0.3, rateAdjust: -4 },
      { key: "mid_center", weight: 0.4, rateAdjust: 3 },
      { key: "mid_right", weight: 0.3, rateAdjust: -2 }
    ]).forEach(function(p) { detail[p.key] = Object.assign({}, META_BY_KEY[p.key], p); });
  }
  if (source.three && !detail.left_corner_3 && !detail.left_wing_3 && !detail.top_3 && !detail.right_wing_3 && !detail.right_corner_3) {
    splitAggregate(source.three, [
      { key: "left_corner_3", weight: 0.14, rateAdjust: 5 },
      { key: "left_wing_3", weight: 0.22, rateAdjust: -2 },
      { key: "top_3", weight: 0.28, rateAdjust: 4 },
      { key: "right_wing_3", weight: 0.22, rateAdjust: -4 },
      { key: "right_corner_3", weight: 0.14, rateAdjust: -1 }
    ]).forEach(function(p) { detail[p.key] = Object.assign({}, META_BY_KEY[p.key], p); });
  }
  if (source.free_throw && !detail.free_throw) {
    detail.free_throw = Object.assign({}, META_BY_KEY.free_throw, {
      attempts: Math.round(source.free_throw.attempts),
      makes: Math.round(source.free_throw.makes)
    });
  }

  // 补齐无出手区域，避免空白误解。
  return ZONE_META.map(function(meta) {
    const item = detail[meta.key] || Object.assign({}, meta, { attempts: 0, makes: 0 });
    return Object.assign({}, meta, item, {
      attempts: Math.max(0, Math.round(toNumber(item.attempts, 0))),
      makes: Math.max(0, Math.round(toNumber(item.makes, 0)))
    });
  });
}

function levelForAccuracy(rate, attempts) {
  if (!attempts) return "level-empty";
  if (rate >= 70) return "level-elite";
  if (rate >= 50) return "level-high";
  if (rate >= 30) return "level-mid";
  if (rate > 0) return "level-low";
  return "level-low";
}

function levelForVolume(value, maxValue) {
  if (!value) return "level-empty";
  const ratio = maxValue ? value / maxValue : 0;
  if (ratio >= 0.8) return "level-elite";
  if (ratio >= 0.55) return "level-high";
  if (ratio >= 0.3) return "level-mid";
  return "level-low";
}

function displayForMode(item, mode, totalAttempts, avgRate, maxAttempts, maxMakes) {
  const attempts = toNumber(item.attempts, 0);
  const makes = toNumber(item.makes, 0);
  const rate = safeRate(makes, attempts);
  const share = totalAttempts ? round1(attempts / totalAttempts * 100) : 0;
  const diff = attempts ? round1(rate - avgRate) : 0;
  let displayValue = attempts ? rate + "%" : "无出手";
  let subText = attempts ? makes + "/" + attempts : "0/0";
  let levelClass = levelForAccuracy(rate, attempts);
  let detailLabel = "命中率";

  if (mode === "attempts") {
    displayValue = attempts ? String(attempts) : "0";
    subText = attempts ? "次出手" : "无出手";
    levelClass = levelForVolume(attempts, maxAttempts);
    detailLabel = "出手量";
  }
  if (mode === "makes") {
    displayValue = makes ? String(makes) : "0";
    subText = makes ? "次命中" : "无命中";
    levelClass = levelForVolume(makes, maxMakes);
    detailLabel = "命中数";
  }

  return Object.assign({}, item, {
    id: item.key,
    rate: rate,
    percentage: rate,
    label: attempts ? rate + "%" : "无出手",
    sub: attempts ? makes + "/" + attempts : "0/0",
    displayValue: displayValue,
    subText: subText,
    levelClass: levelClass,
    share: share,
    shareText: share + "%",
    shareWidth: Math.max(6, Math.min(100, share)),
    diff: diff,
    diffText: diff >= 0 ? "+" + diff + "%" : diff + "%",
    detailLabel: detailLabel,
    empty: attempts <= 0
  });
}

function groupSummary(tiles, group, label) {
  const rows = tiles.filter(function(item) { return item.group === group; });
  const attempts = rows.reduce(function(sum, item) { return sum + toNumber(item.attempts, 0); }, 0);
  const makes = rows.reduce(function(sum, item) { return sum + toNumber(item.makes, 0); }, 0);
  const rate = safeRate(makes, attempts);
  return {
    label: label,
    rate: rate,
    rateText: attempts ? rate + "%" : "-",
    sub: attempts ? makes + "/" + attempts : "无出手",
    attempts: attempts,
    makes: makes,
    empty: attempts <= 0
  };
}

function makeInsight(tiles, avgRate) {
  const valid = tiles.filter(function(item) { return item.attempts > 0; });
  if (!valid.length) return "暂无热区数据，请先完成一次包含投篮数据的训练记录。";
  const best = valid.slice().sort(function(a, b) { return b.rate - a.rate || b.attempts - a.attempts; })[0];
  const weak = valid.slice().sort(function(a, b) { return a.rate - b.rate || b.attempts - a.attempts; })[0];
  if (best && weak && best.id !== weak.id) {
    return "最佳区域是" + best.name + "（" + best.rate + "%），需要重点提升" + weak.name + "（" + weak.rate + "%）。建议下次训练为薄弱区域单独安排 30 次定点出手。";
  }
  return "整体命中率为 " + avgRate + "% ，建议继续记录不同区域出手，积累更稳定的训练样本。";
}

function buildHeatmap(zones, options) {
  options = options || {};
  const mode = options.mode || "accuracy";
  const detailed = expandToDetailedZones(zones || []);
  const totalAttempts = detailed.reduce(function(sum, item) { return sum + toNumber(item.attempts, 0); }, 0);
  const totalMakes = detailed.reduce(function(sum, item) { return sum + toNumber(item.makes, 0); }, 0);
  const avgRate = safeRate(totalMakes, totalAttempts);
  const maxAttempts = Math.max.apply(null, detailed.map(function(item) { return item.attempts; }).concat([0]));
  const maxMakes = Math.max.apply(null, detailed.map(function(item) { return item.makes; }).concat([0]));
  const tiles = detailed.map(function(item) {
    return displayForMode(item, mode, totalAttempts, avgRate, maxAttempts, maxMakes);
  });
  const valid = tiles.filter(function(item) { return item.attempts > 0; });
  const best = valid.length ? valid.slice().sort(function(a, b) { return b.rate - a.rate || b.attempts - a.attempts; })[0] : null;
  const weakest = valid.length ? valid.slice().sort(function(a, b) { return a.rate - b.rate || b.attempts - a.attempts; })[0] : null;

  return {
    mode: mode,
    empty: totalAttempts <= 0,
    tiles: tiles,
    selectedDefault: best || tiles[0] || null,
    avgRate: avgRate,
    totalAttempts: totalAttempts,
    totalMakes: totalMakes,
    summary: [
      groupSummary(tiles, "paint", "禁区"),
      groupSummary(tiles, "mid", "中距离"),
      groupSummary(tiles, "three", "三分")
    ],
    bestZone: best,
    weakestZone: weakest,
    insightText: makeInsight(tiles, avgRate),
    legend: [
      { label: "无出手", className: "level-empty" },
      { label: "1%–29%", className: "level-low" },
      { label: "30%–49%", className: "level-mid" },
      { label: "50%–69%", className: "level-high" },
      { label: "70%+", className: "level-elite" }
    ]
  };
}

module.exports = {
  safeRate,
  buildHeatmap,
  expandToDetailedZones
};
