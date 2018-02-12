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
    app.get("/reports/getReportConfigByReportName/*", function(req, res){
        var configDirectoryName=common.getConfigDirectoryName();
        var filename = req.params[0];
        var outData={};
        try{
            var fileContentString=fs.readFileSync('./'+configDirectoryName+'/'+filename+'.json', 'utf8');
        }catch(e){
            outData.error=e;
            res.send(outData);
            return;
        }
        var pureJSONTxt=JSON.parse(common.getJSONWithoutComments(fileContentString));
        outData.headers=pureJSONTxt.headers;
        res.send(outData);
    });
    app.get("/reports/getReportDataByReportName/*", function(req, res){
        var outData={};
        if(req.url.indexOf("/reports/getReportDataByReportName/prod_balance")==0
            && (req.isAdminUser || req.isSysadmin)
            && req.query['StockID']==-1){
            getExtendedQtyData(function(err, result){
                if(err){
                    outData.error=err;
                    res.send(outData);
                    return;
                }
                outData=result;
                res.send(outData);
            });
            return;
        }
        var configDirectoryName=common.getConfigDirectoryName();
        var filename = req.params[0];
        try{
            var fileContentString=fs.readFileSync('./'+configDirectoryName+'/'+filename+'.json', 'utf8');
        }catch(e){
            outData.error=e;
            res.send(outData);
            return;
        }
        var pureJSONTxt=JSON.parse(common.getJSONWithoutComments(fileContentString));
        outData.columns=pureJSONTxt.columns;
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
        if(req.isAdminUser||req.isSysadmin){
            database.selectStockNames(function(err, result){
                if (err){
                    outData.error=err.message;
                    res.send(outData);
                    return;
                }
                outData.items=getResultItemsForSelect(result,{valueField:""});
                res.send(outData)
            });
            return;
        }
        database.selectStockNameByUserID(req.userID, function(err, result){
            if (err){
                outData.error=err.message;
                res.send(outData);
                return;
            }
            outData.items=getResultItemsForSelect(result,{valueField:""});
            res.send(outData)
        })
    });
    app.get("/reports/getStocksForRem", function(req, res){
        var outData={};
        if(req.isAdminUser||req.isSysadmin){
            database.selectStockNames(function(err, result){
                if (err){
                    outData.error=err.message;
                    res.send(outData);
                    return;
                }
                result.push({StockName:"Все склады",StockID:-1});
                outData.items=getResultItemsForSelect(result,{valueField:""});
                res.send(outData)
            });
            return;
        }
        database.selectStockNameByUserID(req.userID, function(err, result){
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

 function getAllStocksProdBalanceQueryStr(stocksArr){
    var queryText="";
     var selectSnippetStr="select p.Article1, p.ProdName, p.UM, ";
     var joinSnippetStr='';
     var whereSnippetStr=' where NOT(';
     for (var i in stocksArr){
         selectSnippetStr=selectSnippetStr+' SUM(r'+i+'.Qty) as R'+i+'Qty';
         joinSnippetStr=joinSnippetStr+	' left join r_Stocks st'+i+' on st'+i+'.StockID= '+stocksArr[i].StockID+
         ' left join t_Rem r'+i+' on r'+i+'.ProdID=p.ProdID and r'+i+'.StockID=st'+i+'.StockID';
         whereSnippetStr=whereSnippetStr+' r'+i+'.Qty is NULL ';
         if(i<stocksArr.length-1){
             selectSnippetStr=selectSnippetStr+',';
             whereSnippetStr=whereSnippetStr+' and ';
         }
         if(i==stocksArr.length-1){
             whereSnippetStr=whereSnippetStr+')';
         }
     }
     queryText=queryText+selectSnippetStr;
     queryText=queryText+" from r_Prods p ";
     queryText=queryText+joinSnippetStr;
     queryText=queryText+whereSnippetStr;
     queryText=queryText+" group by p.Article1, p.ProdName, p.UM;";
return queryText;
 };

function getQtyColumns(stocksArr){
    var qtyCol=[
        { data:"ProdName", name:"Наименование товара", width:300, type:"text"},
        { data:"Article1", name:"Артикул", width:80, type:"text"},
        { data:"UM", name:"Ед. изм", width:80, type:"text"}
    ];
    for(var i in stocksArr){
        qtyCol.push({data:"R"+i+"Qty",name:stocksArr[i].StockName+"\nКол-во", "width":80, "type":"numeric", "language":"ru-RU", "format":"#,###,###,##0.[#########]" });
    }
    return qtyCol;
}
function getExtendedQtyData(callback){
    var extendedQtyObj={};
    database.selectStockNames(function(err,result){
        if(err){
            callback(err);
            return;
        }
        extendedQtyObj.columns=getQtyColumns(result);
        var queryStr = getAllStocksProdBalanceQueryStr(result);
        database.executeQuery(queryStr, function(err, res){
            if(err){
                callback(err);
                return;
            }
            extendedQtyObj.items=res;
            callback(null,extendedQtyObj);
        })
    });
}