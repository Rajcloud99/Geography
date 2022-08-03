let AccessControl = require('../models/accessControl');
const serverSidePage = require('../utils/serverSidePagination');
const otherUtil = require('../utils/otherUtils');

const ALLOWED_FILTER = ['_id', 'name', 'userId', 'clientId', 'password', 'deleted'];

function constructFilters(oQuery) {
    let oFilter = {};
    for (let i in oQuery) {
        if (otherUtil.isAllowedFilter(i, ALLOWED_FILTER)) {
            if (otherUtil.isBSON(oQuery[i])) {
                oFilter[i] = otherUtil.toBSON(oQuery[i]);
            } else {
                oFilter[i] = oQuery[i];
            }
        }
    }
    return oFilter;
}

async function findUserAggr(query, proj = {}) {
    let oFilter = constructFilters(query);
    query.aggQuery = [
        {$match: oFilter},
    ];
    if(Object.keys(proj).length)
        query.aggQuery.push({$project: proj});
    let aUsers = await serverSidePage.requestData(AccessControl, query);
    return aUsers;
}

async function regUser(body) {
    let savedUser = await AccessControl.create(body);
    if (savedUser) {
        return savedUser;
    } else {
        return null;
    }
}

async function updateUser(query, body) {

    let uUpdate = {};

    if (body.set) {
        uUpdate.$set = body.set
    }

    if (body.unset) {
        uUpdate.$unset = body.unset
    }
    if (body.addToSet) {
        uUpdate.$addToSet = body.addToSet;
    }
    if (body.pull) {
        uUpdate.$pull = body.pull;
    }

    if (body.stock) {
        uUpdate.$inc = {stock: body.stock}
    }

    if (Object.keys(uUpdate).length) {
        return await AccessControl.updateOne(query, uUpdate);
    } else {
        let savedUser = await AccessControl.updateOne(query, {$set: body});
        if (savedUser)
            return savedUser;
        else
            return null;
    }
}

module.exports = {
    findUserAggr,
    regUser,
    updateUser
};
