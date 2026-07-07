function pad2(n) { return n < 10 ? "0" + n : String(n); }
function today() {
  const d = new Date();
  return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
}
function clampPercent(value) {
  const num = Number(value || 0);
  if (num < 0) return 0;
  if (num > 100) return 100;
  return Math.round(num * 10) / 10;
}
function rateLabel(rate) {
  const value = Number(rate || 0);
  if (value >= 60) return { label: "Excellent", level: "excellent" };
  if (value >= 45) return { label: "Good", level: "good" };
  return { label: "Need Work", level: "work" };
}
function percentWidth(value, maxValue) {
  const max = Number(maxValue || 1);
  return clampPercent(max <= 0 ? 0 : Number(value || 0) / max * 100);
}
module.exports = { today: today, clampPercent: clampPercent, rateLabel: rateLabel, percentWidth: percentWidth };
