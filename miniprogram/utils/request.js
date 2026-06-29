const { API_BASE } = require("./config");

function request(options) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: API_BASE + options.url,
      method: options.method || "GET",
      data: options.data || {},
      header: {
        "content-type": "application/json"
      },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          const message = (res.data && (res.data.detail || res.data.message)) || "请求失败";
          wx.showToast({ title: String(message).slice(0, 24), icon: "none" });
          reject(res);
        }
      },
      fail(err) {
        wx.showToast({ title: "网络请求失败", icon: "none" });
        reject(err);
      }
    });
  });
}

module.exports = { request };
