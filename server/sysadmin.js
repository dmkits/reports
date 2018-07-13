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
    app.get("/sysadmin/startupParameters", function (req, res) {
        res.sendFile(path.join(__dirname, '../pages/sysadmin', 'startupParameters.html'));
    });

    app.get("/sysadmin/startupParameters/get_app_config", function (req, res) {
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
            "and source_database_id is null",
            function(err,recordset){
                if(err){
                    res.send({error:err.message});
                    return;
                }
                console.log('recordset 45=', recordset);
                appConfig.dbList=recordset;
                res.send(appConfig);
            });

    });
    app.get("/sysadmin/startupParameters/loadAppConfig", function (req, res) {
        common.tryLoadConfiguration(app);
        if (app.ConfigurationError) {
            res.send({error:app.ConfigurationError});
            return;
        }
        var appConfig=database.getDBConfig();
        if(!appConfig["reports.config"])appConfig["reports.config"]=common.getConfigDirectoryName();
        res.send(appConfig);
    });
    app.post("/sysadmin/startupParameters/store_app_config_and_reconnect", function (req, res) {
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
    app.get("/sysadmin/repsPagesConfig", function (req, res) {
        res.sendFile(path.join(__dirname, '../pages/sysadmin', 'repsPagesConfig.html'));
    });

    var checkIfDirExists= function(dirPath,callback){
        fs.exists(dirPath, function (exists) {
            if(!exists){
                fs.mkdir(dirPath,function(err){
                    callback(err);
                });
                return;
            }
            callback();
        });
    };
    var checkIfFileExists= function(filePath,callback){
        fs.exists(filePath, function (exists) {
            if(!exists){
                var configFile='{\n'+
                    '   "pages":[\n'+
                    '       { "id":"page1", "title":"page1 title", "type":"simpleReport",\n'+
                    '           "buttons":[\n'+
                    '               { "id": "report1",    "name": "name report1" },\n'+
                    '               { "id": "report2",    "name": "name report2" }\n'+
                    '           ]\n'+
                    '       }\n'+
                    '   ], \n'+
                    '   "rolesCodes":{\n'+
                    '       "0":{"page1":true},\n'+
                    '       "1":{"page1":true},\n'+
                    '       "2":{"page1":true},\n'+
                    '       "sysadmin":[/*all reports are avaliable. Autorun - first page in pages*/]\n'+
                    '   }\n'+
                    '}\n';
                fs.writeFile(filePath, configFile, function (err, data) {
                    callback(err);
                });
                return
            }
            callback();
        });
    };
    app.get("/sysadmin/repsPagesConfig/getReportsConfig", function (req, res) {
        var outData={}, configDirectoryName=common.getConfigDirectoryName();
        checkIfDirExists(path.join(__dirname,'../'+configDirectoryName),function(err){
            if(err){
                logger.error("Failed to get reports list file. Reason:",err);
                outData.error= "Failed to get reports list file. Reason:"+err;
                res.send(outData);
                return;
            }
            var configFilePath=path.join(__dirname,'../'+configDirectoryName+'/pagesConfig.json');
            checkIfFileExists(configFilePath,function(err){
                if(err){
                    logger.error("Failed to get reports list file. Reason:",err);
                    outData.error= "Failed to get reports list file. Reason:"+err;
                    res.send(outData);
                    return;
                }
                try{
                    var fileContent=fs.readFileSync(configFilePath,'utf8');
                    var pagesConfig=JSON.parse(common.getJSONWithoutComments(fileContent));
                }catch(e){
                    logger.error("Failed to get reports list file. Reason:",e);
                    outData.error= "Failed to get reports list file. Reason:"+e;
                    res.send(outData);
                    return;
                }
                var items=[], pages=pagesConfig.pages;
                for(var i in pages ){
                    var page=pages[i], buttons=page.buttons;
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
        });

    });
    var sqlFileTemplate="   select number=1, docdate=convert(datetime,'20180101'), name='name1', qty=123.456, sum1=234567.89 where convert(datetime,'20180101') between @BDATE and @EDATE \n"+
        "union select number=2, docdate=convert(datetime,'20180131'), name='name 2', qty=0.456, sum1=1223456789.00 where convert(datetime,'20180101')<@BDATE \n"+
        "union select number=3, docdate=convert(datetime,'20180301'), name='name 3', qty=9876.0, sum1=0.89 where convert(datetime,'20180101')>@EDATE \n";
    var confFileTemplate='{\n'+
        '   "headers":[\n'+
        '       {"type":"dateBox", "label":"c", "params":{"contentTableCondition":"BDATE", "initValueDate":"curMonthBDate"}},\n'+
        '       {"type":"dateBox", "label":"по", "params":{"contentTableCondition":"EDATE"}},\n'+
        '       {"type":"selectBox","label":"Склад:", "params":{"contentTableCondition":"StockID","valueItemName":"StockID", "labelItemName":"StockName", "loadDropDownURL":"/reports/getStocks"}}\n'+
        '   ],\n'+
        '   "columns":[\n'+
        '       { "data": "number", "name": "Number", "type": "numeric", "language": "ru-RU", "width": 55, "format":"#,###,###,##0", "align":"center" },\n'+
        '       { "data":"docdate", "name":"Doc Date", "width":70, "type":"text", "datetimeFormat":"DD.MM.YYYY", "align":"center" },\n'+
        '       { "data": "name", "name": "Name", "type": "text", "width": 200 },\n'+
        '       { "data":"qty", "name":"Qty", "width":70, "type":"numeric", "language":"ru-RU", "format":"#,###,###,##0.0[########]", "align":"center" },\n'+
        '       { "data":"sum1", "name":"SUM1", "width":95, "type":"numeric", "language":"ru-RU", "format":"#,###,###,##0.00[#######]", "align":"right" }\n'+
        '   ],\n'+
        '   "totals":[\n'+
        '       {"type":"rowCount", "label":"ИТОГО строк:"},\n'+
        '       {"type":"sum", "label":"TOTAL Qty:", "width":900, "dataField":"qty", "format":"#,###,###,##0.#########", "inputWidth":70 },\n'+
        '       {"type":"sum", "label":"TOTAL Sum1:", "width":245, "dataField":"sum1", "format":"#,###,###,##0.00#######", "inputWidth":90 }\n'+
        '   ]\n'+
        '}\n';
    app.get("/sysadmin/repsPagesConfig/getReportConfig", function (req, res) {
        var configDirectoryName=common.getConfigDirectoryName();
        var outData={}, reportName=req.query.filename,
            pageDir= path.join(__dirname,'../'+configDirectoryName+'/'+reportName.slice(0,reportName.indexOf("."))),
            sqlFile= path.join(__dirname,'../'+configDirectoryName+'/' + reportName.replace(".","/") + ".sql"),
            jsonFile= path.join(__dirname,'../'+configDirectoryName+'/' + reportName.replace(".","/") + ".json");
        checkIfDirExists(pageDir,function(err){
            if(err){
                logger.error("Failed to get report config. Reason:",err);
                outData.error= "Failed to get report config. Reason:"+err;
                res.send(outData);
                return;
            }
            if(fs.existsSync(sqlFile)){
                outData.sqlText = fs.readFileSync(sqlFile,'utf8');
            }else{
                fs.writeFileSync(sqlFile,sqlFileTemplate);
                outData.sqlText=sqlFileTemplate;
            }
            if(fs.existsSync(jsonFile)){
                outData.jsonText = fs.readFileSync(jsonFile).toString();
            }else{
                fs.writeFileSync(jsonFile,confFileTemplate);
                outData.jsonText=confFileTemplate;
            }
            res.send(outData);
        });
    });
    app.post("/sysadmin/repsPagesConfig/saveReportConfig", function (req, res) {
        var configDirectoryName  = common.getConfigDirectoryName(),
            newQuery = req.body, reportName = req.query.filename,
            outData = {}, textSQL = newQuery.textSQL, textJSON = newQuery.textJSON,
            formattedJSONText=common.getJSONWithoutComments(textJSON);
        if (textJSON) {
            var JSONparseERROR;
            try {
                JSON.parse(formattedJSONText);
            } catch (e) {
                outData.JSONerror = "JSON file not saved! Reason:" + e.message;
                JSONparseERROR = e;
            }
            if (JSONparseERROR) {
                if (textSQL) {
                    fs.writeFile("./"+configDirectoryName+"/" + reportName.replace(".","/") + ".sql", textSQL, function (err) {
                        if (err) {
                            outData.SQLerror = "SQL file not saved! Reason:" + err.message;
                        } else {
                            outData.SQLsaved = "SQL file saved!";
                        }
                        outData.success = "Connected to server!";
                        res.send(outData);
                    });
                }else{
                    outData.success = "Connected to server!";
                    res.send(outData);
                }
                return;
            }
            fs.writeFile("./"+configDirectoryName+"/" + reportName.replace(".","/") + ".json", textJSON, function (err) {
                if(textSQL){
                    fs.writeFile("./"+configDirectoryName+"/" + reportName.replace(".","/") + ".sql", textSQL, function (err) {
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
                }else{
                    if (err)outData.JSONerror = "JSON file not saved! Reason:" + err.message;
                    else outData.JSONsaved = "JSON file saved!";
                    outData.success = "Connected to server!";
                    res.send(outData);
                }
            });
        }
    });
    app.post("/sysadmin/repsPagesConfig/get_result_to_request", function (req, res) {
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

    app.get("/sysadmin/employeesLogin", function (req, res) {
        res.sendFile(path.join(__dirname, '../pages/sysadmin', 'employeesLogin.html'));
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