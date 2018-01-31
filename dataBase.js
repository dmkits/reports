
var fs = require('fs');       console.log('module for dataBase.js  fs');
var sql = require('mssql');   console.log('module for dataBase.js mssql');
var app = require('./app');   console.log('module for dataBase.js ./app');
var uid = require('uniqid');
var BigNumber = require('big-number');

var dbConfig;
var dbConfigFilePath;
var conn=null;
var dbConnectError=null;

module.exports.setDBConfig=function(newDBConfig){
    dbConfig= newDBConfig;
};
module.exports.loadConfig=function(){
    dbConfigFilePath='./' + app.startupMode + '.cfg';
    var stringConfig = fs.readFileSync(dbConfigFilePath);
    dbConfig = JSON.parse(stringConfig);
};
module.exports.getDBConfig=function(){
    return dbConfig;
};
module.exports.saveConfig=function(callback) {
    fs.writeFile(dbConfigFilePath, JSON.stringify(dbConfig), function (err, success) {
        callback(err,success);
    })
};
module.exports.databaseConnection=function(callback){
    if(conn) conn.close();
    dbConnectError = null;
    conn = new sql.Connection(dbConfig);
    conn.connect(function (err) {
        if (err) {
            callback(err.message);
            dbConnectError = "Failed to connect to database! Reason:" + err;
            return;
        }
        callback(null,conn);
    });
};

module.exports.getDBConnectError= function(){
        return dbConnectError;
    };

module.exports.getQueryResult=function(newQuery, parameters, callback){
    checkDBConnection(0,function(err){
        if(err){
            callback(err);
            return;
        }
        var reqSql = new sql.Request(conn);
        var newQueryString=newQuery.text;

        for(var paramName in parameters) reqSql.input(paramName, deleteSpaces(parameters[paramName]));

        reqSql.query(newQueryString,
            function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    callback(null,result);
                }
            })
    });
};

module.exports.getSalesBy=function(filename, bdate,edate, callback ){
    checkDBConnection(0,function(err){
        if(err){
            callback(err);
            return;
        }
        var configDirectoryName=dbConfig["reports.config"]?'reportsConfig'+dbConfig["reports.config"]:"reportsConfig";
        var reqSql = new sql.Request(conn);
        try {
            var query_str = fs.readFileSync('./' + configDirectoryName + '/' + filename, 'utf8');
        }catch(e){
            callback(e);
            return;
        }
        reqSql.input('BDATE',sql.Date, bdate);
        reqSql.input('EDATE',sql.Date, edate);
        reqSql.query(query_str,
            function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    callback(null,result);
                }
            });
    });
};

function deleteSpaces(text){
    if(text.indexOf(" ")!=-1){
        text = text.replace(/ /g,"");
    }
    return text;
}

function checkDBConnection(ind,callback){
    if(conn){
        callback();
        return;
    }
    if(ind==4){
        callback({msgForUser:"Не удалось подключиться к базе данных!"});
        return;
    }
    setTimeout(function(){
        exports.databaseConnection(function(err, conn){
            if(err&&!conn){
                checkDBConnection(ind+1,callback);
                return;
            }
            callback();
        })
    }, 6000);
}

module.exports.getPswdByLogin=function(login, callback ){
    checkDBConnection(0,function(err){
        if(err){
            callback(err);
            return;
        }
        var reqSql = new sql.Request(conn);
        reqSql.input('EmpName',login);
        reqSql.query("select LPAss,EmpID from r_Emps where EmpName=@EmpName",
            function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    callback(null,result[0]);
                }
            });
    });
};

module.exports.setPLIDForUserSession=function(EmpID, callback){
    checkDBConnection(0,function(err){
        if(err){
            callback(err);
            return;
        }
        var LPID=getUIDNumber();
        var reqSql = new sql.Request(conn);
        reqSql.input('EmpID',EmpID);
        reqSql.input('LPID',LPID);
        reqSql.query("update r_Emps set LPID=@LPID where EmpID=@EmpID",
            function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    callback(null,LPID);
                }
            });
    });
};

module.exports.getUserNameAndStateCodeByLpid=function(LPID, callback){
    var reqSql = new sql.Request(conn);
    reqSql.input('LPID', LPID);
    reqSql.query("select EmpName, ShiftPostID  from r_Emps where LPID=@LPID",
        function (err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null,result[0]);
            }
        });
};
module.exports.getLPID=function(LPID, callback){
    checkDBConnection(0,function(err){
        if(err){
            callback(err);
            return;
        }
        var reqSql = new sql.Request(conn);
        reqSql.input('LPID',LPID);
        reqSql.query("select  EmpID, LPID from r_Emps where LPID=@LPID",
            function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    if(result[0]&&result[0].LPID){
                        callback(null,result[0].LPID);
                        return;
                    }
                    callback(null,null);
                }
            });
    });
};

function getUIDNumber() {
    var str= uid.time();
    var len = str.length;
    var num = BigNumber(0);
    for (var i = (len - 1); i >= 0; i--)
        num.plus(BigNumber(256).pow(i).mult(str.charCodeAt(i)));
    return num.toString();
};