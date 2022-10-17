
// var xl = require('excel4node');
let Excel = require('exceljs');
let async = require('async');
let fs = require('fs');
let mkdirp = require('mkdirp');
let moment = require("moment");
// var constants = require('../../constant');
// const helperFn = require(projectHome + '/utils/handleBarHelper');
// const excelUtils = require(projectHome + '/utils/excelUtils');

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

function timediff(start, end) {
    if (start && end) {
        let duration = moment.duration(moment(end).diff(moment(start)));
        hours = duration.asHours();
        return hours;
    } else {
        return 0;
    }
}

let headerFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: {
        argb: 'b2d8b2'
    }
};

let columnFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: {
        argb: 'ccccff'
    }
};

let summaryFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: {
        argb: 'cce5cc'
    }
};

let subHeaderFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: {
        argb: 'ccccff'
    }
};

let cellColor = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: {
        argb: 'f2da97'
    }
};

let thinBorder = {
    top: {style: 'thin'},
    left: {style: 'thin'},
    bottom: {style: 'thin'},
    right: {style: 'thin'}
};

const centerAlign = {
    horizontal: 'center',
    vertical: 'middle'
}

function formatTitle(ws, size, title) {
    let s = String.fromCharCode(65);
    let e = (size > 26) ? String.fromCharCode(64 + parseInt(size / 26)) + String.fromCharCode(64 + size % 26) : String.fromCharCode(64 + size);

    ws.mergeCells(s + 1 + ':' + e + 1);
    /*ws.getCell('A1').alignment = {
        vertical: 'middle',
        horizontal: 'center'
    };*/
    ws.getCell('A1').font = {
        bold: true
    };
    ws.getCell('A1').fill = headerFill;
    ws.getCell('A1').value = title;
}

function headerTopMerged(ws, start, end, value, options) {
    ws.mergeCells(start + ':' + end);
    ws.getCell(start).value = value;
    if (options) {
        if (options.font)
            ws.getCell(start).font = options.font;
        if (options.fill)
            ws.getCell(start).fill = options.fill;
        if (options.alignment)
            ws.getCell(start).alignment = options.alignment;
        if (options.border)
            ws.getCell(start).border = options.border;
    }
}

function mergeCells(ws, offset, size, title, startCol, options) {
    let s = String.fromCharCode(65 + (startCol || 0));
    // let e = (size>26) ?
    // 	String.fromCharCode(64 + parseInt(size/26)) +
    // 	;
    let e = String.fromCharCode(64 + (((startCol || 0) + size) % 26));
    if ((size = Math.round(size / 26)))
        e = String.fromCharCode(64 + size) + e;

    let start = s + offset;
    let end = e + offset;
    ws.mergeCells(start + ':' + end);

    if (title === 'empty') {
        ws.getCell(start).font = {
            bold: true
        };
        ws.getCell(start).fill = (options && options.fill) || cellColor;
        (options && options.border) && (ws.getCell(start).border = options.border);
        (options && options.alignment) && (ws.getCell(start).alignment = options.alignment);
    } else if (title) {
        /*ws.getCell(start).alignment = {
            vertical: 'middle',
            horizontal: 'center'
        };*/
        ws.getCell(start).font = {
            bold: true
        };
        ws.getCell(start).fill = (options && options.fill) || cellColor;
        (options && options.border) && (ws.getCell(start).border = options.border);
        (options && options.alignment) && (ws.getCell(start).alignment = options.alignment);
        (options && options.numFmt) && (ws.getCell(start).numFmt = options.numFmt);
        ws.getCell(start).value = title;
    }
}

function mergeCellsHandler(ws, from, to, title, titleCenter, applyBgColor, penColor) {
    let font = penColor ? penColor : {bold: true};
    ws.mergeCells(from + ':' + to);
    if (title) {
        if (titleCenter) {
            ws.getCell(from).alignment = {
                vertical: 'middle',
                horizontal: 'center'
            };
        }
        ws.getCell(from).font = font;
        if (applyBgColor) {
            ws.getCell(from).fill = cellColor;
        }
        ws.getCell(from).value = title;
    }
}

