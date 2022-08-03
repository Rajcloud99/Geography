let moment = require("moment");
// let CustomeLandmarks = commonUtil.getModel('customeLandmarks');
let custLandmarkRpt = {};

custLandmarkRpt.headers = ["Name", "Address", "Category", "Latitude", "Longitude", "KM", "Distance", "Category Details"];

custLandmarkRpt.transform = function (obj) {
    try {
        let row = {};
        row["Name"] = obj.name || 'NA';
        row["Address"] = obj.address|| 'NA';
        row["Category"] = obj.category || 'NA';
        row["Latitude"] = obj.location && obj.location.latitude || 'NA';
        row["Longitude"] = obj.location && obj.location.longitude  || 'NA';
        row["KM"] = obj.km|| 'NA';
        row["Distance"] = obj.dist ||  'NA';
        row["Category Details"] = obj.catDet || 'NA';

        return row;
    } catch (e) {
        throw new Error(e);
    }
};

function formatDate(date){
    return date && moment(date).format('DD-MM-YYYY') || '';
}

function round(num){
    return Math.round(num * 100)/100 || 0;
}
module.exports = custLandmarkRpt;
