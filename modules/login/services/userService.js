let User = require('../models/user');
const serverSidePage = require('../utils/serverSidePagination');
const otherUtil = require('../utils/otherUtils');

const ALLOWED_FILTER = ['_id', 'name', 'userId', 'clientId', 'password', 'deleted'];

function constructFilters(oQuery) {
    let oFilter = {};
    for (let i in oQuery) {
        if (otherUtil.isAllowedFilter(i, ALLOWED_FILTER)) {
            if (i === 'name') {
                oFilter[i] = otherUtil.searchRegex(oQuery[i]);
            } else if (otherUtil.isBSON(oQuery[i])) {
                oFilter[i] = otherUtil.toBSON(oQuery[i]);
            } else {
                oFilter[i] = oQuery[i];
            }
        }
    }
    return oFilter;
}

async function findUserAggr(query, proj = false) {
    try{
        let oFilter = constructFilters(query);
        query.aggQuery = [
            {$match: oFilter},
        ];
        if (proj && Object.keys(proj).length)
            query.aggQuery.push({$project: proj});
        let aUsers = await serverSidePage.requestData(User, query);
        return aUsers;
    }catch(e){
        throw e;
    }
}

async function regUser(body) {
    let savedUser = await User.create(body);
    if (savedUser) {
        return savedUser;
    } else {
        return null;
    }
}

async function updateUser(query, body) {

    let oUpdate = {};

    if (body.set) {
        oUpdate.$set = body.set
    }

    if (body.unset) {
        oUpdate.$unset = body.unset
    }
    if (body.addToSet) {
        oUpdate.$addToSet = body.addToSet;
    }
    if (body.pull) {
        oUpdate.$pull = body.pull;
    }

    if (body.stock) {
        oUpdate.$inc = {stock: body.stock}
    }

    if (Object.keys(oUpdate).length) {
        return await User.updateOne(query, oUpdate);
    } else {
        let savedUser = await User.updateOne(query, {$set: body});
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