function fillCells(ws, offset, size, fill) {
    for (let i = 0; i < size; i++) {
        let s = String.fromCharCode(65 + i);
        winston.info(s + offset);
        ws.getCell(s + offset).fill = fill;
    }
}

function bold(cell) {
    cell.font = {
        bold: true
    };
}

function formatColumnHeaders(ws, offset, names, sizes) {
    let count = 0;
    for (let i = 0; i < names.length; i++) {
        if (i % 26 == 0) {
            count = 0
        }
        if (names[i]) {
            let column;
            if (i > 51) {
                column = "B" + (String.fromCharCode(65 + count));
            } else if (i > 25) {
                column = "A" + (String.fromCharCode(65 + count));
            } else {
                column = String.fromCharCode(65 + i);
            }

            ws.getCell(column + offset).value = names[i];
            ws.getColumn(column).width = sizes[i];
            ws.getCell(column + offset).fill = columnFill;
            ws.getCell(column + offset).font = {
                bold: true
            };
            ws.getCell(column + offset).border = {
                top: {style: 'thin'},
                left: {style: 'thin'},
                bottom: {style: 'thin'},
                right: {style: 'thin'}
            };
        }
        count++;
    }
}

/*function formatColumnHeadersHandler(ws, offset, names, sizes){
	for (let i = 0; i < names.length; i++) {
		let column = (i>25)?"A"+(String.fromCharCode(65 + i)):String.fromCharCode(65 + i);
		ws.getCell(column + offset).value = names[i];
		ws.getColumn(column).width = sizes[i];
		ws.getCell(column + offset).fill = columnFill;
		ws.getCell(column + offset).font = {
			bold: true
		};
	}
}*/

function saveFileAndReturnCallback(workbook, clientId, folderType, reportname, callback) {
    let dir = 'reports/' + clientId + '/' + folderType + '/';
    filename = reportname + '_' + moment(new Date()).format("DD-MM-YYYY") + '.xlsx';
    mkdirp.sync('./files/' + dir);
    workbook.xlsx.writeFile('./files/' + dir + filename).then(function () {
        callback({
            url: commonUtil.getConfig('download_url') + dir + filename,
            dir: dir,
            filename: filename
        });
    });
}

/**Generates pre profitability excel with multiple possible aggregateBy variants **/

function getHourDiff(date1, date2, decimalPlace) {
    let hours = Math.abs(date1 - date2) / 36e5;
    let dp = decimalPlace || 2;
    return Math.round(hours * Math.pow(10, dp)) / Math.pow(10, dp);
}

function fillHeader(worksheet, row, header, column, color) {
    for (let col = 0; col < column.length; col++) {
        let i = header.indexOf(column[col]);
        let c = (i > 25) ? ("A" + (String.fromCharCode(65 + count))) : String.fromCharCode(65 + i);

        worksheet.getCell(c + row).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: {
                argb: color
            }
        };
    }
}


