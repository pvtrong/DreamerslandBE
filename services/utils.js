const { DEFAULTQUERY } = require("../constants/common");

module.exports.getPageSize = (page, limit) => {
  return {
    page: page || DEFAULTQUERY.page,
    limit: limit || DEFAULTQUERY.limit,
  };
};

module.exports.getTimeExactly = (date_time) => {
  date_time = new Date(date_time);
  date_time.setHours(7, 0, 0, 0, 0);
  return date_time;
};
