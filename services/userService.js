let User = require('../models/users');
const serverSidePage = require('../utils/serverSidePagination');

const ALLOWED_FILTER = ['_id','name','userId','mobile','clientId'];

function constructFilters(oQuery) {
    let oFilter = {};
    for (let i in oQuery) {
        if (otherUtil.isAllowedFilter(i, ALLOWED_FILTER)) {
            if (i === 'name') {
                oFilter[i] = new RegExp('^'+oQuery[i].trim().replace(/[/|\\{}()[\]^$+*?.]/g, '\\$&'), 'i');
            }else {
                oFilter[i] = oQuery[i];
            }
        }
    }
    return oFilter;
}

async function findUserAggr(query) {
    let oFilter = constructFilters(query);
    query.aggQuery = [{$match: oFilter}];
    let aUsers = await serverSidePage.requestData(User, query);
    return aUsers;
}

async function regUser(body) {
    let savedUser = await User.create(body);
    if (savedUser) {
        return savedUser;
    } else {
        return null;
    }
};

async function updateUser(query,body) {
    let savedUser = await User.updateOne(query,{$set:body});
    if (savedUser) {
        return savedUser;
    } else {
        return null;
    }
};

module.exports = {
    findUserAggr,
    regUser,
    updateUser
};
