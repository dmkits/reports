var database= require("./dataBase");

module.exports.tryLoadConfiguration=function (app){      //console.log('tryLoadConfiguration...', new Date().getTime() - startTime);
    try {
        database.loadConfig();
        app.ConfigurationError=null;
    } catch (e) {                    console.log('ConfigurationError=', ConfigurationError);
        app.ConfigurationError= "Failed to load configuration! Reason:"+e;
    }
};
module.exports.getConfigDirectoryName=function (){
    var dirName=database.getDBConfig()["reports.config"]?"reportsConfig"+database.getDBConfig()["reports.config"]:"reportsConfig";
    return dirName;
};

module.exports.getJSONWithoutComments= function (text){
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
};

module.exports.tryDBConnect=function (app,postaction) {                                        //console.log('tryDBConnect...', new Date().getTime() - startTime);
    database.databaseConnection(function (err) {
        app.DBConnectError = null;
        if (err) {
            app.DBConnectError = "Failed to connect to database! Reason:" + err;              console.log('DBConnectError=',app.DBConnectError);
        }
        if (postaction)postaction(err);
    });
};





