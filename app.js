console.log("Starting...");
var startTime = new Date().getTime();
function startupParams() {
    var app_params = {};
    if (process.argv.length == 0) {
        app_params.mode = 'production';
        app_params.port = 8080;
        return app_params;
    }
    for (var i = 2; i < process.argv.length; i++) {
        if (process.argv[i].indexOf('-p:') == 0) {
            var port = process.argv[i].replace("-p:", "");
            if (port > 0 && port < 65536) {
                app_params.port = port;
            }
        } else if (process.argv[i].charAt(0).toUpperCase() > 'A' && process.argv[i].charAt(0).toUpperCase() < 'Z') {
            app_params.mode = process.argv[i];
        } else if (process.argv[i].indexOf('-log:') == 0) {
            var logParam = process.argv[i].replace("-log:", "");
            if (logParam.toLowerCase() == "console") {
                app_params.logToConsole = true;
            }
        }
    }
    if (!app_params.port)app_params.port = 8080;
    if (!app_params.mode)app_params.mode = 'production';
    return app_params;
}
var app_params=startupParams();

var log = require('winston');                     console.log("module  winston", new Date().getTime() - startTime);

if (!app_params.logToConsole) {
    log.add(log.transports.File, {filename: 'history.log', level: 'debug', timestamp: true});
    log.remove(log.transports.Console);
}

module.exports.startupMode = app_params.mode;

var cookieParser = require('cookie-parser');        console.log("module  cookie-parser",new Date().getTime() - startTime);
var fs = require('fs');                             console.log("module  fs",new Date().getTime() - startTime);
var express = require('express');                   console.log("module  express",new Date().getTime() - startTime);
var app = express();
var port=app_params.port;
var path=require ('path');                          console.log("module  path",new Date().getTime() - startTime);
var bodyParser = require('body-parser');            console.log("module body-parser",new Date().getTime() - startTime);
var XLSX = require('xlsx');                         console.log("xlsx",new Date().getTime() - startTime);
var uid = require('uniqid');                        console.log("uniqid",new Date().getTime() - startTime);
var BigNumber = require('big-number');              console.log("big-number",new Date().getTime() - startTime);

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.text());
app.use('/',express.static('public'));
var database = require('./dataBase');               console.log("module ./dataBase",new Date().getTime() - startTime);
var ConfigurationError, DBConnectError="No connection";

var access = require('./access')(app);

process.on('uncaughtException', function(err) {
    log.error('Server process failed! Reason:', err);
    console.log('Server process failed! Reason:', err);
});

tryLoadConfiguration();
function tryLoadConfiguration(){      console.log('tryLoadConfiguration...', new Date().getTime() - startTime);
    try {
        database.loadConfig();
        ConfigurationError=null;
    } catch (e) {                    console.log('ConfigurationError=', ConfigurationError);
        ConfigurationError= "Failed to load configuration! Reason:"+e;
    }
}
if (!ConfigurationError) tryDBConnect();
function tryDBConnect(postaction) {                                        console.log('tryDBConnect...', new Date().getTime() - startTime);
    database.databaseConnection(function (err) {
        DBConnectError = null;
        if (err) {
            DBConnectError = "Failed to connect to database! Reason:" + err;              console.log('DBConnectError=', DBConnectError);
        }
        if (postaction)postaction(err);
    });
}
var tempExcelRepDir=path.join(__dirname, './temp/');
try {
    if (!fs.existsSync(tempExcelRepDir)) {
        fs.mkdirSync(tempExcelRepDir);
    }
}catch (e){                                                                                         log.warn('Failed create XLSX_temp directory! Reason:'+e);
    tempExcelRepDir=null;
}

