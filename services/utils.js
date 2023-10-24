const { DEFAULTQUERY } = require('../constants/common');

module.exports.getPageSize = (page, size) => {
    return {
        page: page || DEFAULTQUERY.page,
        size: size || DEFAULTQUERY.size,
    }
}