let addWorkbookRowDefaultBlank = function (data, workbook, headers, rowNum, showNA, options) {
    let count = 0;

    let show = (showNA === false) ? "" : "";

    for (let j = 0; j < headers.length; j++) {

        if (j % 26 == 0) {
            count = 0
        }
        let column;
        if (j > 51) {
            column = "B" + (String.fromCharCode(65 + count));
        } else if (j > 25) {
            column = "A" + (String.fromCharCode(65 + count));
        } else {
            column = String.fromCharCode(65 + j);
        }
        /*
				if (j === 26) {
					count = 0
				}
				let column = (j > 25) ? ("A" + (String.fromCharCode(65 + count))) : String.fromCharCode(65 + j);

		 */
        workbook.getCell(column + rowNum).value = (typeof data[headers[j]] === "number") ? data[headers[j]] : (data[headers[j]] || show);
        (typeof data[headers[j]] === "string" && data[headers[j]].length > 40) && (workbook.getCell(column + rowNum).alignment = {wrapText: true});
        if (data.hasOwnProperty(headers[j]) && options) {
            if (options.fill)
                workbook.getCell(column + rowNum).fill = options.fill;
            if (options.alignment)
                workbook.getCell(column + rowNum).alignment = {
                    ...options.alignment,
                    ...((typeof data[headers[j]] === "string" && data[headers[j]].length > 40) ? {wrapText: true} : {})
                };
            if (options.border)
                workbook.getCell(column + rowNum).border = options.border;
            if (options.numFmt && options.numFmt[headers[j]]) {
                workbook.getCell(column + rowNum).numFmt = options.numFmt[headers[j]];
            }
        }
        count++;
    }
};

let addWorkbookRow = function (data, workbook, headers, rowNum, showNA, options) {
    let count = 0;
    let show = (showNA === false) ? "" : "";
    for (let j = 0; j < headers.length; j++) {

        if (j % 26 == 0) {
            count = 0
        }
        let column;
        if (j > 51) {
            column = "B" + (String.fromCharCode(65 + count));
        } else if (j > 25) {
            column = "A" + (String.fromCharCode(65 + count));
        } else {
            column = String.fromCharCode(65 + j);
        }
        /*
				if (j === 26) {
					count = 0
				}
				let column = (j > 25) ? ("A" + (String.fromCharCode(65 + count))) : String.fromCharCode(65 + j);

		 */
        workbook.getCell(column + rowNum).value = (typeof data[headers[j]] === "number") ? data[headers[j]] : (data[headers[j]] || show);
        (typeof data[headers[j]] === "string" && data[headers[j]].length > 40) && (workbook.getCell(column + rowNum).alignment = {wrapText: true});
        if (data.hasOwnProperty(headers[j]) && options) {
            if (options.fill)
                workbook.getCell(column + rowNum).fill = options.fill;
            if (options.alignment)
                workbook.getCell(column + rowNum).alignment = {
                    ...options.alignment,
                    ...((typeof data[headers[j]] === "string" && data[headers[j]].length > 40) ? {wrapText: true} : {})
                };
            if (options.border)
                workbook.getCell(column + rowNum).border = options.border;
            if (options.numFmt && options.numFmt[headers[j]]) {
                workbook.getCell(column + rowNum).numFmt = options.numFmt[headers[j]];
            }
        }
        count++;
    }
};
function formAddress(addr) {
    var str = '';
    if (addr.line1) str += addr.line1 + ', ';
    if (addr.line2) str += addr.line2 + ', ';
    if (addr.city) str += addr.city + ', ';
    if (addr.state) str += addr.state + ' ';
    if (addr.pincode) str += addr.pincode + ', ';
    if (addr.country) str += addr.country;
    return str;
}

let addInArrayOnKey = (aData, key) => {
    let toReturn = aData.reduce(function (accumulator, currentValue) {
            let keys = key.split(".");
            let cv = currentValue;
            for (let key of keys) {
                if (cv)
                    cv = cv[key];
                else {
                    cv = 0;
                    break;
                }
            }
            return accumulator + ((cv) ? cv : 0);
        },
        0
    );
    return toReturn;
};

function configName(configs, key, fallBack) {
    if (configs && configs[key]) {
        if (configs[key].visible) {
            return configs[key].label || configs[key].ourLabel;
        } else {
            return;
        }
    } else {
        return fallBack;
    }
}

function ax(value) {
    return value ? [value] : [];
}