app.get("/sysadmin", function(req, res){                                               log.info("app.get /sysadmin");
    res.sendFile(path.join(__dirname, '/views', 'sysadmin.html'));
});
app.get("/sysadmin/app_state", function(req, res){                                     log.info("app.get /sysadmin/app_state");
    var outData= {};
    outData.mode= app_params.mode;
    outData.port=port;
    outData.connUserName=database.getDBConfig().user;
    if (ConfigurationError) {
        outData.error= ConfigurationError;
        res.send(outData);
        return;
    }
    outData.configuration= database.getDBConfig();
    if (DBConnectError)
        outData.dbConnection= DBConnectError;
    else
        outData.dbConnection='Connected';
    res.send(outData);
});
app.get("/sysadmin/startup_parameters", function (req, res) {                            log.info("app.get /sysadmin/startup_parameters");
    res.sendFile(path.join(__dirname, '/views/sysadmin', 'startup_parameters.html'));
});
app.get("/sysadmin/startup_parameters/get_app_config", function (req, res) {             log.info("app.get /sysadmin/startup_parameters/get_app_config");
    if (ConfigurationError) {
        res.send({error:ConfigurationError});
        return;
    }
    var outData={};
    outData=database.getDBConfig();
    res.send(outData);
});
app.get("/sysadmin/startup_parameters/load_app_config", function (req, res) {           log.info("app.get /sysadmin/startup_parameters/load_app_config");
    tryLoadConfiguration();
    if (ConfigurationError) {
        res.send({error:ConfigurationError});
        return;
    }
    var outData={};
    outData=database.getDBConfig();
    res.send(outData);
});
app.post("/sysadmin/startup_parameters/store_app_config_and_reconnect", function (req, res) {     log.info("app.post /sysadmin/startup_parameters/store_app_config_and_reconnect");
    var newDBConfigString = req.body;
    database.setDBConfig(newDBConfigString);
    var outData = {};
    database.saveConfig(
        function (err) {
            if (err) outData.error = err;
            tryDBConnect(/*postaction*/function (err) {
                if (DBConnectError) outData.DBConnectError = DBConnectError;
                res.send(outData);
            });
        }
    );
});
app.get("/sysadmin/reports_config", function (req, res) {                                    log.info("app.get /sysadmin/reports_config");
    res.sendFile(path.join(__dirname, '/views/sysadmin', 'sql_queries.html'));
});
app.get("/sysadmin/sql_queries/get_script", function (req, res) {                            log.info("app.get /sysadmin/sql_queries/get_script "+req.query.filename);
    var configDirectoryName=getConfigDirectoryName();
    var outData={};
    var sqlFile = './'+configDirectoryName+'/' + req.query.filename + ".sql";
    var jsonFile='./'+configDirectoryName+'/' + req.query.filename + ".json";
    if(fs.existsSync(sqlFile)){
        outData.sqlText = fs.readFileSync(sqlFile,'utf8');
    }else{
        fs.writeFileSync(sqlFile,"");
        outData.sqlText="";
    }
    if(fs.existsSync(jsonFile)){
        outData.jsonText = fs.readFileSync(jsonFile).toString();
    }else{
        fs.writeFileSync(jsonFile,"");
        outData.jsonText="";
    }
    res.send(outData);
});

app.post("/sysadmin/sql_queries/get_result_to_request", function (req, res) {                 log.info("app.post /sysadmin/sql_queries/get_result_to_request", req.body,{});
    var newQuery = req.body;
    var sUnitlist = req.query.stocksList;
    var bdate = req.query.bdate;
    var edate = req.query.edate;
    database.getQueryResult(newQuery, req.query,
        function (err,result) {
           var outData = {};
            if (err) {
                outData.error = err.message;                                             log.error("database.getQueryResult err =",err);
                res.send(outData);
                return;
            }
            outData.result = result;
            res.send(outData);
        }
    );
});
app.post("/sysadmin/sql_queries/save_sql_file", function (req, res) {                         log.info("app.post /sysadmin/sql_queries/save_sql_file");
    var configDirectoryName  = getConfigDirectoryName();

    var newQuery = req.body;
        var filename = req.query.filename;
        var outData = {};
        var textSQL = newQuery.textSQL;
        var textJSON = newQuery.textJSON;

        var formattedJSONText=getJSONWithoutComments(textJSON);
        if (textJSON) {
            var JSONparseERROR;
            try {
                JSON.parse(formattedJSONText);
            } catch (e) {
                outData.JSONerror = "JSON file not saved! Reason:" + e.message;
                JSONparseERROR = e;
            }
            if (!JSONparseERROR) {
                fs.writeFile("./"+configDirectoryName+"/" + filename + ".json", textJSON, function (err) {
                    if (textSQL) {
                        fs.writeFile("./"+configDirectoryName+"/" + filename + ".sql", textSQL, function (err) {
                            if (err) {
                                outData.SQLerror = "SQL file not saved! Reason:" + err.message;
                            } else {
                                outData.SQLsaved = "SQL file saved!";
                            }
                            if (err)outData.JSONerror = "JSON file not saved! Reason:" + err.message;
                            else outData.JSONsaved = "JSON file saved!";
                            outData.success = "Connected to server!";
                            res.send(outData);
                            return;
                        });
                    }else {
                        if (err)outData.JSONerror = "JSON file not saved! Reason:" + err.message;
                        else outData.JSONsaved = "JSON file saved!";
                        outData.success = "Connected to server!";
                        res.send(outData);
                    }
                });
            } else {
                if (textSQL) {
                    fs.writeFile("./"+configDirectoryName+"/" + filename + ".sql", textSQL, function (err) {
                        if (err) {
                            outData.SQLerror = "SQL file not saved! Reason:" + err.message;
                        } else {
                            outData.SQLsaved = "SQL file saved!";
                        }
                        outData.success = "Connected to server!";
                        res.send(outData);
                    });
                }else{
                    outData.success = "Connected to server 192!";
                    res.send(outData);
                }
            }//else end
        }
    });

