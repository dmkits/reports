
var fs = require('fs');       console.log('module for dataBase.js  fs');
var sql = require('mssql');   console.log('module for dataBase.js mssql');
var app = require('./app');   console.log('module for dataBase.js ./app');
var dbConfig;
var dbConfigFilePath;
var conn=null;

module.exports.getDBConfig=function(){
    return dbConfig;
};
module.exports.setDBConfig=function(newDBConfig){
    dbConfig= newDBConfig;
};
module.exports.loadConfig=function(){
    dbConfigFilePath='./' + app.startupMode + '.cfg';
    var stringConfig = fs.readFileSync(dbConfigFilePath);
    dbConfig = JSON.parse(stringConfig);
};
module.exports.saveConfig=function(callback) {
    fs.writeFile(dbConfigFilePath, JSON.stringify(dbConfig), function (err, success) {
        callback(err,success);
    })
};

module.exports.databaseConnection=function(callback){
    if(conn) conn.close();
    conn = new sql.Connection(dbConfig);
    conn.connect(function (err) {
        if (err) {
            callback(err.message);
            return;
        }
        callback(null,conn);
    });
};

module.exports.getQueryResult=function(newQuery, parameters, callback ){
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

module.exports.getSalesBy=function(filename, bdate,edate, callback ){      //changeName
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

function checkDBConnection(ind,callback){                           console.log("checkDBConnection conn 94=",conn);
    callback();
  //  if(conn){
  //      callback();
  //      return;
  //  }
  //  if(ind==5){
  //      callback({DBConnError:"FAILED to set DB connection!"});
  //      return;
  //  }
  //  setTimeout(function(){
  //      exports.databaseConnection(function(err, conn){
  //          if(err&&!conn){
  //              checkDBConnection(ind+1,callback);
  //              return;
  //          }
  //          callback();
  //      })
  //  }, 6000);
}

