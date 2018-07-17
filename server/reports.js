var common=require("./common");
var database=require("./databaseMSSQL");
var path=require('path');
var fs=require('fs');
var logger=require('./logger')();
require('ejs');

module.exports= function(app) {                        //    /type/repId/action/repName
    app.get("/simpleReport/*", function(req, res){
        var paramsArray=req.params[0].split('/'), pageID;
        if(paramsArray.length>0) pageID=paramsArray[0];
        if(paramsArray.length==1){
            res.render(path.join(__dirname, '../pages/reports', 'simpleReport.ejs'),{pageID:pageID});
            return;
        }
        if(paramsArray<2){
            res.send({error:"Unknown request!"});
            return;
        }
        var action=paramsArray[1];
        if(action=="getReportsList"){
            var outData={};
            var configDirectoryName=common.getConfigDirectoryName();
            var pagesConfig;
            try{
                pagesConfig=JSON.parse(common.getJSONWithoutComments(fs.readFileSync(path.join(__dirname,'../'+configDirectoryName+'/pagesConfig.json'),'utf8')));
            }catch(e){
                logger.error("Failed to get reports list file. Reason:"+JSON.stringify(e));
                outData.error= "Не удалось получить метаданные для отчетов.";
                res.send(outData);
                return;
            }
            var pageId=paramsArray[0];
            var pages=pagesConfig.pages;
            for(var i in pages)
                if(pages[i].id==pageId){
                    outData.items=pages[i].buttons;
                    break;
                }
            res.send(outData);
            return;
        }
        if(paramsArray<3){
            res.send({error:"Unknown request!"});
            return;
        }
        var reportID=paramsArray[2];
        if(action=="getReportConfigByReportName"){
            var configDirectoryName=common.getConfigDirectoryName();
            var outData={};
            try{
                var fileContentString=fs.readFileSync(path.join(__dirname,'../'+configDirectoryName+'/'+pageID+'/'+reportID+'.json'), 'utf8');
            }catch(e){
                outData.error="Не удалось получить метаданные для отчета";
                logger.error(JSON.stringify(e));
                res.send(outData);
                return;
            }
            var pureJSONTxt=JSON.parse(common.getJSONWithoutComments(fileContentString));
            outData.headers=pureJSONTxt.headers;
            outData.selectedRowInfo=pureJSONTxt.selectedRowInfo;
            outData.totals=pureJSONTxt.totals;
            res.send(outData);
            return;
        } else if(action=="getReportDataByReportName"){
            var outData={};
            var configDirectoryName=common.getConfigDirectoryName();
            try{
                var fileContentString=fs.readFileSync(path.join(__dirname,'../'+configDirectoryName+'/'+pageID+'/'+reportID+'.json'),'utf8');
            }catch(e){
                outData.error= "Не удалось получить данные для отчета";
                logger.error(JSON.stringify(e));
                res.send(outData);
                return;
            }
            var pureJSONTxt=JSON.parse(common.getJSONWithoutComments(fileContentString));
            outData.columns=pureJSONTxt.columns;
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
            if(conditions["Stock"]&&conditions["Stock"].indexOf(",">=0))doConvertReport=true;//!!!FOR 3510!!!
            var groupRowsConfig=pureJSONTxt.groupRows;
            var queryStr = fs.readFileSync('./' + configDirectoryName + '/'+pageID+'/' + reportID+'.sql', 'utf8');
            database.selectParamsMSSQLQuery(queryStr,conditions,
                function (error,recordset) {
                    if (error){
                        outData.error=error.message;
                        logger.error(error.message);
                        res.send(outData);
                        return;
                    }
                    outData.items=recordset;
                    if(doConvertReport||groupRowsConfig)
                        convertReport({outData:outData,
                            rowToColumnKeyField:groupRowsConfig.columnKeyFieldName,
                            rowToColumnFieldName:groupRowsConfig.columnNameFieldName,
                            columnDataFieldName:groupRowsConfig.dataFieldName});
                        //convertReport({outData:outData, rowToColumnFieldName:"StockName", rowToColumnKeyField:"StockID", columnDataFieldName:"Qty"});
                    res.send(outData);
                });
            return;
        } else if(action=="getReportRowDataByReportName"){
            var outData={};
            var configDirectoryName=common.getConfigDirectoryName();
            try{
                var fileContentString=fs.readFileSync(path.join(__dirname,'../'+configDirectoryName+'/'+pageID+'/'+reportID+'.json'),'utf8');
            }catch(e){
                outData.error= "Не удалось получить данные для отчета";
                logger.error(JSON.stringify(e));
                res.send(outData);
                return;
            }
            var pureJSONTxt=JSON.parse(common.getJSONWithoutComments(fileContentString));
            if(!pureJSONTxt.selectedRowInfo||!pureJSONTxt.selectedRowInfo.sql||!pureJSONTxt.selectedRowInfo.sqlParamFieldName){
                res.send(outData);
                return;
            }
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
            database.selectParamsMSSQLQuery(pureJSONTxt.selectedRowInfo.sql,conditions,
                function (error,recordset) {
                    if (error){
                        outData.error=error.message;
                        logger.error(error.message);
                        res.send(outData);
                        return;
                    }
                    if(pureJSONTxt.selectedRowInfo.resultType=="items") outData.items=recordset;
                    else if(recordset[0]) outData.item=recordset[0];
                    res.send(outData);
                });
            return;
        }
        res.send({error:"Unknown request!"});
    });

    /**
     * params: { outData, rowToColumnFieldName, rowToColumnKeyField, columnDataFieldName, exludeNULLs }
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
            if(params.exludeNULLs&&(!rowData[params.rowToColumnFieldName]||rowData[params.columnDataFieldName]==undefined)) continue;
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
                if(newRowData[params.columnDataFieldName]===undefined) newRowData[params.columnDataFieldName]=0;
                newRowData[params.columnDataFieldName]+=rowData[params.columnDataFieldName];
            }

            if(!dynamicRepColumns[newDynamicColumnName]&&rowData[params.rowToColumnFieldName]!==null){
                var newDynamicColumnNameValue=dynamicColumnData.name+" "+rowData[params.rowToColumnFieldName];
                var newDynamicColumnData={};
                for (var cKey in colData) newDynamicColumnData[cKey]=dynamicColumnData[cKey];
                newDynamicColumnData.data=newDynamicColumnName;
                newDynamicColumnData.name=newDynamicColumnNameValue;
                newRepColumns.push(newDynamicColumnData);
                dynamicRepColumns[newDynamicColumnName]= true;
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
            selectStockNames(function(err, result){
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
        selectStockNameByUserID(req.userID, function(err, result){
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
            selectStockNames(function(err, result){
                if (err){
                    outData.error=err.message;
                    res.send(outData);
                    return;
                }
                getAllStocksIdStr(result);
                outData.items=getResultItemsForSelect(result,{valueField:""});
                res.send(outData)
            });
            return;
        }
        selectStockNamesForRemByUserID(req.userID, function(err, result){
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

function selectStockNames(callback){
    database.selectMSSQLQuery(
        "SELECT s.StockName, CONVERT(varchar,r.StockID) as StockID "+
        "from   t_Rem r "+
        "inner join r_Stocks s on s.StockID=r.StockID "+
        "group by r.StockID,s.StockName "+
        "having sum(r.Qty)<>0 "+
        "order by r.StockID ",
        callback
    );
}
function selectStockNameByUserID(EmpID, callback){
    database.selectParamsMSSQLQuery("select CONVERT(varchar,st.StockID)  as StockID, st.StockName,\n" +
        "\te.EmpID, e.EmpName\n" +
        "\t, op.OperID, op.OperName, opcr.CRID, cr.CRName\n" +
        "\tfrom r_Emps e\n" +
        "\tinner join r_Opers op on op.EmpID=e.EmpID\n" +
        "\tinner join r_OperCRs opcr on opcr.OperID=op.OperID and opcr.CRVisible>0\n" +
        "\tinner join r_Crs cr on cr.CRID=opcr.CRID\n" +
        "\tinner join r_Stocks st on st.StockID=cr.StockID\n" +
        "\twhere e.EmpID=@EmpID\n" +
        "\torder by st.StockID",{'EmpID':EmpID},
        callback);
};
function selectStockNamesForRemByUserID(EmpID, callback){
    database.selectParamsMSSQLQuery("select  st.StockName, CONVERT(varchar,st.StockID )  as StockID ,"+
        "e.EmpID, e.EmpName, op.OperID, op.OperName "+
        "from r_Emps e "+
        "inner join r_Opers op on op.EmpID=e.EmpID "+
        "inner join r_OperCRs opcr on opcr.OperID=op.OperID "+
        "inner join r_Crs cr on cr.CRID=opcr.CRID "+
        "inner join r_Stocks st on st.StockID=cr.StockID "+
        "where e.EmpID=@EmpID "+
        "group by  st.StockName,st.StockID ,e.EmpID,e.EmpName,op.OperID,op.OperName "+
        "order by st.StockID;",{'EmpID':EmpID},
        callback);
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