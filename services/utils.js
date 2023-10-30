const { DEFAULTQUERY } = require('../constants/common');

module.exports.getPageSize = (page, limit) => {
    return {
        page: page || DEFAULTQUERY.page,
        limit: limit || DEFAULTQUERY.limit,
    }
}