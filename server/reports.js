var common=require("./common");
var database=require("./dataBase");
var path=require('path');
var fs=require('fs');

module.exports= function(app) {
    app.get("/reports/reportPage", function(req, res){
        res.sendFile(path.join(__dirname, '../pages/reports', 'simpleReport.html'));
    });
    app.get("/reports/getReportsList", function (req, res) {
        var outData={};
        var configDirectoryName=common.getConfigDirectoryName();
        outData.jsonText =fs.readFileSync('./'+configDirectoryName+'/reports_list.json').toString();
        outData.jsonFormattedText = common.getJSONWithoutComments(outData.jsonText);
        res.send(outData);
    });
    app.get("/reports/getReportDataByReportName/*", function(req, res){
        var configDirectoryName=common.getConfigDirectoryName();
        var filename = req.params[0];
        var outData={};
        var fileContentString=fs.readFileSync('./'+configDirectoryName+'/'+filename+'.json', 'utf8');
        var pureJSONTxt=JSON.parse(common.getJSONWithoutComments(fileContentString));
        outData.columns=pureJSONTxt.columns;
        outData.headers=pureJSONTxt.headers;
        var conditions;
        for (var paramName in req.query) {
            if(!conditions)conditions={};
            conditions[paramName]= req.query[paramName];
        }
        if(!conditions){
            res.send(outData);
            return;
        }
        database.getReportTableDataBy(filename+".sql", conditions,
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
    app.get("/reports/getStocks", function(req, res){
        var outData={};
        database.selectStockNames(function(err, result){
            if (err){
                outData.error=err.message;
                res.send(outData);
                return;
            }
            outData.items=getResultItemsForSelect(result,{valueField:""});
            res.send(outData)
        })
    });
};

function getResultItemsForSelect(result){
        var resultItems=result;
        var items=[];
        for(var i in resultItems){
            var resultItem=resultItems[i];
            var selectItem={value:resultItem.StockID};
            selectItem.label=resultItem.StockName;
            items.push(selectItem);
        }
        return items;
}
