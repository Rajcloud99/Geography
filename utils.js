module.exports.mergeObjects=function () {
	var obj={};
	for(var i=0; i<arguments.length; i++){
		for (key in arguments[i]){
			obj[key]=arguments[i][key];
		}
	}
	return obj;
};