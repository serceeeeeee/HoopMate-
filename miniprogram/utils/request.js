const cfg = require("./config");

function buildQuery(data) {
  data = data || {};
  const keys = Object.keys(data).filter(function(key) {
    return data[key] !== undefined && data[key] !== null && data[key] !== "";
  });
  return keys.map(function(key) {
    return encodeURIComponent(key) + "=" + encodeURIComponent(data[key]);
  }).join("&");
}

function request(options) {
  options = options || {};
  const method = options.method || "GET";
  const data = options.data || {};
  const url = cfg.API_BASE + options.url;
  return new Promise(function(resolve, reject) {
    wx.request({
      url: url,
      method: method,
      data: data,
      timeout: options.timeout || 8000,
      header: { "content-type": "application/json" },
      success: function(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(res);
        }
      },
      fail: function(err) { reject(err); }
    });
  });
}

module.exports = { request: request, buildQuery: buildQuery };
