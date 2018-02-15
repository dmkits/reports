var fs = require('fs');
var path=require ('path');
var common=require('./common');
var database=require('./dataBase');


module.exports= function(app) {
    app.get("/sysadmin", function(req, res){
        res.sendFile(path.join(__dirname, '../pages', 'sysadmin.html'));
    });
    app.get("/sysadmin/app_state", function(req, res){
        var outData= {};
        outData.mode= app.mode;
        outData.port=app.port;
        outData.connUserName=database.getDBConfig().user;
        if (app.ConfigurationError) {
            outData.error= app.ConfigurationError;
            res.send(outData);
            return;
        }
        outData.configuration= database.getDBConfig();
        if (app.DBConnectError)
            outData.dbConnection= app.DBConnectError;
        else
            outData.dbConnection='Connected';
        res.send(outData);
    });
    app.get("/sysadmin/startup_parameters", function (req, res) {
        res.sendFile(path.join(__dirname, '../pages/sysadmin', 'startup_parameters.html'));
    });

    app.get("/sysadmin/employees_login", function (req, res) {
        res.sendFile(path.join(__dirname, '../pages/sysadmin', 'employees_login.html'));
    });
    app.get("/sysadmin/startup_parameters/get_app_config", function (req, res) {
        if (app.ConfigurationError) {
            res.send({error:app.ConfigurationError});
            return;
        }
        var outData={};
        outData=database.getDBConfig();
        res.send(outData);
    });
    app.get("/sysadmin/startup_parameters/load_app_config", function (req, res) {
        common.tryLoadConfiguration(app);
        if (app.ConfigurationError) {
            res.send({error:app.ConfigurationError});
            return;
        }
        var outData={};
        outData=database.getDBConfig();
        res.send(outData);
    });
    app.post("/sysadmin/startup_parameters/store_app_config_and_reconnect", function (req, res) {
        var newDBConfigString = req.body;
        database.setDBConfig(newDBConfigString);
        var outData = {};
        database.saveConfig(
            function (err) {
                if (err) outData.error = err;
                common.tryDBConnect(app,function (err) {
                    if (err) outData.DBConnectError = err;
                    res.send(outData);
                });
            }
        );
    });
    app.get("/sysadmin/reports_config", function (req, res) {
        res.sendFile(path.join(__dirname, '../pages/sysadmin', 'sql_queries.html'));
    });
    app.get("/sysadmin/sql_queries/get_reports_list", function (req, res) {
        var outData={};
        var configDirectoryName=common.getConfigDirectoryName();
        outData.jsonText =fs.readFileSync('./'+configDirectoryName+'/reports_list.json').toString();
        outData.jsonFormattedText = common.getJSONWithoutComments(outData.jsonText);
        res.send(outData);
    });
    app.get("/sysadmin/sql_queries/get_script", function (req, res) {
        var configDirectoryName=common.getConfigDirectoryName();
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
    app.post("/sysadmin/sql_queries/get_result_to_request", function (req, res) {
        var newQuery = req.body;
        var sUnitlist = req.query.stocksList;
        var bdate = req.query.bdate;
        var edate = req.query.edate;
        database.getQueryResult(newQuery, req.query,
            function (err,result) {
                var outData = {};
                if (err) {
                    outData.error = err.message;
                    res.send(outData);
                    return;
                }
                outData.result = result;
                res.send(outData);
            }
        );
    });
    app.post("/sysadmin/sql_queries/save_sql_file", function (req, res) {
        var configDirectoryName  = common.getConfigDirectoryName();

        var newQuery = req.body;
        var filename = req.query.filename;
        var outData = {};
        var textSQL = newQuery.textSQL;
        var textJSON = newQuery.textJSON;

        var formattedJSONText=common.getJSONWithoutComments(textJSON);
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
            }
        }
    });
    var employeeLoginColumns=[
        {data: "ChID", name: "ChID", width: 120, type: "text", visible:false},
        {data: "EmpName", name: "Имя сотрудника", width: 250, type: "text"},
        {data: "Login", name: "Login", width: 120, type: "text", align:"center"},
        {data: "LPass", name: "Password", width: 120, type: "text"}
    ];
    app.get('/sysadmin/employeeLoginTable/getDataForTable', function (req, res) {
        database.getDataForTable({source:"r_Emps",
                tableColumns:employeeLoginColumns, identifier:employeeLoginColumns[0].data, conditions:req.query} ,
            function(result){
                res.send(result);
            });
    });
    app.post("/sysadmin/employeeLoginTable/storeBotMsgTableData", function(req, res){
        database.storeTableDataItem({tableName:"r_Emps",idFieldName:"ChID",tableColumns:employeeLoginColumns,
            storeTableData:req.body}, function(result){
            res.send(result);
        })
    });
};