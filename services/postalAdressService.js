const postal = Promise.promisifyAll(require('../models/postal'));

exports.insertPostalAddr = function (oAddress,callback){
    const newAddress = new postal(oAddress);
    newAddress.saveAsync()
        .then(function (updated) {
            return callback(null,updated);
        }).error(function (err) {
        console.log('err'+err.toString());
    })
}

exports.prepareForInsert = function (oAddress){
    let oSettings = {};
    if(oAddress.formatted_address){
        oAddress.formatted_address = oAddress.formatted_address.replace('Unnamed Road,','');
        oAddress.formatted_address = oAddress.formatted_address.replace('Unnamed Road','');
        oAddress.formatted_address = oAddress.formatted_address.replace('unnamed road,','');
        oAddress.formatted_address = oAddress.formatted_address.replace('unnamed road','');
        oAddress.formatted_address = oAddress.formatted_address.replace('unnamed','');
    }
    switch (oAddress.addressServer){
        case 'G':
            oSettings.oUpdate= {refined_addr:true,modified_at:Date.now()};
            oSettings.oUpdate.formatted_address = oAddress.formatted_address;
            oSettings.oUpdate.s = 'G';
            let addres_components = oAddress.address_components;
            if(addres_components && addres_components[0] && addres_components[0].long_name){
                oSettings.oUpdate.asciiname = addres_components[0].long_name;
                oSettings.oUpdate.place_name = addres_components[0].long_name;
                oSettings.oUpdate.place_name_s = addres_components[0].short_name;
            }
            if(addres_components && addres_components[1] && addres_components[1].long_name){
                oSettings.oUpdate.admin3 = addres_components[1].long_name;
                oSettings.oUpdate.admin3_s = addres_components[1].short_name;
            }
            if(addres_components && addres_components[2] && addres_components[2].long_name){
                oSettings.oUpdate.admin2 = addres_components[2].long_name;
                oSettings.oUpdate.admin2_s = addres_components[2].short_name;
            }
            if(addres_components && addres_components[3] && addres_components[3].long_name){
                oSettings.oUpdate.admin1 = addres_components[3].long_name;
                oSettings.oUpdate.admin1_s = addres_components[3].short_name;
            }
            if(addres_components && addres_components[4] && addres_components[4].long_name){
                oSettings.oUpdate.country_name = addres_components[4].long_name;
                oSettings.oUpdate["country_code"] = addres_components[4].short_name;
            }
            break;
        case 'MMI' :
            oSettings.oUpdate= {refined_addr:true,modified_at:Date.now()};
            oSettings.oUpdate.formatted_address = oAddress.formatted_address;
            oSettings.oUpdate.s = 'M';
            let details = oAddress.results;
            oSettings.oUpdate.place_name = details.poi +" "+ details.houseNumber + " " +details.houseName + " "+ details.street;
            oSettings.oUpdate.admin4 = details.subSubLocality + " "+ details.locality + " " + details.village;
            oSettings.oUpdate.admin3 = details.subDistrict + " " + details.district;
            oSettings.oUpdate.admin2 = details.city;
            oSettings.oUpdate.admin1 = details.state;
            oSettings.oUpdate.country_name = details.area;
            oSettings.oUpdate.country_code = 'IN';
            break;
        default : console.log('default');
            break;
    }
    return oSettings;
}