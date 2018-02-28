var common=require("./common");
var database=require("./dataBase");
var path=require('path');
var fs=require('fs');
var logger=require('./logger')();

module.exports= function(app) {
    app.get("/reports/reportPage", function(req, res){
        res.sendFile(path.join(__dirname, '../pages/reports', 'simpleReport.html'));
    });
    app.get("/reports/getReportsList", function (req, res) {
        var outData={};
        var configDirectoryName=common.getConfigDirectoryName();
        var repData;
        try{
            repData=JSON.parse(common.getJSONWithoutComments(fs.readFileSync(path.join(__dirname,'../'+configDirectoryName+'/reports_list.json'),'utf8')));
        }catch(e){
            logger.error("Failed to get reports list file. Reason:"+e);
            outData.error= "Failed to get reports list file. Reason:"+e;
            res.send(outData);
            return;
        }
        var reports=repData.reports;
        if(req.userRoleCode=="sysadmin"){
            outData.items=reports;
            res.send(outData);
            return;
        }
        var userRepList=repData.rolesCodes[req.userRoleCode];
        var userReports=[];
        for(var i in userRepList){
            if(userRepList[i].trim().length==0){
                userReports.push({});
                continue;
            }
            for(var j in reports){
                if(!reports[j].id) continue;
                else if(userRepList[i]==reports[j].id){
                    userReports.push(reports[j]);
                }
            }
        }
        outData.items=userReports;   console.log("userReports=",userReports);
        res.send(outData);
    });
    app.get("/reports/getReportConfigByReportName/*", function(req, res){
        var configDirectoryName=common.getConfigDirectoryName();
        var filename = req.params[0];
        var outData={};
        try{
            var fileContentString=fs.readFileSync(path.join(__dirname,'../'+configDirectoryName+'/'+filename+'.json'), 'utf8');
        }catch(e){
            outData.error=e;
            res.send(outData);
            return;
        }
        var pureJSONTxt=JSON.parse(common.getJSONWithoutComments(fileContentString));
        outData.headers=pureJSONTxt.headers;
        outData.totals=pureJSONTxt.totals;
        res.send(outData);
    });
    app.get("/reports/getReportDataByReportName/*", function(req, res){
        res.connection.setTimeout(0);
        req.connection.setTimeout(0);
        var outData={};
        var configDirectoryName=common.getConfigDirectoryName();
        var filename = req.params[0];
        try{
            var fileContentString=fs.readFileSync(path.join(__dirname,'../'+configDirectoryName+'/'+filename+'.json'),'utf8');
        }catch(e){
            outData.error=e;
            res.send(outData);
            return;
        }
        var pureJSONTxt=JSON.parse(common.getJSONWithoutComments(fileContentString));
        outData.columns=pureJSONTxt.columns;
        // if(req.url.indexOf("/reports/getReportDataByReportName/prod_balance")==0
        //     && (req.isAdminUser || req.isSysadmin)
        //     && req.query['StockID']==-1){
        //     getExtendedQtyData(outData.columns,function(err, result){
        //         if(err){
        //             outData.error=err;
        //             res.send(outData);
        //             return;
        //         }
        //         outData=result;
        //         res.send(outData);
        //     });
        //     return;
        // }
        var noConditions=true;
        for (var condition in req.query) {
            noConditions=false;
            break;
        }
        if(noConditions){
            res.send(outData);
            return;
        }
        var conditions=req.query;
        var doConvertReport=false;
        //if(doConvertReport= (conditions["Stock"]=="-1")) conditions["Stock"]="1,2,3,4,5,6,7,9";
        if(conditions["Stock"]&&conditions["Stock"].indexOf(",">=0))doConvertReport=true;
        database.getReportTableDataBy(filename+".sql", conditions,
            function (error,recordset) {
                if (error){
                    outData.error=error.message;
                    res.send(outData);
                    return;
                }
                outData.items=recordset;
                if(doConvertReport)
                    convertReport({outData:outData, rowToColumnFieldName:"StockName", rowToColumnKeyField:"StockID", columnDataFieldName:"Qty"});
                res.send(outData);
            });
    });

    /**
     * params: { outData, rowToColumnFieldName, rowToColumnKeyField, columnDataFieldName }
     */
    function convertReport(params){
        var repData= params.outData.items, repColumns= params.outData.columns;
        var newRepData=[], newRepColumns=[], newRepDataRows={}, dynamicRepColumns={}, dynamicColumnData={};

        for (var col = 0; col < repColumns.length; col++) {
            var colData = repColumns[col];
            if(colData.data==params.columnDataFieldName){
                for (var cKey in colData) dynamicColumnData[cKey]=colData[cKey];
            } else if(colData.data!=params.rowToColumnFieldName&&colData.data!=params.rowToColumnKeyField)
                newRepColumns.push(colData);
        }

        for (var row = 0; row < repData.length; row++) {
            var rowData = repData[row];

            if(rowData[params.rowToColumnFieldName]&&rowData[params.columnDataFieldName]!=undefined){
                var newRowData={}, newRowDataKeyValue="";
                for (var rdKey in rowData) {
                    if(rdKey==params.rowToColumnFieldName||rdKey==params.rowToColumnKeyField||rdKey==params.columnDataFieldName) continue;
                    var rowDataValue=rowData[rdKey]
                    newRowData[rdKey]= rowDataValue;
                    newRowDataKeyValue+=rowDataValue;
                }

                if(newRepDataRows[newRowDataKeyValue]) newRowData=newRepDataRows[newRowDataKeyValue];

                var dynamicColumnKeyValue= rowData[params.rowToColumnKeyField];
                var newDynamicColumnName=params.columnDataFieldName+"_"+dynamicColumnKeyValue;

                if(!newRepDataRows[newRowDataKeyValue]) {
                    // newRowData[newDynamicColumnName]=rowData[params.columnDataFieldName];
                    newRepData.push(newRowData);
                    newRepDataRows[newRowDataKeyValue]=newRowData;
                } else {
                    newRowData=newRepDataRows[newRowDataKeyValue];
                    // newRowData[newDynamicColumnName]=rowData[params.columnDataFieldName];
                }
                newRowData[newDynamicColumnName]=rowData[params.columnDataFieldName];
                if(dynamicColumnData.necessary) {
                    if(newRowData[params.columnDataFieldName]==undefined) newRowData[params.columnDataFieldName]=0;
                    newRowData[params.columnDataFieldName]+=rowData[params.columnDataFieldName];
                }

                if(!dynamicRepColumns[newDynamicColumnName]){
                    var newDynamicColumnNameValue=dynamicColumnData.name+" "+rowData[params.rowToColumnFieldName];
                    var newDynamicColumnData={};
                    for (var cKey in colData) newDynamicColumnData[cKey]=dynamicColumnData[cKey];
                    newDynamicColumnData.data=newDynamicColumnName;
                    newDynamicColumnData.name=newDynamicColumnNameValue;
                    newRepColumns.push(newDynamicColumnData);
                    dynamicRepColumns[newDynamicColumnName]= true;
                }
            }

        }
        if(dynamicColumnData.necessary) {
            newRepColumns.push(dynamicColumnData);
            dynamicColumnData.name+=" ИТОГО";
        }
        params.outData.items=newRepData;
        params.outData.columns=newRepColumns;
    }
    app.get("/reports/getStocks", function(req, res){
        res.connection.setTimeout(0);
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
        res.connection.setTimeout(0);
        var outData={};
        if(req.isAdminUser||req.isSysadmin){
            database.selectStockNames(function(err, result){
                if (err){
                    outData.error=err.message;
                    res.send(outData);
                    return;
                }
                //result.unshift({StockName:"Все склады",StockID:-1});
                getAllStocksIdStr(result);
                outData.items=getResultItemsForSelect(result,{valueField:""});
                res.send(outData)
            });
            return;
        }
        database.selectStockNamesForRemByUserID(req.userID, function(err, result){
            res.connection.setTimeout(0);
            if (err){
                outData.error=err.message;
                res.send(outData);
                return;
            }
            getAllStocksIdStr(result);
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
function getAllStocksIdStr(result){
    if(result.length<=1) return;
    var stockStr="";
    for(var i in result ){
        if(stockStr.length>0){
            stockStr+=',';
        }
        stockStr+=result[i].StockID;
    }
    result.unshift({StockName:"Все склады",StockID:stockStr});
}

//  function getAllStocksProdBalanceQueryStr(stocksArr){
//     var queryText="";
//      var selectSnippetStr="select p.ProdId,p.Article1, p.ProdName, p.UM, ";
//      var totalQtySnippet=" ,";
//      var joinSnippetStr='';
//      var whereSnippetStr=' where NOT(';
//      for (var i in stocksArr){
//          selectSnippetStr=selectSnippetStr+' SUM(r'+i+'.Qty) as R'+i+'Qty';
//          totalQtySnippet=totalQtySnippet+'ISNULL(SUM(r'+i+'.Qty),0)';
//          joinSnippetStr=joinSnippetStr+	' left join r_Stocks st'+i+' on st'+i+'.StockID= '+stocksArr[i].StockID+
//          ' left join t_Rem r'+i+' on r'+i+'.ProdID=p.ProdID and r'+i+'.StockID=st'+i+'.StockID and r'+i+'.Qty<>0';
//          whereSnippetStr=whereSnippetStr+' r'+i+'.Qty is NULL ';
//          if(i<stocksArr.length-1){
//              selectSnippetStr=selectSnippetStr+',';
//              totalQtySnippet=totalQtySnippet+'+';
//              whereSnippetStr=whereSnippetStr+' and ';
//          }
//          if(i==stocksArr.length-1){
//              whereSnippetStr=whereSnippetStr+')';
//          }
//      }
//      queryText=queryText+selectSnippetStr;
//      queryText=queryText+totalQtySnippet+' as Qty';
//      queryText=queryText+" from r_Prods p ";
//      queryText=queryText+joinSnippetStr;
//      queryText=queryText+whereSnippetStr;
//      queryText=queryText+" group by p.ProdId, p.Article1, p.ProdName, p.UM;";
// return queryText;
//  };

// function getQtyColumns(stocksArr,columns){
//     var extendedColumns=[];
//     var qtyColData;
//     for(var i in columns){
//         if(columns[i].data !="Qty")extendedColumns.push(columns[i]);
//         else qtyColData=columns[i];
//     }
//     for(var i in stocksArr){
//         var newQtyColumn={data:"R"+i+"Qty",name:"Кол-во\n"+stocksArr[i].StockName};
//         var qtyParams=Object.keys(qtyColData);
//         for(var param in qtyParams){
//             if(param=="data" ||param=="name") continue;
//             newQtyColumn[param]=qtyParams[param];
//         }
//         extendedColumns.push(newQtyColumn);
//     }
//     qtyColData.name="Итоговое кол-во";
//     extendedColumns.push(qtyColData);
//     return extendedColumns;
// }
// function getExtendedQtyData(columns,callback){
//     var extendedQtyObj={};
//     database.selectStockNames(function(err,stockNamesResult){
//         if(err){
//             callback(err.message);
//             return;
//         }
//         extendedQtyObj.columns=getQtyColumns(stockNamesResult,columns);
//         var queryStr = getAllStocksProdBalanceQueryStr(stockNamesResult);
//         database.executeQuery(queryStr, function(err, result){
//             if(err){
//                 callback(err.message);
//                 return;
//             }
//             extendedQtyObj.items=result;
//             callback(null,extendedQtyObj);
//         })
//     });
// }