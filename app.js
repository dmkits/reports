
function startupParams(){
    var app_params = {};
    if(process.argv.length==0) {
        app_params.mode='production';
        app_params.port=8080;
        return app_params;
    }
    for(var i=2;i<process.argv.length;i++){
        if(process.argv[i].indexOf('-p:')==0){
            var port=process.argv[i].replace("-p:","");
            if(port>0 && port<65536){
                app_params.port=port;
            }
        }else if(process.argv[i].charAt(0).toUpperCase()>'A'&&process.argv[i].charAt(0).toUpperCase()<'Z'){
            app_params.mode = process.argv[i];
        }
    }
    if(!app_params.port)app_params.port=8080;
    if(!app_params.mode)app_params.mode = 'production';
  return app_params;
}

var app_params=startupParams();

module.exports.startupMode = app_params.mode;

var fs = require('fs');
var express = require('express');
var app = express();
var port=app_params.port;                                         console.log("port=",port);
var path=require ('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.text());
app.use('/',express.static('public'));
var database = require('./dataBase');
var ConfigurationError, DBConnectError;

tryLoadConfiguration();
function tryLoadConfiguration(){
    try {
        database.loadConfig();
        ConfigurationError=null;
    } catch (e) {
        ConfigurationError= "Failed to load configuration! Reason:"+e;
    }
}
 if (!ConfigurationError) tryDBConnect();
function tryDBConnect(postaction) {                                          console.log('tryDBConnect...');//test
    database.databaseConnection(function (err) {
        DBConnectError = null;
        if (err) {
            DBConnectError = "Failed to connect to database! Reason:" + err;
        }
        if (postaction)postaction(err);                                      console.log('tryDBConnect DBConnectError=',DBConnectError);//test
    });
}
app.get("/sysadmin", function(req, res){
    res.sendFile(path.join(__dirname, '/views', 'sysadmin.html'));
});
app.get("/sysadmin/app_state", function(req, res){
    var outData= {};
    outData.mode= app_params.mode;
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
app.get("/sysadmin/startup_parameters", function (req, res) {
    res.sendFile(path.join(__dirname, '/views/sysadmin', 'startup_parameters.html'));
});
app.get("/sysadmin/startup_parameters/get_app_config", function (req, res) {
    if (ConfigurationError) {
        res.send({error:ConfigurationError});
        return;
    }
    res.send(database.getDBConfig());
});
app.get("/sysadmin/startup_parameters/load_app_config", function (req, res) {
    tryLoadConfiguration();
    if (ConfigurationError) {
        res.send({error:ConfigurationError});
        return;
    }
    res.send(database.getDBConfig());
});
app.post("/sysadmin/startup_parameters/store_app_config_and_reconnect", function (req, res) {
    var newDBConfigString = req.body;
    database.setDBConfig(newDBConfigString);
    database.saveConfig(
        function (err) {
            var outData = {};
            if (err) outData.error = err;
            tryDBConnect(/*postaction*/function (err) {
                if (DBConnectError) outData.DBConnectError = DBConnectError;
                res.send(outData);
            });
        }
    );
});
app.get("/sysadmin/sql_queries", function (req, res) {
    res.sendFile(path.join(__dirname, '/views/sysadmin', 'sql_queries.html'));
});
app.get("/sysadmin/sql_queries/get_script", function (req, res) {
    var outData={};
    outData.sqlText=fs.readFileSync('./scripts/'+req.query.filename+".sql", 'utf8');
    outData.jsonText= fs.readFileSync('./scripts/'+req.query.filename+".json").toString();
  res.send(outData);
});
app.post("/sysadmin/sql_queries/get_result_to_request", function (req, res) {
   var newQuery = req.body;
    var sUnitlist = req.query.stocksList;
    var bdate = req.query.bdate;
    var edate = req.query.edate;
    database.getResultToNewQuery(newQuery, req.query,
        function (err,result) {
           var outData = {};
            if (err) outData.error = err.message;
            outData.result = result;
            res.send(outData);
        }
    );
});
app.post("/sysadmin/sql_queries/save_sql_file", function (req, res) {
    var newQuery = req.body;
    var filename= req.query.filename;
    var outData = {};
    fs.writeFile("./scripts/"+filename+".sql", newQuery.textSQL, function (err) {
        if(err)outData.error=err.message;
    });
    fs.writeFile("./scripts/"+filename+".json", newQuery.textJSON, function (err) {
        if(err)outData.error=err.message;
    });
    outData.success="Файл сохранен!";
    res.send(outData);
});

app.get("/", function(req, res){
    res.sendFile(path.join(__dirname, '/views', 'main.html'));
});
app.get("/get_main_data", function(req, res){
    var outData = {};//main data
    var menuBar= [];//menu bar list
    outData.title= "REPORTS";
    outData.mode= "test";
    outData.modeName= "TEST";
    outData.user= "user";

    if (ConfigurationError) {
        outData.error= ConfigurationError;                                                  console.log("req.ConfigurationError=",ConfigurationError);
        //res.send(outData);
        //return;
    }

    menuBar.push({itemname:"menuBarItemRetailSales",itemtitle:"Retail sales", action:"open",content:"/reports/retail_sales", id:"ReportRetailSales",title:"Retail sales", closable:false});
    menuBar.push({itemname:"menuBarClose",itemtitle:"Exit",action:"close"});
    menuBar.push({itemname:"menuBarAbout",itemtitle:"About",action:"help_about"});
    outData.menuBar= menuBar;
    outData.autorun= [];
    outData.autorun.push({menuitem:"menuBarItemRetailSales", runaction:1});
    res.send(outData);
});
app.get("/reports/retail_sales", function(req, res){
    res.sendFile(path.join(__dirname, '/views/reports', 'retail_sales.html'));
});

app.get("/reports/retail_sales/get_sales_by_days", function(req, res){
    var bdate = req.query.BDATE;
    var edate = req.query.EDATE;
    database.getSalesBy("sales_by_dates.sql",bdate,edate,
        function (error,recordset) {
            if (error){
                res.send({error:""});
                return;
            }
            var outData={};
            outData.items=recordset;
            outData.columns=JSON.parse(fs.readFileSync('./scripts/sales_by_dates.json', 'utf8'));
           res.send(outData);
        });
});
app.get("/reports/retail_sales/get_sales_by_prods", function(req, res){
    var bdate = req.query.BDATE;
    var edate = req.query.EDATE;
    database.getSalesBy("sales_by_prods.sql",bdate,edate,
        function (error,recordset) {
            if (error){
                res.send({error:""});
                return;
            }
            var outData={};
            outData.items=recordset;
            outData.columns=JSON.parse(fs.readFileSync('./scripts/sales_by_prods.json', 'utf8'));
            res.send(outData);
        });
});
app.get("/reports/retail_sales/get_sales_by_pcats", function(req, res){
    var bdate = req.query.BDATE;
    var edate = req.query.EDATE;
    database.getSalesBy("sales_by_pcats.sql",bdate,edate,
        function (error,recordset) {
            if (error){
                res.send({error:""});
                return;
            }
            var outData={};
            outData.items=recordset;
            outData.columns=[];
            outData.columns=JSON.parse(fs.readFileSync('./scripts/sales_by_pcats.json', 'utf8'));
            res.send(outData);
        });
});
app.listen(port, function (err) {
});




