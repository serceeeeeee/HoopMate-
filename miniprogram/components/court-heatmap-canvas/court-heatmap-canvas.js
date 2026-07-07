// CourtHeatmapCanvas
// 彻底返工重写版：Canvas 绘制真实半场篮球场分区热力图。
// 不使用 view 矩形拼接；绘制层级：背景 → 热区色块 → 白色分隔线 → 文字 → 轻量篮筐辅助线。
Component({
  properties: {
    zones: { type: Array, value: [] },
    summary: { type: Array, value: [] },
    title: { type: String, value: '投篮热区图' },
    subtitle: { type: String, value: '颜色越深代表命中率越高，浅灰代表无出手区域' },
    tag: { type: String, value: '命中率' },
    heightRpx: { type: Number, value: 500 },
    showLegend: { type: Boolean, value: true },
    interactive: { type: Boolean, value: true }
  },
  data: {
    zoneList: [],
    summaryList: [],
    selectedZone: null,
    selectedZoneTitle: '',
    empty: false,
    insightText: ''
  },
  observers: {
    'zones, summary': function() { this.rebuild(); }
  },
  lifetimes: {
    attached: function() {
      this._regions = [];
      this._rect = null;
    },
    ready: function() { this.rebuild(); }
  },
  methods: {
    rebuild: function() {
      var zones = this.normalizeZones(this.data.zones || []);
      var summaryList = this.normalizeSummary(this.data.summary || [], zones);
      var best = this.findBest(zones);
      var empty = zones.filter(function(z) { return Number(z.attempts || 0) > 0; }).length === 0;
      var insight = this.buildInsight(zones);
      var self = this;
      this.setData({
        zoneList: zones,
        summaryList: summaryList,
        selectedZone: best,
        selectedZoneTitle: best ? (best.detailName || best.name || '') : '',
        empty: empty,
        insightText: insight
      }, function() { self.scheduleDraw(); });
    },

    normalizeZones: function(input) {
      var map = {};
      for (var i = 0; i < input.length; i += 1) {
        var raw = input[i] || {};
        var key = raw.key || raw.id;
        if (key) map[key] = raw;
      }
      function pick(keys) {
        for (var i = 0; i < keys.length; i += 1) {
          if (map[keys[i]]) return map[keys[i]];
        }
        return {};
      }
      var order = [
        ['leftCorner', '左底角', ['leftCorner', 'left_corner_3']],
        ['leftMid', '左中距', ['leftMid', 'mid_left']],
        ['leftPaint', '左禁区', ['leftPaint', 'left_paint']],
        ['centerPaint', '中禁区', ['centerPaint', 'rim', 'restricted']],
        ['rightPaint', '右禁区', ['rightPaint', 'right_paint']],
        ['rightMid', '右中距', ['rightMid', 'mid_right']],
        ['rightCorner', '右底角', ['rightCorner', 'right_corner_3']],
        ['topArc', '弧顶', ['topArc', 'topThree', 'top_3']],
        ['centerMid', '中距离', ['centerMid', 'mid', 'mid_center']]
      ];
      var zones = [];
      for (var j = 0; j < order.length; j += 1) {
        var def = order[j];
        var raw = pick(def[2]);
        var attempts = Number(raw.attempts || raw.a || 0);
        var made = Number(raw.made || raw.makes || raw.m || 0);
        var pct = attempts > 0 ? this.round1(raw.percentage != null ? Number(raw.percentage) : made / attempts * 100) : 0;
        zones.push({
          key: def[0],
          id: def[0],
          name: raw.name || def[1],
          shortName: raw.shortName || def[1],
          detailName: raw.detailName || raw.name || def[1],
          made: made,
          makes: made,
          attempts: attempts,
          percentage: pct,
          rateText: attempts > 0 ? this.formatPercent(pct) : '—',
          subText: attempts > 0 ? (made + '/' + attempts) : '无出手',
          color: this.rateColor(pct, attempts),
          textColor: attempts > 0 ? '#111827' : '#8A94A6',
          share: raw.share
        });
      }
      var totalAttempts = zones.reduce(function(sum, z) { return sum + Number(z.attempts || 0); }, 0);
      zones.forEach(function(z) {
        z.shareText = z.share != null ? (Math.round(Number(z.share) * 10) / 10) + '%' : (totalAttempts > 0 ? (Math.round(z.attempts / totalAttempts * 1000) / 10) + '%' : '0%');
      });
      return zones;
    },

    normalizeSummary: function(summary, zones) {
      if (summary && summary.length) {
        return summary.map(function(item) {
          return {
            label: item.label,
            value: item.value || (item.percentage != null ? item.percentage + '%' : '—'),
            sub: item.sub || ((item.makes || item.made || 0) + '/' + (item.attempts || 0))
          };
        });
      }
      var groups = {
        paint: { label: '禁区', made: 0, attempts: 0, keys: ['leftPaint', 'centerPaint', 'rightPaint'] },
        mid: { label: '中距离', made: 0, attempts: 0, keys: ['leftMid', 'centerMid', 'rightMid'] },
        three: { label: '三分', made: 0, attempts: 0, keys: ['leftCorner', 'topArc', 'rightCorner'] }
      };
      zones.forEach(function(z) {
        Object.keys(groups).forEach(function(g) {
          if (groups[g].keys.indexOf(z.key) !== -1) {
            groups[g].made += Number(z.made || 0);
            groups[g].attempts += Number(z.attempts || 0);
          }
        });
      });
      var self = this;
      return ['paint', 'mid', 'three'].map(function(k) {
        var g = groups[k];
        var pct = g.attempts > 0 ? self.round1(g.made / g.attempts * 100) : 0;
        return { label: g.label, value: g.attempts > 0 ? self.formatPercent(pct) : '—', sub: g.attempts > 0 ? g.made + '/' + g.attempts : '无出手' };
      });
    },

    findBest: function(zones) {
      var best = null;
      zones.forEach(function(z) {
        if (Number(z.attempts || 0) <= 0) return;
        if (!best || z.percentage > best.percentage) best = z;
      });
      return best;
    },

    buildInsight: function(zones) {
      var valid = zones.filter(function(z) { return Number(z.attempts || 0) > 0; });
      if (!valid.length) return '';
      valid.sort(function(a, b) { return b.percentage - a.percentage; });
      var best = valid[0];
      var weak = valid[valid.length - 1];
      var avgAttempts = valid.reduce(function(s, z) { return s + z.attempts; }, 0) / valid.length;
      var highVolumeWeak = null;
      for (var i = 0; i < valid.length; i += 1) {
        if (valid[i].attempts >= avgAttempts && valid[i].percentage < 45) { highVolumeWeak = valid[i]; break; }
      }
      var text = '最佳区域为' + best.name + '（' + this.formatPercent(best.percentage) + '，' + best.made + '/' + best.attempts + '）。';
      if (highVolumeWeak) {
        text += highVolumeWeak.name + '出手较多但效率偏低，建议安排专项节奏训练。';
      } else {
        text += '薄弱区域为' + weak.name + '，建议在下次训练中增加稳定性练习。';
      }
      return text;
    },

    rateColor: function(pct, attempts) {
      if (!attempts) return '#F1F2F4';
      if (pct < 35) return '#FFE8DC';
      if (pct < 45) return '#FFC7AD';
      if (pct < 55) return '#FF9B63';
      return '#FF5A1F';
    },
    formatPercent: function(n) {
      n = Number(n || 0);
      if (Math.abs(n - Math.round(n)) < 0.05) return Math.round(n) + '%';
      return (Math.round(n * 10) / 10) + '%';
    },
    round1: function(n) { return Math.round(Number(n || 0) * 10) / 10; },

    scheduleDraw: function() {
      var self = this;
      clearTimeout(this._drawTimer);
      this._drawTimer = setTimeout(function() { self.drawCanvas(); }, 50);
    },

    drawCanvas: function() {
      if (this.data.empty) return;
      var self = this;
      this.createSelectorQuery().select('#courtHeatmapCanvas').boundingClientRect(function(rect) {
        if (!rect || !rect.width || !rect.height) return;
        self._rect = rect;
        self.doDraw(rect.width, rect.height);
      }).exec();
    },

    doDraw: function(width, height) {
      var ctx = wx.createCanvasContext('courtHeatmapCanvas', this);
      var W = width;
      var H = height;
      var geo = this.buildGeometry(W, H);
      var zones = this.data.zoneList || [];
      this._regions = geo.regions;

      ctx.clearRect(0, 0, W, H);

      // 第 1 层：浅灰球场背景。
      ctx.setFillStyle('#F6F7F9');
      this.roundRect(ctx, 0, 0, W, H, 12);
      ctx.fill();

      // 第 2 层：真实球场区域热区填充。不再使用普通矩形表格拼接。
      for (var i = 0; i < geo.regions.length; i += 1) {
        var region = geo.regions[i];
        var zone = this.findZone(region.key, zones);
        this.drawRegionPath(ctx, region, zone ? zone.color : '#F1F2F4', true, false);
      }

      // 第 3 层：白色分区线。只画区域边界，避免额外弧线穿过文本。
      ctx.save();
      ctx.setStrokeStyle('#FFFFFF');
      ctx.setLineWidth(2.4);
      if (ctx.setLineCap) ctx.setLineCap('round');
      if (ctx.setLineJoin) ctx.setLineJoin('round');
      for (var j = 0; j < geo.regions.length; j += 1) this.drawRegionPath(ctx, geo.regions[j], null, false, true);
      ctx.restore();

      // 外框浅灰，不出现黑色粗边框。
      ctx.save();
      ctx.setStrokeStyle('#E5E7EB');
      ctx.setLineWidth(1.2);
      this.roundRect(ctx, 0.6, 0.6, W - 1.2, H - 1.2, 12);
      ctx.stroke();
      ctx.restore();

      // 不在热区主体上叠加粗描边，选区信息通过下方详情卡反馈，避免破坏球场整体感。

      // 第 4 层：文字最后绘制，保证不被线条覆盖。
      for (var k = 0; k < geo.regions.length; k += 1) {
        var r = geo.regions[k];
        var z = this.findZone(r.key, zones);
        if (z) this.drawZoneText(ctx, r, z, W);
      }

      // 第 5 层：轻量篮筐辅助线，放在底部无主文字区域。
      this.drawHoopMark(ctx, geo);
      ctx.draw();
    },

    buildGeometry: function(W, H) {
      var left = W * 0.025;
      var top = H * 0.035;
      var right = W * 0.975;
      var bottom = H * 0.965;
      var cx = W * 0.5;
      var cy = H * 0.93;
      var rx = W * 0.59;
      var ry = H * 0.80;
      var leftTheta = -2.52;
      var rightTheta = -0.62;
      var lCut = -1.92;
      var rCut = -1.22;
      var p = function(x, y) { return { x: x * W, y: y * H }; };
      var arc = this.ellipseArcPoints;
      var leftArcPt = { x: left, y: cy + ry * Math.sin(leftTheta) };
      var rightArcPt = { x: right, y: cy + ry * Math.sin(rightTheta) };
      var arcLeftCut = { x: cx + rx * Math.cos(lCut), y: cy + ry * Math.sin(lCut) };
      var arcRightCut = { x: cx + rx * Math.cos(rCut), y: cy + ry * Math.sin(rCut) };
      var bottomCurve = this.bottomArcPoints(W, H, 0.50, 0.825, 0.115, 0.105, 0, Math.PI, 18);

      var regions = [
        {
          key: 'topArc', label: p(0.50, 0.155), compact: true,
          points: [ { x: left, y: top }, { x: right, y: top }, rightArcPt ].concat(arc(cx, cy, rx, ry, rightTheta, leftTheta, 36)).concat([leftArcPt])
        },
        {
          key: 'leftMid', label: p(0.235, 0.355), compact: true,
          points: [leftArcPt].concat(arc(cx, cy, rx, ry, leftTheta, lCut, 18)).concat([p(0.345, 0.485), p(0.255, 0.62), p(0.155, 0.58)])
        },
        {
          key: 'centerMid', label: p(0.50, 0.375), compact: false,
          points: [arcLeftCut].concat(arc(cx, cy, rx, ry, lCut, rCut, 24)).concat([p(0.655, 0.49), p(0.345, 0.49)])
        },
        {
          key: 'rightMid', label: p(0.765, 0.355), compact: true,
          points: [arcRightCut].concat(arc(cx, cy, rx, ry, rCut, rightTheta, 18)).concat([rightArcPt, p(0.845, 0.58), p(0.745, 0.62), p(0.655, 0.485)])
        },
        {
          key: 'leftCorner', label: p(0.145, 0.765), compact: true,
          points: [leftArcPt, p(0.155, 0.58), p(0.255, 0.62), p(0.205, 0.965), { x: left, y: bottom }]
        },
        {
          key: 'rightCorner', label: p(0.855, 0.765), compact: true,
          points: [rightArcPt, { x: right, y: bottom }, p(0.795, 0.965), p(0.745, 0.62), p(0.845, 0.58)]
        },
        {
          key: 'leftPaint', label: p(0.315, 0.655), compact: true,
          points: [p(0.255, 0.62), p(0.345, 0.49), p(0.385, 0.49), p(0.385, 0.825), p(0.305, 0.825), p(0.205, 0.965)]
        },
        {
          key: 'centerPaint', label: p(0.50, 0.665), compact: true,
          points: [p(0.385, 0.49), p(0.615, 0.49), p(0.615, 0.825)].concat(bottomCurve).concat([p(0.385, 0.825)])
        },
        {
          key: 'rightPaint', label: p(0.685, 0.655), compact: true,
          points: [p(0.615, 0.49), p(0.655, 0.49), p(0.745, 0.62), p(0.795, 0.965), p(0.695, 0.825), p(0.615, 0.825)]
        }
      ];
      return { regions: regions, W: W, H: H, left: left, right: right, top: top, bottom: bottom, cx: cx, cy: cy };
    },

    ellipseArcPoints: function(cx, cy, rx, ry, start, end, steps) {
      var pts = [];
      var count = Math.max(2, steps || 18);
      for (var i = 0; i <= count; i += 1) {
        var t = start + (end - start) * i / count;
        pts.push({ x: cx + rx * Math.cos(t), y: cy + ry * Math.sin(t) });
      }
      return pts;
    },

    bottomArcPoints: function(W, H, cxN, cyN, rxN, ryN, start, end, steps) {
      var pts = [];
      var cx = cxN * W;
      var cy = cyN * H;
      var rx = rxN * W;
      var ry = ryN * H;
      for (var i = 0; i <= steps; i += 1) {
        var t = start + (end - start) * i / steps;
        pts.push({ x: cx + rx * Math.cos(t), y: cy + ry * Math.sin(t) });
      }
      return pts;
    },

    drawRegionPath: function(ctx, region, fillStyle, doFill, doStroke) {
      var pts = region.points || [];
      if (!pts.length) return;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (var i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      if (doFill && fillStyle) {
        ctx.setFillStyle(fillStyle);
        ctx.fill();
      }
      if (doStroke) ctx.stroke();
    },

    drawZoneText: function(ctx, region, zone, W) {
      var cx = region.label.x;
      var cy = region.label.y;
      var compact = !!region.compact || W < 340;
      var nameSize = compact ? 9.5 : 11.5;
      var valueSize = compact ? 13.2 : 17;
      var subSize = compact ? 9.5 : 11;
      var textColor = zone.textColor || '#111827';

      ctx.save();
      ctx.setTextAlign('center');
      ctx.setTextBaseline('middle');
      ctx.setFillStyle(textColor);
      ctx.setFontSize(nameSize);
      ctx.fillText(zone.shortName || zone.name, cx, cy - valueSize * 1.08);
      ctx.setFillStyle(textColor);
      ctx.setFontSize(valueSize);
      ctx.fillText(zone.rateText, cx, cy + 1);
      ctx.setFillStyle(zone.attempts > 0 ? '#374151' : '#8A94A6');
      ctx.setFontSize(subSize);
      ctx.fillText(zone.subText, cx, cy + valueSize * 1.05);
      ctx.restore();
    },

    drawHoopMark: function(ctx, geo) {
      var W = geo.W;
      var H = geo.H;
      ctx.save();
      ctx.setStrokeStyle('rgba(255,255,255,0.82)');
      ctx.setLineWidth(1.8);
      ctx.beginPath();
      ctx.moveTo(W * 0.45, H * 0.88);
      ctx.lineTo(W * 0.55, H * 0.88);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(W * 0.5, H * 0.91, W * 0.026, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    },

    findZone: function(key, zones) {
      for (var i = 0; i < zones.length; i += 1) if (zones[i].key === key) return zones[i];
      return null;
    },
    findRegion: function(key) {
      for (var i = 0; i < this._regions.length; i += 1) if (this._regions[i].key === key) return this._regions[i];
      return null;
    },

    handleCanvasTap: function(e) {
      if (!this.data.interactive || !this._regions || !this._regions.length) return;
      var x = e.detail && typeof e.detail.x === 'number' ? e.detail.x : null;
      var y = e.detail && typeof e.detail.y === 'number' ? e.detail.y : null;
      if ((x == null || y == null) && e.touches && e.touches[0] && this._rect) {
        x = e.touches[0].clientX - this._rect.left;
        y = e.touches[0].clientY - this._rect.top;
      }
      if (x == null || y == null) return;
      for (var i = this._regions.length - 1; i >= 0; i -= 1) {
        var region = this._regions[i];
        if (this.pointInPolygon({ x: x, y: y }, region.points)) {
          var zone = this.findZone(region.key, this.data.zoneList);
          if (zone) {
            var self = this;
            this.setData({ selectedZone: zone, selectedZoneTitle: zone.detailName || zone.name }, function() { self.scheduleDraw(); });
            this.triggerEvent('zonechange', zone);
          }
          return;
        }
      }
    },

    pointInPolygon: function(point, polygon) {
      var inside = false;
      for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        var xi = polygon[i].x, yi = polygon[i].y;
        var xj = polygon[j].x, yj = polygon[j].y;
        var intersect = ((yi > point.y) !== (yj > point.y)) &&
          (point.x < (xj - xi) * (point.y - yi) / ((yj - yi) || 1) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    },

    roundRect: function(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h);
      ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
    },

    goRecord: function() { wx.switchTab({ url: '/pages/record/record' }); }
  }
});
