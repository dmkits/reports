var fs = require('fs');
var sql = require('mssql');
var app = require('./app');
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
        callback(null,"connected");
    });
};


module.exports.getResultToNewQuery=function(newQuery, parameters, callback ){
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
};

module.exports.getSalesBy=function(filename, bdate,edate, callback ){
    var reqSql = new sql.Request(conn);
    var query_str = fs.readFileSync('./reportsConfig/'+filename, 'utf8');
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
};

function deleteSpaces(text){
    if(text.indexOf(" ")!=-1){
        text = text.replace(/ /g,"");
    }
    return text;
}