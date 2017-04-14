function startupMode(){
    var app_params = process.argv.slice(2);
    if(app_params.length===0) return 'production';
    return app_params[0];
}

module.exports.startupMode = startupMode;

var fs = require('fs');
var express = require('express');
var app = express();
var port=8181;
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
app.get("/admin", function(req, res){
    res.sendFile(path.join(__dirname, '/views', 'sysadmin.html'));
});
app.get("/sysadmin/app_state", function(req, res){
    var outData= {};
    outData.mode= startupMode();
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
  res.send(fs.readFileSync('./scripts/'+req.query.filename, 'utf8'));
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
    fs.writeFile("./scripts/"+filename, newQuery.text, function (err) {
        var outData = {};
        if(err)outData.error=err.message;
         outData.success="Файл сохранен!";
        res.send(outData);
    });
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
    var bdate = req.query.BDATE;       //console.log("req.query=",req.query);
    var edate = req.query.EDATE;
    database.getSalesBy("sales_by_dates.sql",bdate,edate,
        function (error,recordset) {
            if (error){
                res.send({error:""});
                return;
            }
            var outData =getHandsonJSON(recordset);
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
            var outData =getHandsonJSON(recordset);
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
            var outData =getHandsonJSON(recordset);    console.log("outData=",outData);
            res.send(outData);
        });
});

function getHandsonJSON(recordset){
    //   var outData = {};
    //   outData.columns = [];
    //   outData.columns.push({data:"DOCDATE", name:"Doc Date", width:120, type:"text", dateFormat:"DD.MM.YYYY"});//type:date
    //   outData.columns.push({data:"PRODNAME", name:"Prod Name", width:300});//type:text, html:true
    //   outData.columns.push({data:"PRICE", name:"Prod Price", width:80, type:"numeric", format:"0.[0000]"});//format:"0.00[0000] language:'ru'
    //   outData.items = [];

    //   outData.items.push({"CHID":"1", "DOCDATE":"2017-01-01", "PRODNAME":"PRODNAME1", "PRICE":"123.3456"});
    //   outData.items.push({"CHID":"2", "DOCDATE":"2017-01-02", "PRODNAME":"PRODNAME2", "PRICE":"0.123456"});
    //   outData.items.push({"CHID":"3", "DOCDATE":"2017-01-03", "PRODNAME":"PRODNAME4", "PRICE":"98765"});
    //   //outData.identifier = "CHID";

    var outData = {};
    outData.items = recordset;
    outData.columns = [];
    var columnsMetedata = recordset.columns;
    for (var i in columnsMetedata){
        var jsonColumn={};
        var metaDataElement=columnsMetedata[i];
        jsonColumn.data=metaDataElement.name;
        jsonColumn.name=metaDataElement.name;

        if(metaDataElement.type.toString().indexOf("Numeric")>-1) {
            jsonColumn.type = "numeric";
            jsonColumn.language="ru";
            if (metaDataElement.name.toString().indexOf("Price") >-1) {
                jsonColumn.format = "0.00[0000]";
                jsonColumn.width = "80";
            }
            else if (metaDataElement.name.toString().indexOf("Sum") >-1) {
                jsonColumn.format = "0.00[0000]";
                jsonColumn.width = "120";
            }
            else if (metaDataElement.name.toString().indexOf("Qty") >-1) jsonColumn.width = "80";
        }

        else if(metaDataElement.type.toString().indexOf("VarChar")>-1) {
            jsonColumn.type = "text";
            if (metaDataElement.name.toString().indexOf("Name") >-1) jsonColumn.width="350";
        }
        else if(metaDataElement.type.toString().indexOf("Date")>-1 ){
            jsonColumn.type = "text";
            jsonColumn.dateFormat="DD.MM.YYYY";
        }
        outData.columns.push(jsonColumn);
    }
    return outData;
}

app.listen(port, function (err) {
});




