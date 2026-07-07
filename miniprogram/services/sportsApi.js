const api = require("../utils/request");
const mock = require("./mockData");

function filterMock(league) {
  let rows = mock.mockGames.slice();
  if (league && league !== "全部") rows = rows.filter(function(item) { return item.league === league; });
  return { items: rows, provider: "mock", usingMock: true, total: rows.length };
}

function listGames(opts) {
  opts = opts || {};
  const league = opts.league || "全部";
  const query = api.buildQuery({ league: league });
  return api.request({ url: "/api/games/list?" + query, timeout: 7000 }).catch(function() {
    return Promise.resolve(filterMock(league));
  });
}

module.exports = { listGames: listGames };
