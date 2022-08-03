const mongoose = require('mongoose');

module.exports = {
    toBSON,
    isBSON,
    searchRegex,
    isAllowedFilter
};

function toBSON(anyStr) {
    if (Array.isArray(anyStr))
        return anyStr.map(s => mongoose.Types.ObjectId(s))
    else
        return mongoose.Types.ObjectId(anyStr);
}

function isBSON(str) {
    return typeof str === 'string' && str.match(/^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i) || false;
}

function searchRegex(str) {
    return new RegExp('^' + str.trim().replace(/[/|\\{}()[\]^$+*?.]/g, '\\$&'), 'i');
}

function isAllowedFilter(sFilter, aAllowedFilter) {
    var isAllowed = false;
    if (aAllowedFilter.indexOf(sFilter) >= 0) {
        isAllowed = true;
    }
    return isAllowed;
}