function toAlphabet(decimalNumber) {

    const alphabet = 'ZABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const alpLen = 26;
    const maxSize = calculateSize(decimalNumber);
    let str = '';
    let remainderFlag = false;

    while (decimalNumber) {
        let rem = (decimalNumber > 26 ? decimalNumber % alpLen : decimalNumber);
        if (decimalNumber <= 26)
            decimalNumber = 1;
        if (remainderFlag) {
            remainderFlag = false;
            rem--;
        }
        if (rem == 0)
            remainderFlag = true;

        str += alphabet[rem];
        decimalNumber = parseInt(decimalNumber / alpLen);
    }

    return reverseString(str).slice(0, maxSize);

    function calculateSize(num) {
        let counter = 1,
            pow = 0,
            size;

        while ((pow += Math.pow(26, counter))) {
            size = counter++;
            if (pow >= num)
                break;
        }
        return size;
    }

    function reverseString(str) {
        let revStr = '';
        for (let i = str.length - 1; i >= 0; i--)
            revStr += str[i];
        return revStr;
    }
}

module.exports.alertReport = function (aData, body, allEvent, callback) {
    var workbook = new Excel.Workbook();
    var ws1 = workbook.addWorksheet('Exception Report', {
        pageSetup: {paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0}
    });
    ws1.pageSetup.showGridLines = true;

    let header = ['Time', 'Event', 'Location', 'Driver'];
    let header2  =['Time','Event','Location','Driver'];
    let total = 0;
    let total1 = 0;
    let fillColor2 = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
            argb: 'F2D7D5'
        }
    };
    let fillColor = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
            argb: 'D4EFDF'
        }
    };
    formatTitle(ws1, 7, 'Exception Report');
    if (body.from && body.to) {
        ws1.getCell('B3').value = 'From';
        ws1.getCell('C3').value = moment(new Date(body.from)).format("DD-MM-YYYY");
        ws1.getCell('B4').value = 'To';
        ws1.getCell('C4').value = moment(new Date(body.to)).format("DD-MM-YYYY");
        ws1.getCell('B3').fill = fillColor2;
        ws1.getCell('C3').fill = fillColor2;
        ws1.getCell('B4').fill = fillColor2;
        ws1.getCell('C4').fill = fillColor2;
    }
    var rowNum = 5;
    allEvent.forEach(obj =>{
        total += obj.count;
        ws1.getCell('B'+ rowNum).value = obj.event;
        ws1.getCell('B'+ rowNum).fill = fillColor;
        ws1.getCell('C'+ rowNum).fill = fillColor;
        ws1.getCell('C'+ rowNum++).value = obj.count;
    });
    ws1.getCell('B'+ rowNum).value = 'Total';
    ws1.getCell('B'+ rowNum).fill = fillColor2;
    ws1.getCell('C'+ rowNum).fill = fillColor2;
    ws1.getCell('C'+ rowNum++).value = total;

    var lastDateValue = "", lastDateRow, lastVehicleValue = "", lastVehicleRow, newVehicle;

    let dateColor = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
            argb: '8DF8D1'
        }
    };
    let vehicleColor = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
            argb: 'ECF9AC'
        }
    };
    for (var i = 0; i < aData.length; i++) {

        newVehicle = false;
        if ((lastVehicleValue === "" || lastVehicleValue !== aData[i].reg_no)) {

            lastVehicleValue = aData[i].reg_no;
            lastVehicleRow = rowNum;
            newVehicle = true;
            mergeCells(ws1, rowNum++, 7, lastVehicleValue, 0, {fill: vehicleColor});
        }
        if ((lastDateValue === "" || lastDateValue !== aData[i].yearMonthDayUTC || newVehicle)) {
            lastDateValue = aData[i].yearMonthDayUTC;
            lastDateRow = rowNum;
            mergeCells(ws1, rowNum++, 7, lastDateValue, 0, {fill: dateColor});
        }
         total1 += aData[i].data.length;
        if( aData[i].eventType === 'value and Limit') {
            header2 = ['Time', 'Event', 'Location', 'Driver', 'Max(km/h)', 'Limit(km/h)'];
            formatColumnHeaders(ws1, rowNum++, header2, [15, 20, 40, 15, 15, 15, 15]);
            aData[i].data.forEach(obj => {
                var row = {};
                row['Time'] = moment(new Date(obj.date)).format("HH:mm:ss") || '';
                row['Event'] = aData[i]._id.code || '';
                row['Location'] = obj.location && obj.location.address || '';
                row['Driver'] = aData[i].driver || '';
                row['Max(km/h)'] = obj.extra || '';
                row['Limit(km/h)'] =  60;//obj.limit
                // if(obj.duration){
                //     obj.duration = parseInt(parseInt(obj.duration)/60);
                // }else if(obj.extra){
                //     obj.duration = parseInt(parseInt(obj.extra)/60);
                // }
                // row['Duration(Min)'] = obj.duration || '';
                addWorkbookRow(row, ws1, header2, (rowNum++));
            });
        }else if( aData[i].eventType === 'Value extra') {
            header2 = ['Time', 'Event', 'Location', 'Driver', 'Max(km/h/s)'/*, 'Limit(km/h/s)'*/];
            formatColumnHeaders(ws1, rowNum++, header2, [15, 20, 40, 15, 15, 15, 15]);
            aData[i].data.forEach(obj => {
                var row = {};
                row['Time'] = moment(new Date(obj.date)).format("HH:mm:ss") || '';
                row['Event'] = aData[i]._id.code || '';
                row['Location'] = obj.location && obj.location.address || '';
                row['Driver'] = aData[i].driver || '';
                row['Max(km/h/s)'] = obj.extra|| 16;
                // row['Limit(km/h/s)'] = obj.limit  || (body.user_id === 'castrol_dgfc' ? 14 : (row['Event'] === 'Rapid Acceleration') ? 8 : (row['Event'] === 'Harsh Break') ? 10 : 14);
                //row['Duration'] = obj.duration || '';
                addWorkbookRow(row, ws1, header2, (rowNum++));
            });
        }else if( aData[i].eventType === 'Duration') {
            header2 = ['Time', 'Event', 'Location', 'Driver', 'Duration(Min)'];
            formatColumnHeaders(ws1, rowNum++, header2, [15, 20, 40, 15, 15, 15, 15]);
            aData[i].data.forEach(obj => {
                var row = {};
                row['Time'] = moment(new Date(obj.date)).format("HH:mm:ss") || '';
                row['Event'] = aData[i]._id.code || '';
                row['Location'] = obj.location && obj.location.address || '';
                row['Driver'] = aData[i].driver || '';
                if(obj.duration){
                    obj.duration = parseInt(parseInt(obj.duration)/60);
                }else if(obj.extra){
                    obj.duration = parseInt(parseInt(obj.extra)/60);
                }
                row['Duration(Min)'] = obj.duration || '';
                addWorkbookRow(row, ws1, header2, (rowNum++));
            });
        }else if(aData[i].eventType === 'Moment') {
            header2 = ['Time', 'Event', 'Location', 'Driver'];
            formatColumnHeaders(ws1, rowNum++, header2, [15, 20, 40, 15, 15, 15, 15]);
            aData[i].data.forEach(obj => {
                var row = {};
                row['Time'] = moment(new Date(obj.date)).format("HH:mm:ss") || '';
                row['Event'] = aData[i]._id.code || '';
                row['Location'] = obj.location && obj.location.address || '';
                row['Driver'] = aData[i].driver || '';
                addWorkbookRow(row, ws1, header2, (rowNum++));
            });
        }

    }

    saveFileAndReturnCallback(workbook, '10809', 'Exception Report', 'Exception Report', callback);
};