app.get("/", function(req, res){                                                                     log.info("app.get /");
    res.sendFile(path.join(__dirname, '/views', 'main.html'));
});
app.post("/", function(req, res){                                                                   log.info("app.post /  req.body=",req.body);
    var outData={};
    if(req.body["action"] && req.body["action"]=="exit"){
        var cookiesArr=Object.keys(req.cookies);     console.log("cookiesArr=",cookiesArr);
        for(var i in cookiesArr){
            res.clearCookie(cookiesArr[i]);
        }
        outData.actionResult="successfull";
        res.send(outData);
        return;
    }
    outData.error="Не удалось завершить сессию.";
    res.send(outData);
});

app.get("/get_main_data", function(req, res){                                                        log.info("app.get /get_main_data");
    var outData = {};//main data
    var menuBar= [];//menu bar list
    outData.title= "REPORTS";
    outData.mode=app_params.mode;
    outData.modeName= app_params.mode.toUpperCase();

    if (ConfigurationError) {
        outData.error= ConfigurationError;                                                         log.error("req.ConfigurationError=",ConfigurationError);
    }
    menuBar.push({itemname:"menuBarItemRetailSales",itemtitle:"Отчеты retail", action:"open",content:"/reports/retail_sales", id:"ReportRetailSales",title:"Отчеты retail", closable:false});
    menuBar.push({itemname:"menuBarClose",itemtitle:"Выход",action:"close"});
    menuBar.push({itemname:"menuBarAbout",itemtitle:"О программе",action:"help_about"});
    outData.menuBar= menuBar;
    outData.autorun= [];
    outData.autorun.push({menuitem:"menuBarItemRetailSales", runaction:1});
    res.send(outData);
});

app.get("/reports/retail_sales", function(req, res){                                                             log.info("app.get /reports/retail_sales");
    res.sendFile(path.join(__dirname, '/views/reports', 'retail_sales.html'));
});

app.get("/reports/retail_sales/get_sales_by/*", function(req, res){                                              log.info("app.get /reports/retail_sales/get_sales_by ",req.url,req.query,req.params, new Date());
    var configDirectoryName=getConfigDirectoryName();
    var filename = req.params[0];
    var outData={};
    var fileContentString=fs.readFileSync('./'+configDirectoryName+'/'+filename+'.json', 'utf8');
    var pureJSONTxt=JSON.parse(getJSONWithoutComments(fileContentString));
    outData.columns=pureJSONTxt.columns;
    var bdate = req.query.BDATE, edate = req.query.EDATE;
    if (!bdate&&!edate) {
        res.send(outData);
        return;
    }
    database.getSalesBy(filename+".sql",bdate,edate,
        function (error,recordset) {
            if (error){                                                                                              log.error("database.getSalesBy " +filename +" error=",error);
                outData.error=error;
                res.send(outData);
                return;
            }
            outData.items=recordset;
            res.send(outData);
        });
});

app.get("/sysadmin/sql_queries/get_reports_list", function (req, res) {                                             log.info("app.get /sysadmin/sql_queries/get_reports_list");
    var outData={};
    var configDirectoryName=getConfigDirectoryName();
    outData.jsonText =fs.readFileSync('./'+configDirectoryName+'/reports_list.json').toString();
    outData.jsonFormattedText = getJSONWithoutComments(outData.jsonText);
    res.send(outData);
});

