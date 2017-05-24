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

var fs = require('fs');                             console.log("module  fs",new Date().getTime() - startTime);
var express = require('express');                   console.log("module  express",new Date().getTime() - startTime);
var app = express();
var port=app_params.port;
var path=require ('path');                          console.log("module  path",new Date().getTime() - startTime);
var bodyParser = require('body-parser');            console.log("module body-parser",new Date().getTime() - startTime);
//var cookieParser = require('cookie-parser');        console.log("module");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.text());
app.use('/',express.static('public'));
var database = require('./dataBase');               console.log("module ./dataBase",new Date().getTime() - startTime);
var ConfigurationError, DBConnectError;

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
function tryDBConnect(postaction) {                                        console.log('tryDBConnect...', new Date().getTime() - startTime);    //console.log('tryDBConnect...');//test
    database.databaseConnection(function (err) {
        DBConnectError = null;
        if (err) {
            DBConnectError = "Failed to connect to database! Reason:" + err;            console.log('DBConnectError=', DBConnectError);
        }
        if (postaction)postaction(err);                                                  console.log('tryDBConnect DBConnectError=',DBConnectError);
    });
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
    var outData={};
    var sqlFile = './reportsConfig/' + req.query.filename + ".sql";
    var jsonFile='./reportsConfig/' + req.query.filename + ".json";
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

app.post("/sysadmin/sql_queries/get_result_to_request", function (req, res) {                 log.info("app.post /sysadmin/sql_queries/get_result_to_request");
   var newQuery = req.body;
    var sUnitlist = req.query.stocksList;
    var bdate = req.query.bdate;
    var edate = req.query.edate;
    database.getResultToNewQuery(newQuery, req.query,
        function (err,result) {
           var outData = {};
            if (err) {
                outData.error = err.message;                                             log.error("database.getResultToNewQuery err =",err);
            }
            outData.result = result;
            res.send(outData);
        }
    );
});
app.post("/sysadmin/sql_queries/save_sql_file", function (req, res) {                         log.info("app.post /sysadmin/sql_queries/save_sql_file");
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
                fs.writeFile("./reportsConfig/" + filename + ".json", textJSON, function (err) {
                    if (textSQL) {
                        fs.writeFile("./reportsConfig/" + filename + ".sql", textSQL, function (err) {
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
                    fs.writeFile("./reportsConfig/" + filename + ".sql", textSQL, function (err) {
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

app.get("/reports/retail_sales/get_sales_by/*", function(req, res){                                              log.info("app.get app.get /reports/retail_sales/get_sales_by ",req.url,req.query,req.params, new Date());
    var filename = req.params[0];
    var outData={};
    var fileContentString=fs.readFileSync('./reportsConfig/'+filename+'.json', 'utf8');
    outData.columns=JSON.parse(getJSONWithoutComments(fileContentString));
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
    outData.jsonText =fs.readFileSync('./reportsConfig/reports_list.json').toString();
    outData.jsonFormattedText = getJSONWithoutComments(outData.jsonText);
    res.send(outData);
});

app.get("/print/printSimpleDocument", function(req, res){                                                           log.info("app.get /print/printSimpleDocument");
    res.sendFile(path.join(__dirname, '/views/print', 'printSimpleDocument.html'));
});

app.listen(port, function (err) {
    if(err) log.error(err);
    console.log("app runs on port "+ port,new Date().getTime() - startTime  );
    log.info("app runs on port "+ port);
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