module.exports.alertReportData = function (aData, from, to, clientId, callback) {

    let workbook = new Excel.Workbook();
    let ws1 = workbook.addWorksheet('Event Report');

    let headers = [
        "Date",
        "vehicle No",
        "Event",
        "address",
        "Driver",
        "Value",
        "speed",
        "Latitude",
        "Longitude",
    ];

    let rowNum = 6;
    formatTitle(ws1, headers.length, "Event  Reports");
    let fillColor2 = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
            argb: 'F2D7D5'
        }
    };
    let fillColor = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
            argb: 'D4EFDF'
        }
    };
    if (from && to) {
        ws1.getCell('B3').value = 'From';
        ws1.getCell('C3').value = moment(new Date(from)).format("DD-MM-YYYY");
        ws1.getCell('D3').value = 'To';
        ws1.getCell('E3').value = moment(new Date(to)).format("DD-MM-YYYY");
        ws1.getCell('B3').fill = fillColor2;
        ws1.getCell('C3').fill = fillColor2;
        ws1.getCell('D3').fill = fillColor2;
        ws1.getCell('E3').fill = fillColor2;
    }
    formatColumnHeaders(ws1, 5, headers, [20, 15, 15, 50, 15, 15, 15, 15, 15, 15]);

    aData.forEach(obj => {

        let row = {};
        row["vehicle No"] = obj.reg_no || '';
        row["Event"] = obj.code || '';
        row["Date"] = obj.datetime && moment(new Date(obj.datetime)).format("DD-MM-YYYY  HH:mm:ss") || '';
        row["Driver"] = obj.driver || '';
        row["Value"] = obj.extra|| 0;
        row["Longitude"] = (obj.location && obj.location.lng || '0');
        row["Latitude"] = (obj.location && obj.location.lat || '0');
        row["speed"] = (obj.location && obj.location.speed || 0);
        row["address"] = (obj.location && obj.location.address || '');
        addWorkbookRow(row, ws1, headers, (rowNum++));
    });

    saveFileAndReturnCallback(workbook, clientId, 'Event', 'Event Report', callback);
};