app.get("/print/printSimpleDocument", function(req, res){                                                           log.info("app.get /print/printSimpleDocument");
    res.sendFile(path.join(__dirname, '/views/print', 'printSimpleDocument.html'));
});
app.post("/sys/getExcelFile", function(req, res){
    try {
        var body = JSON.parse(req.body), columns=body.columns, rows=body.rows;
    }catch(e){
        res.sendStatus(500);                                                    log.error("Impossible to parse data! Reason:"+e);
        return;
    }
    if(!columns) {
        res.sendStatus(500);                                                    log.error("Error: No columns data to create excel file.");
        return;
    }
    if(!rows) {
        res.sendStatus(500);                                                    log.error("Error: No table data to create excel file.");
        return;
    }
    var uniqueFileName = getUIDNumber();
    var fname = path.join(tempExcelRepDir, uniqueFileName + '.xlsx');
    try {fs.writeFileSync(fname);
    } catch (e) {                                                               log.error("Impossible to write file! Reason:",e);
        res.sendStatus(500);
        return;
    }
    try {
        var wb = XLSX.readFileSync(fname);
    }catch(e){                                                                  log.error("Impossible to create workbook! Reason:",e);
        res.sendStatus(500);
        return;
    }
    wb.SheetNames = [];
    wb.SheetNames.push('Sheet1');

    fillTable(wb,columns,rows);

    XLSX.writeFileAsync(fname, wb, {bookType: "xlsx", /*cellStyles: true,*/ cellDates:true}, function(err){
        if (err) {
            res.sendStatus(500);                                                 log.error("send xls file err=", err);
            return;
        }
        var options = {headers: {'Content-Disposition': 'attachment; filename =out.xlsx'}};
        res.sendFile(fname, options, function (err) {
            if (err) {
                res.sendStatus(500);                                             log.error("send xls file err=", err);
            }
            fs.unlinkSync(fname);
        })
    });
});

function getJSONWithoutComments(text){
    var target = "/*";
    var pos = 0;
    while (true) {
        var foundPos = text.indexOf(target, pos);
        if (foundPos < 0)break;
        var comment = text.substring(foundPos, text.indexOf("*/", foundPos)+2);
        text=text.replace(comment,"");
        pos = foundPos + 1;
    }
    return text;
}

function getConfigDirectoryName(){
    var dirName=database.getDBConfig()["reports.config"]?"reportsConfig"+database.getDBConfig()["reports.config"]:"reportsConfig";
    return dirName;
};

function getUIDNumber(){
    var str= uid.time();
    var len = str.length;
    var num = BigNumber(0);
    for (var i = (len - 1); i >= 0; i--)
        num.plus(BigNumber(256).pow(i).mult(str.charCodeAt(i)));
    return num.toString();
};

function fillTable(wb,columns,rows){
    fillHeaders(wb,columns);
    var lineNum=1;
    for (var i in rows){
        fillRowData(wb,rows[i],columns,lineNum);
        lineNum++;
    }
}
function fillHeaders(wb,columns){
    var worksheetColumns = [];
    wb.Sheets['Sheet1'] = {
        '!cols': worksheetColumns
    };
    for (var j = 0; j < columns.length; j++) {
        worksheetColumns.push({wpx: columns[j].width});
        var currentHeader = XLSX.utils.encode_cell({c: j, r: 0});
        wb.Sheets['Sheet1'][currentHeader] = {t: "s", v: columns[j].name, s: {font: {bold: true}}};
    }
}

function fillRowData(wb,rowData,columns, lineNum){
    var lastCellInRaw;
    for (var i = 0; i < columns.length; i++) {
        var column=columns[i];
        var columnDataID = column.data;

        var cellType=getCellType(column);
        var displayValue =  rowData[columnDataID] || "";
        var currentCell = XLSX.utils.encode_cell({c: i, r: lineNum});

        lastCellInRaw=currentCell;
        wb.Sheets['Sheet1'][currentCell]={};
        var wbCell=wb.Sheets['Sheet1'][currentCell];
        wbCell.t=cellType;
        wbCell.v=displayValue;
        if(wbCell.t=="d"){
            wbCell.z=column.datetimeFormat || "DD.MM.YYYY";
        }
        if(wbCell.t=="n"){
            if(column.format.indexOf("0.00")>0 )wbCell.z= '#,###,##0.00';
            if(column.format.indexOf("0.[")>0 )wbCell.z= '#,###,##0';
        }
        wb.Sheets['Sheet1']['!ref']='A1:'+lastCellInRaw;
    }
}

function getCellType(columnData){
    if(!columnData.type) return's';
    if(columnData.type=="numeric") return'n';
    if(columnData.type=="text" && columnData.datetimeFormat) return'd';
    else return's';
}

app.listen(port, function (err) {
    if (err) {
        log.error(err);
        console.log(err);
        return;
    }
    console.log("app runs on port " + port, new Date().getTime() - startTime);
    log.info("app runs on port " + port);
});





