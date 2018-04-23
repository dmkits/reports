var fs = require('fs'), path=require ('path');

var common=require('./common');
var database=require('./databaseMSSQL');
var logger=require('./logger')();

module.exports= function(app) {
    app.get("/sysadmin", function(req, res){
        res.sendFile(path.join(__dirname, '../pages', 'sysadmin.html'));
    });
    app.get("/sysadmin/app_state", function(req, res){
        var outData= {};
        outData.mode= app.mode;
        outData.port=app.port;
        outData.loginEmpName=req.loginEmpName;
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

    app.get("/sysadmin/startup_parameters/get_app_config", function (req, res) {
        if (app.ConfigurationError) {
            res.send({error:app.ConfigurationError});
            return;
        }
        var appConfig=database.getDBConfig();
        if(!appConfig["reports.config"])appConfig["reports.config"]=common.getConfigDirectoryName();
        database.selectMSSQLQuery("select	name "+
        "from	sys.databases "+
        "where	name not in ('master','tempdb','model','msdb') "+
        "and is_distributor = 0 "+
        "and source_database_id is null", function(err,recordset){
            if(err){
                res.send({error:err.message});
                return;
            }
            console.log('recordset 45=', recordset);
            appConfig.dbList=recordset;
            res.send(appConfig);
        });

    });
    app.get("/sysadmin/startup_parameters/load_app_config", function (req, res) {
        common.tryLoadConfiguration(app);
        if (app.ConfigurationError) {
            res.send({error:app.ConfigurationError});
            return;
        }
        var appConfig=database.getDBConfig();
        if(!appConfig["reports.config"])appConfig["reports.config"]=common.getConfigDirectoryName();
        res.send(appConfig);
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
    app.get("/sysadmin/pages_config", function (req, res) {
        res.sendFile(path.join(__dirname, '../pages/sysadmin', 'sql_queries.html'));
    });
    //app.post("/sysadmin/create_new_db", function (req, res) {
    //    var host=req.body.host;
    //    var newDBName=req.body.newDatabase;
    //    var newUserName=req.body.newUser;
    //    var newUserPassword=req.body.newPassword;
    //
    //    var connParams={
    //        server: host,
    //        user: req.body.adminName,
    //        password: req.body.adminPassword
    //    };
    //    var outData={};
    //
    //    database.mySQLAdminConnection(connParams,function(err){
    //        if (err) {                                                                                      logger.error("mySQLAdminConnection err=", err);
    //            outData.error=err.message;
    //            res.send(outData);
    //            return;
    //        }
    //        database.checkIfDBExists(newDBName, function(err, result){
    //            if (err) {                                                                                  logger.error("checkIfDBExists err=", err);
    //                outData.error=err.message;
    //                res.send(outData);
    //                return;
    //            }if(result.length>0){
    //                outData.error="Impossible to create DB! Database "+newDBName+" is already exists!";
    //                res.send(outData);
    //                return;
    //            }
    //            database.createNewDB(newDBName,function(err, ok){
    //                if(err){                                                                                logger.error("createNewDB err=", err);
    //                    outData.error=err.message;
    //                    res.send(outData);
    //                    return;
    //                }
    //                outData.DBCreated=ok;
    //                database.checkIfUserExists(newUserName,function(err,result){
    //                    if(err){                                                                            logger.error("checkIfUserExists err=", err);
    //                        outData.error=err.message;
    //                        res.send(outData);
    //                        return;
    //                    }
    //                    if(result.length>0){
    //                        outData.userExists="User "+newUserName+" is already exists!";
    //                        database.grantUserAccess(host,newUserName,newDBName, function(err, ok){
    //                            if(err){                                                                    logger.error("createNewUser err=", err);
    //                                outData.error=err.message;
    //                                res.send(outData);
    //                                return;
    //                            }
    //                            outData.accessAdded=ok;
    //                            res.send(outData);
    //                        })
    //                    }else{
    //                        database.createNewUser(host,newUserName,newUserPassword, function(err, ok){
    //                            if(err){                                                                    logger.error("createNewUser err=", err);
    //                                outData.error=err.message;
    //                                res.send(outData);
    //                                return;
    //                            }
    //                            outData.userCreated=ok;
    //                            database.grantUserAccess(host,newUserName,newDBName, function(err, ok){
    //                                if(err){                                                                logger.error("createNewUser err=", err);
    //                                    outData.error=err.message;
    //                                    res.send(outData);
    //                                    return;
    //                                }
    //                                outData.accessAdded=ok;
    //                                res.send(outData);
    //                            })
    //                        });
    //                    }
    //                });
    //            });
    //        });
    //    });
    //});



    app.get("/sysadmin/sql_queries/get_reports_list", function (req, res) {
        var outData={};
        var configDirectoryName=common.getConfigDirectoryName();
        try{
            var fileContent=fs.readFileSync(path.join(__dirname,'../'+configDirectoryName+'/pagesConfig.json'),'utf8');
            var pagesConfig=JSON.parse(common.getJSONWithoutComments(fileContent));
        }catch(e){
            logger.error("Failed to get reports list file. Reason:"+e);
            outData.error= "Failed to get reports list file. Reason:"+e;
            res.send(outData);
            return;
        }
        var items=[];
        var pages=pagesConfig.pages;
        for(var i in pages ){
            var page=pages[i];
            var buttons=page.buttons;
            for(var j in buttons){
                var button=buttons[j];
                if(!button.id) continue;
                items.push({id:page.id+"."+button.id});
            }
        }
        outData.fileContent=fileContent;
        outData.items=items;
        res.send(outData);
    });
    app.get("/sysadmin/sql_queries/get_script", function (req, res) {
        var configDirectoryName=common.getConfigDirectoryName();
        var outData={};
        var filename=req.query.filename.replace(".","/");
        var sqlFile = path.join(__dirname,'../'+configDirectoryName+'/' + filename + ".sql");
        var jsonFile=path.join(__dirname,'../'+configDirectoryName+'/' + filename + ".json");
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
        var newQuery = req.body.text;
        database.selectParamsMSSQLQuery(newQuery, req.query,
        function(err,result){
            var outData = {};
            if (err) {
                outData.error = err.message;
                res.send(outData);
                return;
            }
            outData.result = result;
            res.send(outData);
        });
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

    app.get("/sysadmin/employees_login", function (req, res) {
        res.sendFile(path.join(__dirname, '../pages/sysadmin', 'employees_login.html'));
    });

    var employeeLoginColumns=[
        {data: "ChID", name: "ChID", width: 120, type: "text", visible:false},
        {data: "EmpName", name: "Имя сотрудника", width: 250, type: "text"},
        {data: "Login", name: "Login", width: 120, type: "text", align:"center"},
        {data: "LPass", name: "Password", width: 120, type: "text"},
        {data: "ShiftPostID", name: "ShiftPostID", width: 120, type: "text", visible:false},
        {data: "ShiftPostName", name: "Роль", width: 120,
            dataSource:"r_Uni", sourceField:"RefName", linkCondition:"r_Uni.RefTypeID=10606 and r_Uni.RefID=r_Emps.ShiftPostID",
            type: "combobox", sourceURL:"/sysadmin/employeeLoginTable/getDataForRoleCombobox"}
    ];
    app.get('/sysadmin/employeeLoginTable/getDataForTable', function (req, res) {
        res.connection.setTimeout(0);
        var conditions=req.query;
        conditions["1=1"]=null;
        database.getDataForTable({source:"r_Emps",
                tableColumns:employeeLoginColumns, identifier:employeeLoginColumns[0].data, conditions:conditions, order:"EmpID"} ,
            function(result){
                res.send(result);
            });
    });
    app.post("/sysadmin/employeeLoginTable/storeTableData", function(req, res){
        res.connection.setTimeout(0);
        database.storeTableDataItem({tableName:"r_Emps",idFieldName:"ChID",tableColumns:employeeLoginColumns,
            storeTableData:req.body}, function(result){
            res.send(result);
        })
    });
    app.get('/sysadmin/employeeLoginTable/getDataForRoleCombobox', function(req,res){  //ShiftPostID
        database.getDataItemsForTableCombobox({ comboboxFields:{"ShiftPostName":"RefName","ShiftPostID":"RefID" },
                source:"r_Uni",fields:["RefID","RefName"],
                order:"RefName",
            conditions:{"RefTypeID=":10606}},
        function(result){
            res.send(result);
        })
    })
};