module.exports.vehicleExceptionsReport = function (aData,  from, to, clientId, callback) {

    let workbook = new Excel.Workbook();
    let ws1 = workbook.addWorksheet('vehicle Exceptions  Report');

    let headers = [
        "SrNo",
        "vehicle No",
        "Harsh Brake Count",
        "Harsh Acceleration Count",
        "Continuous Driving Count",
        "Count Of Overspeeding",
        "Max Driving Count",
        "Night Driving Count",
        // "Speed Violation Count",
        // "POI Violation Count",
        // "POI Hit Count",
    ];

    let rowNum = 6;
    formatTitle(ws1, headers.length, "vehicle Exceptions  Report");
    let fillColor2 = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
            argb: 'F2D7D5'
        }
    };
    let fillColor = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
            argb: 'D4EFDF'
        }
    };
    if (from && to) {
        ws1.getCell('B3').value = 'From';
        ws1.getCell('C3').value = moment(new Date(from)).format("DD-MM-YYYY");
        ws1.getCell('D3').value = 'To';
        ws1.getCell('E3').value = moment(new Date(to)).format("DD-MM-YYYY");
        ws1.getCell('B3').fill = fillColor2;
        ws1.getCell('C3').fill = fillColor2;
        ws1.getCell('D3').fill = fillColor2;
        ws1.getCell('E3').fill = fillColor2;
    }
    formatColumnHeaders(ws1, 5, headers, [5, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15]);

    aData.forEach((obj, index) => {

        let row = {};
        row["SrNo"] = index + 1;
        row["vehicle No"] = obj.vehicle || 'NA';

        for (let j = 0; j < obj.aCode.length; j++) {
            let key = obj.aCode[j].code;
            switch (key) {
                case 'over_speed':
                    row["Count Of Overspeeding"] = obj.aCode[j].count || '0';
                    break;
                case 'ha':
                    row["Harsh Acceleration Count"] = obj.aCode[j].count || '0';
                    break;
                case 'hb':
                    row["Harsh Brake Count"] = obj.aCode[j].count || '0';
                    break;
                case 'cd':
                    row["Continuous Driving Count"] = obj.aCode[j].count || '0';
                    break;
                case 'nd':
                    row["Night Driving Count"] = obj.aCode[j].count || '0';
                    break;
                case 'fw':
                    row["Max Driving Count"] = obj.aCode[j].count || '0';
                    break;
                // case 'halt':
                //     row["Speed Violation Count"] = obj.aCode[j].count || '0';
                //     break;
                // case 'rt':
                //     row["POI Violation Count"] = obj.aCode[j].count || '0';
                //     break;
                // case 'sos':
                //     row["POI Hit Count"] = obj.aCode[j].count || '0';
                //     break;
            }
        }
        addWorkbookRow(row, ws1, headers, (rowNum++));
    });

    saveFileAndReturnCallback(workbook, clientId, 'vehicle Exceptions', 'vehicle Exceptions Report', callback);
};

