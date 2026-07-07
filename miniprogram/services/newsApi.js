const req = require("../utils/request");
const mock = require("./mockData");

function filterMock(category, page, pageSize) {
  page = page || 1;
  pageSize = pageSize || 10;
  let rows = mock.mockNews.slice();
  if (category && category !== "全部") {
    rows = rows.filter(function(item) { return item.category === category; });
  }
  const start = (page - 1) * pageSize;
  return {
    items: rows.slice(start, start + pageSize),
    total: rows.length,
    page: page,
    pageSize: pageSize,
    provider: "mock",
    usingMock: true
  };
}

function listNews(options) {
  options = options || {};
  const category = options.category || "全部";
  const page = options.page || 1;
  const pageSize = options.pageSize || 10;
  const query = req.buildQuery({ category: category, page: page, page_size: pageSize });
  return req.request({ url: "/api/news/list?" + query, timeout: 5000 })
    .catch(function() { return Promise.resolve(filterMock(category, page, pageSize)); });
}

function getNewsDetail(id) {
  return req.request({ url: "/api/news/detail/" + encodeURIComponent(id), timeout: 5000 })
    .catch(function() { return Promise.resolve(mock.getNewsById(id)); });
}

module.exports = { listNews: listNews, getNewsDetail: getNewsDetail };
