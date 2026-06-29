const { request } = require("../../utils/request");
const { API_BASE, DEFAULT_USER_ID } = require("../../utils/config");
const { today, clampPercent } = require("../../utils/format");

const defaultForm = () => ({
  user_id: DEFAULT_USER_ID,
  training_date: today(),
  category: "投篮",
  duration_min: 60,
  intensity: 5,
  total_shots: 100,
  made_shots: 50,
  free_throw_attempts: 20,
  free_throw_makes: 15,
  three_attempts: 30,
  three_makes: 10,
  mid_attempts: 30,
  mid_makes: 15,
  note: ""
});

Page({
  data: {
    categories: ["投篮", "运球", "体能", "综合", "比赛", "恢复"],
    categoryIndex: 0,
    form: defaultForm(),
    previewRate: 50,
    sessions: [],
    loading: false,
    exportUrl: ""
  },

  onShow() {
    this.loadSessions();
    this.updatePreview();
  },

  loadSessions() {
    request({ url: `/api/training/sessions?user_id=${DEFAULT_USER_ID}&limit=50` })
      .then(data => this.setData({ sessions: data || [] }))
      .catch(() => {});
  },

  onDateChange(e) {
    this.setData({ "form.training_date": e.detail.value });
  },

  onCategoryChange(e) {
    const index = Number(e.detail.value);
    this.setData({
      categoryIndex: index,
      "form.category": this.data.categories[index]
    });
  },

  onIntensityChange(e) {
    this.setData({ "form.intensity": Number(e.detail.value) });
  },

  onNumberInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = Number(e.detail.value || 0);
    this.setData({ [`form.${field}`]: value }, () => this.updatePreview());
  },

  onTextInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  updatePreview() {
    const f = this.data.form;
    const rate = f.total_shots > 0 ? Math.round(f.made_shots / f.total_shots * 1000) / 10 : 0;
    this.setData({ previewRate: clampPercent(rate) });
  },

  validate(form) {
    if (!form.training_date) return "请选择训练日期";
    if (form.duration_min <= 0) return "训练时长必须大于 0";
    if (form.made_shots > form.total_shots) return "总命中数不能大于总出手数";
    if (form.free_throw_makes > form.free_throw_attempts) return "罚球命中数不能大于出手数";
    if (form.three_makes > form.three_attempts) return "三分命中数不能大于出手数";
    if (form.mid_makes > form.mid_attempts) return "中投命中数不能大于出手数";
    return "";
  },

  submit() {
    const form = this.data.form;
    const error = this.validate(form);
    if (error) {
      wx.showToast({ title: error, icon: "none" });
      return;
    }
    request({ url: "/api/training/sessions", method: "POST", data: form })
      .then(() => {
        wx.showToast({ title: "保存成功", icon: "success" });
        this.setData({ form: defaultForm(), categoryIndex: 0 }, () => this.updatePreview());
        this.loadSessions();
      });
  },

  seedDemo() {
    wx.showModal({
      title: "加载示例数据",
      content: "将生成一组演示训练记录，用于快速体验分析和建议功能。示例数据不代表真实训练结果。",
      success: (res) => {
        if (!res.confirm) return;
        request({ url: `/api/demo/seed?user_id=${DEFAULT_USER_ID}`, method: "POST" })
          .then((data) => {
            wx.showToast({ title: data.message || "已加载", icon: "success" });
            this.loadSessions();
          });
      }
    });
  },

  exportCsv() {
    const url = `${API_BASE}/api/export/csv?user_id=${DEFAULT_USER_ID}`;
    this.setData({ exportUrl: url });
    wx.setClipboardData({ data: url });
    wx.showToast({ title: "导出链接已复制", icon: "success" });
  },

  importCsv() {
    wx.chooseMessageFile({
      count: 1,
      type: "file",
      extension: ["csv"],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0];
        if (!file) return;
        wx.uploadFile({
          url: `${API_BASE}/api/training/import_csv?user_id=${DEFAULT_USER_ID}`,
          filePath: file.path,
          name: "file",
          success: (uploadRes) => {
            try {
              const data = JSON.parse(uploadRes.data || "{}");
              wx.showToast({ title: data.message || "导入完成", icon: "none" });
            } catch (e) {
              wx.showToast({ title: "导入完成", icon: "success" });
            }
            this.loadSessions();
          },
          fail: () => wx.showToast({ title: "CSV 上传失败", icon: "none" })
        });
      }
    });
  },

  remove(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: "确认删除",
      content: "删除后该条训练记录无法恢复，并会影响统计分析结果。",
      success: (res) => {
        if (!res.confirm) return;
        request({ url: `/api/training/sessions/${id}?user_id=${DEFAULT_USER_ID}`, method: "DELETE" })
          .then(() => {
            wx.showToast({ title: "已删除", icon: "success" });
            this.loadSessions();
          });
      }
    });
  }
});