module.exports.alertActionReportData = function (aData, from, to, clientId, callback) {

    let workbook = new Excel.Workbook();
    let ws = workbook.addWorksheet('Action Event Report');
    let rowOffset = 1;

    setVal(ws, 'A', rowOffset, "From", {fill: '34abeb', border: true});
    setVal(ws, 'B', rowOffset, moment(new Date(from)).format("DD-MM-YYYY"), {border: true});
    setVal(ws, 'C', rowOffset, "To", {fill: '34abeb', border: true});
    setVal(ws, 'D', rowOffset, moment(new Date(to)).format("DD-MM-YYYY"), {border: true});
    rowOffset++;

    setVal(ws, 'A', rowOffset, 'Vehicle', {fill: true, border: true, width: 13});
    setVal(ws, 'B', rowOffset, 'Time', {fill: true, border: true, width: 24});
    setVal(ws, 'C', rowOffset, 'Event', {fill: true, border: true, width: 17});
    setVal(ws, 'D', rowOffset, 'Action Time', {fill: true, border: true, width: 26});
    setVal(ws, 'E', rowOffset, 'Action Taken', {fill: true, border: true, width: 26});
    setVal(ws, 'F', rowOffset, 'Driver', {fill: true, border: true, width: 13});
    setVal(ws, 'G', rowOffset, 'Value', {fill: true, border: true, width: 13});
    setVal(ws, 'H', rowOffset, 'Address', {fill: true, border: true, width: 80});
    rowOffset++;

    aData.forEach(oData => {
        ws.mergeCells(`A${rowOffset}:H${rowOffset}`);
        setVal(ws, 'H', rowOffset, `Vehicle No - ${oData._id}`, {fill: 'fcbf32', border: true});
        rowOffset++;
        oData.alerts.forEach(oAlert => {
            setVal(ws, 'A', rowOffset, oAlert.reg_no, {border: true, width: 13});
            setVal(ws, 'B', rowOffset, moment(oAlert.datetime).format('LLL'), {border: true, width: 24});
            setVal(ws, 'C', rowOffset, oAlert.code, {border: true, width: 17});
            setVal(ws, 'D', rowOffset, moment(oAlert.actions[0].time).format('LLL'), {border: true, width: 26});
            setVal(ws, 'E', rowOffset, oAlert.actions[0].action, {border: true, width: 26});
            setVal(ws, 'F', rowOffset, oAlert.driver, {border: true, width: 13});
            setVal(ws, 'G', rowOffset, oAlert.extra, {border: true, width: 13});
            setVal(ws, 'H', rowOffset, oAlert.location && oAlert.location.address || '', {border: true, width: 80});
            rowOffset++;

            oAlert.actions.slice(1).forEach(oAction => {
                setVal(ws, 'D', rowOffset, moment(oAction.time).format('LLL'), {border: true, width: 26});
                setVal(ws, 'E', rowOffset, oAction.action, {border: true, width: 26});
                rowOffset++;
            });
        });
    });

    saveFileAndReturnCallback(workbook, clientId, 'Event', 'Event Report', callback);
};

