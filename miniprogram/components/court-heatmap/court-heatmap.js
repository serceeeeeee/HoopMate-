const heatmap = require("../../services/heatmapBuilder");

Component({
  properties: {
    zones: { type: Array, value: [] },
    mode: { type: String, value: "accuracy" },
    title: { type: String, value: "投篮热区图" },
    subtitle: { type: String, value: "颜色越深代表命中率越高，浅灰代表无出手区域" },
    showLegend: { type: Boolean, value: true },
    showSummary: { type: Boolean, value: true },
    showInsight: { type: Boolean, value: true },
    showModeSwitch: { type: Boolean, value: false },
    interactive: { type: Boolean, value: true }
  },
  data: {
    modes: [
      { key: "accuracy", label: "命中率" },
      { key: "attempts", label: "出手量" },
      { key: "makes", label: "命中数" }
    ],
    currentMode: "accuracy",
    tiles: [],
    summary: [],
    legend: [],
    empty: false,
    selectedZoneId: "",
    selectedZone: null,
    bestZone: null,
    weakestZone: null,
    insightText: ""
  },
  observers: {
    "zones, mode": function() {
      this.rebuild();
    }
  },
  lifetimes: {
    attached: function() {
      const self = this;
      this.setData({ currentMode: this.data.mode || "accuracy" }, function() {
        self.rebuild();
      });
    }
  },
  methods: {
    rebuild: function() {
      const currentMode = this.data.currentMode || this.data.mode || "accuracy";
      const result = heatmap.buildHeatmap(this.data.zones || [], { mode: currentMode });
      const selected = this.findSelected(result.tiles, this.data.selectedZoneId) || result.selectedDefault;
      this.setData({
        currentMode: currentMode,
        tiles: result.tiles,
        summary: result.summary,
        legend: result.legend,
        empty: result.empty,
        selectedZoneId: selected ? selected.id : "",
        selectedZone: selected || null,
        bestZone: result.bestZone || null,
        weakestZone: result.weakestZone || null,
        insightText: result.insightText
      });
    },
    findSelected: function(tiles, id) {
      if (!id) return null;
      for (let i = 0; i < tiles.length; i += 1) {
        if (String(tiles[i].id) === String(id)) return tiles[i];
      }
      return null;
    },
    switchMode: function(e) {
      const mode = e.currentTarget.dataset.mode || "accuracy";
      const self = this;
      this.setData({ currentMode: mode }, function() {
        self.rebuild();
      });
    },
    tapZone: function(e) {
      if (!this.data.interactive) return;
      const id = e.currentTarget.dataset.id;
      const selected = this.findSelected(this.data.tiles, id);
      if (!selected) return;
      this.setData({ selectedZoneId: selected.id, selectedZone: selected });
      this.triggerEvent("zonechange", selected);
    },
    goRecord: function() {
      wx.switchTab({ url: "/pages/record/record" });
    }
  }
});
