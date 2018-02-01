var common=require("./common");
var database=require("./dataBase");
var path=require('path');
var fs=require('fs');

module.exports= function(app) {

    app.get("/reports/sql_queries/get_reports_list", function (req, res) {
        var outData={};
        var configDirectoryName=common.getConfigDirectoryName();
        outData.jsonText =fs.readFileSync('./'+configDirectoryName+'/reports_list.json').toString();
        console.log("outData.jsonText=",outData.jsonText);
        outData.jsonFormattedText = common.getJSONWithoutComments(outData.jsonText);
        res.send(outData);
    });

    app.get("/reports/retail_sales/get_sales_by/*", function(req, res){
        var configDirectoryName=common.getConfigDirectoryName();
        var filename = req.params[0];
        var outData={};
        var fileContentString=fs.readFileSync('./'+configDirectoryName+'/'+filename+'.json', 'utf8');
        var pureJSONTxt=JSON.parse(common.getJSONWithoutComments(fileContentString));
        outData.columns=pureJSONTxt.columns;
        var bdate = req.query.BDATE, edate = req.query.EDATE;
        if (!bdate&&!edate) {
            res.send(outData);
            return;
        }
        database.getSalesBy(filename+".sql",bdate,edate,
            function (error,recordset) {
                if (error){
                    outData.error=error.message;
                    res.send(outData);
                    return;
                }
                outData.items=recordset;
                res.send(outData);
            });
    });
    app.get("/reports/retail_sales", function(req, res){
        res.sendFile(path.join(__dirname, '../pages/reports', 'retail_sales.html'));
    });
};