module.exports.dayWiseTagReportData = function (aData, from, to, clientId, callback) {

    let workbook = new Excel.Workbook();
    let ws = workbook.addWorksheet('Day Wise Tag Report');
    let rowOffset = 1;

    ws.mergeCells(`A${rowOffset}:D${rowOffset}`);
    setVal(ws, 'D', rowOffset, "Day Wise Tag Report", {fill: 'c1c1c1', border: true});
    rowOffset++;

    setVal(ws, 'A', rowOffset, "From", {fill: '34abeb', border: true});
    setVal(ws, 'B', rowOffset, moment(new Date(from)).format("DD-MM-YYYY"), {border: true});
    setVal(ws, 'C', rowOffset, "To", {fill: '34abeb', border: true});
    setVal(ws, 'D', rowOffset, moment(new Date(to)).format("DD-MM-YYYY"), {border: true});
    rowOffset++;

    setVal(ws, 'A', rowOffset, 'Time', {fill: true, border: true, width: 24});
    setVal(ws, 'B', rowOffset, 'Student', {fill: true, border: true, width: 13});
    setVal(ws, 'C', rowOffset, 'Event', {fill: true, border: true, width: 17});
    setVal(ws, 'D', rowOffset, 'Address', {fill: true, border: true, width: 80});

    rowOffset++;

    let cnt = 0;
    let aDriverVal = [];
    aData.forEach(oData => {
        ws.mergeCells(`A${rowOffset}:D${rowOffset}`);
        setVal(ws, 'D', rowOffset, oData._id.day, {fill: 'fcbf32', border: true});
        rowOffset++;

        if(oData.data.length>0){
            let aDetails = oData.data;
            aDetails.forEach(oDetail => {
                let oAlert = oDetail.detail;
                let firstArrValue = oAlert[0];
                if(oAlert.length>1 && oDetail.student==firstArrValue.driver) {
                   // if(oDetail.student==firstArrValue.driver) {

                        setVal(ws, 'A', rowOffset, moment(firstArrValue.datetime).format('LLL'), {
                            border: true,
                            width: 24
                        });
                        setVal(ws, 'B', rowOffset, firstArrValue.driver, {border: true, width: 13});
                        setVal(ws, 'C', rowOffset, "IN", {border: true, width: 26});
                        setVal(ws, 'D', rowOffset, firstArrValue.location && firstArrValue.location.address || '', {
                            border: true,
                            width: 80
                        });
                        rowOffset++;
                    //}

                    let lastArrValue = oAlert[oAlert.length - 1];
                    setVal(ws, 'A', rowOffset, moment(lastArrValue.datetime).format('LLL'), {border: true, width: 24});
                    setVal(ws, 'B', rowOffset, lastArrValue.driver, {border: true, width: 13});
                    setVal(ws, 'C', rowOffset, "OUT", {border: true, width: 26});
                    setVal(ws, 'D', rowOffset, lastArrValue.location && lastArrValue.location.address || '', {
                        border: true,
                        width: 80
                    });

                    rowOffset++;
                }
            });
        }

    });

    saveFileAndReturnCallback(workbook, clientId, 'Event', 'DayWiseTagReport', callback);
};



function setVal(worksheet, column, row, value = '', prop = {}) {
    let cell = worksheet.getCell(column+row);
    cell.value = value;
    if (prop.fill) {
        cell.fill = typeof prop.fill === 'boolean' ? columnFill : {
            type: 'pattern',
            pattern: 'solid',
            fgColor: {
                argb: prop.fill
            }
        };
    }
    if (prop.border) {
        cell.border = {
            top: {style: 'thin'},
            left: {style: 'thin'},
            bottom: {style: 'thin'},
            right: {style: 'thin'}
        };
    }
    if (prop.width) {
        worksheet.getColumn(column).width = prop.width;
    }
}
