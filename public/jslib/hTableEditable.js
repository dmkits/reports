/**
 * Created by dmkits on 16.02.17.
 */
define(["dojo/_base/declare", "hTableSimpleFiltered", "request"], function(declare, hTableSimpleFiltered, Request){
    return declare("HTableEditable", [hTableSimpleFiltered], {
        allowEditRowProp:"<!$allow_edit$!>",
        constructor: function(args,parentName){
            declare.safeMixin(this,args);
        },
        setChangeSettings: function(){
            var parent= this;
            var parentCellValueRenderer=this.handsonTable.getSettings().cellValueRenderer;
            this.handsonTable.updateSettings({
                cellValueRenderer:function (instance, td, row, col, prop, value, cellProperties) {
                    parentCellValueRenderer(instance, td, row, col, prop, value, cellProperties);
                    var rowSourceData= instance.getContentRow(row);
                    if (rowSourceData[parent.allowEditRowProp]==true) td.classList.add('hTableRowInEditMode');//markAsEditMode-row data not stored to server
                    var markAsError= false;
                    for(var dataItemName in rowSourceData)
                        if (rowSourceData[dataItemName]!==undefined
                            && (dataItemName.indexOf("<!$error$!>")>=0 || (dataItemName.indexOf("<!$error_")>=0&&dataItemName.indexOf("$!>")>=0)) ) {
                                markAsError=true; break;
                        }
                    if (!markAsError && (!parent.getRowIDName()||rowSourceData[parent.getRowIDName()]===undefined )) markAsError=true;
                    if(markAsError){ td.classList.add('hTableErrorRow'); }//markAsError
                    //markAsError= (instance.rowIDName&&(rowID===undefined||rowID==null));
                    //if (!markAsError) {
                    //    for(var dataItemName in rowSourceData){
                    //        var rowItemData= rowSourceData[dataItemName];
                    //        markAsError= (rowItemData&&dataItemName.indexOf("$error_")>=0);
                    //        if (markAsError) break;
                    //    }
                    //}
                    //if(markAsNotStored){ td.classList.add('hTableErrorRow'); }//markAsError
                }
            });
            this.handsonTable.updateSettings({
                cells: function (row/*index in data*/, col, prop) {                                                     //console.log("HTableEditable cells row=",row, this.instance.getSourceData(row));
                    var cellProps={readOnly:true, renderer:this.cellValueRenderer};
                    var rowData;
                    if ((rowData=this.instance.getSourceData()[row])!==undefined && rowData!==null && rowData[parent.allowEditRowProp]===true)
                        cellProps.readOnly=false;
                    if (this.columns&&cellProps.readOnly==false){
                        var colData = this.columns[col];
                        if(colData&&colData.readOnly==true) cellProps.readOnly=true;
                    }
                    return cellProps;
                }
            });
            //minSpareCols:0, minSpareRows: parent.htAddRows, //var isAllowInsertRow= this.htAddRows>0; allowInsertRow:isAllowInsertRow,
            if (this.allowFillHandle===true)
                this.handsonTable.updateSettings({ fillHandle:{autoInsertRow:false, direction:'vertical'} });
            this.handsonTable.updateSettings({
                afterChange: function (change, source) {                                                                //console.log("HTableEditable afterChange source=",source," change=",change, this);
                    if (source === 'loadData' || !parent.onChangeRowsData) return;
                    if(change.length==1){//changed 1 cell
                        var rowInd=change[0][0],prop= change[0][1], oldVal= change[0][2];                               //console.log("HTableEditable afterChange changed 1 cell row=",rowInd," cell=",prop," oldVal=",oldVal);
                        var rowData=this.getContentRow(rowInd), oldRowData= {};
                        for(var itemName in rowData) oldRowData[itemName]=rowData[itemName];
                        oldRowData[prop]=oldVal;
                        var changedRowData= parent.getChangedRowsData(rowData, oldRowData);                         //console.log("HTableEditable afterChange changed 1 cell",rowData,oldRowData);
                        parent.onChangeRowsData(changedRowData);
                        return;
                    }
                    //changed many cells
                    var changedRowsData=[],changedRowsOldData=[];
                    for (var i = 0; i < change.length; i++) {
                        var rowInd=change[i][0], prop= change[i][1], oldVal= change[i][2];
                        var changedRowData= changedRowsData[rowInd], oldRowData= changedRowsOldData[rowInd];
                        if (!changedRowData) {
                            changedRowData = this.getContentRow(rowInd);
                            changedRowsData[rowInd]=changedRowData;
                            oldRowData= {};
                            for(var itemName in changedRowData) oldRowData[itemName]=changedRowData[itemName];
                            changedRowsOldData[rowInd]=oldRowData;
                        }
                        oldRowData[prop]=oldVal;
                    }                                                                                   //console.log("HTableEditable afterChange changed many cell",changedRowsData,changedRowsOldData);
                    var changedRows= parent.getChangedRowsData();
                    for(var rowInd in changedRowsData){                                                 //console.log("HTableEditable afterChange changed many cell",changedRowsData[rowInd],changedRowsOldData[rowInd]);
                        changedRows.addRowData(changedRowsData[rowInd],changedRowsOldData[rowInd]);
                    }
                    parent.onChangeRowsData(changedRows);
                }
            });
        },
        postCreate : function() {
            this.createHandsonTable();
            this.setHandsonTableFilterSettings();
            this.setChangeSettings();
        },

        setRowAllowEditProp: function(rowData, editPropValue){
            if (editPropValue===undefined) editPropValue=true;
            rowData[this.allowEditRowProp]= editPropValue;
            return rowData;
        },
        allowEditRow: function(rowData, editPropValue){
            this.setRowAllowEditProp(rowData, editPropValue);
            this.handsonTable.render();
            var rowsData=[]; rowsData[0]=rowData;
            this.onUpdateContent({changedRows:rowsData});
            return rowData;
        },
        allowEditSelectedRow: function(){
            var selectedRow= this.getSelectedRow();
            if (!selectedRow) return;
            this.allowEditRow(selectedRow);
        },
        allowEditRows: function(rowsData){
            for (var rowIndex in rowsData) this.setRowAllowEditProp(rowsData[rowIndex]);
            this.handsonTable.render();
            this.onUpdateContent({changedRows:rowsData});
        },
        isRowEditable: function(rowData){
            if (!rowData) return false;
            if (rowData[this.allowEditRowProp]== true) return true;
            return false;
        },
        isSelectedRowEditable: function(){
            var selectedRow= this.getSelectedRow();
            if (!selectedRow) return false;
            if (this.isRowEditable(selectedRow)) return true;
            return false;
        },
        isExistsEditableRows: function(){
            var tableContentData= this.getData();
            if (!tableContentData||tableContentData.length==0) return false;
            for(var rowInd=0;rowInd<tableContentData.length;rowInd++){
                var rowData=tableContentData[rowInd];
                if (this.isRowEditable(rowData)) return true;
            }
            return false;
        },
        /*
         * params: {posItemName, posIndexItemName}
         */
        //setRowDataPosIndex: function(rowData, rowIndex, params){
        //    if (!params || (!params.posItemName&&!params.posIndexItemName)) return;
        //    var updatedRowData={};
        //    if (this.getLoadedData().length==1){
        //        if (params.posIndexItemName) updatedRowData[params.posIndexItemName]=1;
        //        if (params.posItemName) updatedRowData[params.posItemName]=1;
        //        this.updateRowData(rowIndex,updatedRowData);
        //        return;
        //    }
        //    var prevRowData=this.getLoadedData()[rowIndex-1], prevRowPosIndex= 0,prevRowPos=0;
        //    if (prevRowData&&params.posIndexItemName) prevRowPosIndex=prevRowData[params.posIndexItemName];
        //    if (prevRowData&&params.posItemName) prevRowPos=prevRowData[params.posItemName];
        //    var nextRowData=this.getLoadedData()[rowIndex+1];
        //    if (!nextRowData){
        //        if (params.posIndexItemName) updatedRowData[params.posIndexItemName]=prevRowPosIndex+1;
        //        if (params.posItemName&&params.posIndexItemName) updatedRowData[params.posItemName]=Math.trunc(prevRowPosIndex+1);
        //        else if (params.posItemName) updatedRowData[params.posItemName]=prevRowPos+1;
        //        this.updateRowData(rowIndex,updatedRowData);
        //        return
        //    }
        //    var nextRowPosIndex= 0,nextRowPos=0;
        //    if (params.posIndexItemName) {
        //        nextRowPosIndex=nextRowData[params.posIndexItemName];
        //        updatedRowData[params.posIndexItemName]=(prevRowPosIndex+nextRowPosIndex)/2;
        //    }
        //    if (params.posItemName) {
        //        nextRowPos=nextRowData[params.posItemName];                                                               console.log("setRowDataPosIndex ",prevRowPos,nextRowPos);
        //        if (params.posIndexItemName) updatedRowData[params.posItemName]=Math.trunc((prevRowPosIndex+nextRowPosIndex)/2);
        //        else updatedRowData[params.posItemName]=Math.trunc((prevRowPos+nextRowPos)/2);
        //    }
        //    this.updateRowData(rowIndex,updatedRowData);
        //},
        /*
         * params { editPropValue, addData, callUpdateContent }
         */
        updateRowData: function(rowData, newRowData, params){
            for(var itemName in rowData) rowData[itemName]= (newRowData)?newRowData[itemName]:null;
            var editPropValue= (params&&params.editPropValue!==undefined)? params.editPropValue : true;
            rowData[this.allowEditRowProp]= editPropValue;
            if(rowData==this.getSelectedRow()) this.handsonTable.getSettings().setDataSelectedProp(rowData);
            if (params.addData)
                for(var itemName in params.addData) rowData[itemName]= params.addData[itemName];
            this.handsonTable.render();
            if (params.callUpdateContent!=false) {
                var rowsData=[]; rowsData[0]=rowData;
                this.onUpdateContent({changedRows:rowsData});
            }
            return rowData;
        },
        insertRowsAfterSelected: function(count, dataValuesForNewRows){
            var selectedRowData= this.getSelectedRow(), selectRowIndex= -1;
            var data=this.getData(), dataLength=data.length;
            for (var rowInd=0; rowInd<dataLength; rowInd++) {
                if (data[rowInd]===selectedRowData) {
                    selectRowIndex=rowInd; break;
                }
            }                                                                                                           //console.log("HTableEditable insertRowsAfterSelected",selectedRowData,dataValuesForNewRows);
            var valuesForNewRows;
            if (dataValuesForNewRows){
                valuesForNewRows={};
                if (this.getRowIDName()) valuesForNewRows[this.getRowIDName()]=null;
                for (var rowItem in dataValuesForNewRows)
                    if (rowItem.indexOf("<!$")<0&&rowItem.indexOf("$!>")<0 && rowItem!==this.getRowIDName()) valuesForNewRows[rowItem]=dataValuesForNewRows[rowItem];
            }
            var newChangedRowsData = this.getChangedRowsData();
            for (var ri = dataLength+count - 1; ri > selectRowIndex; ri--) {
                if (ri>selectRowIndex+count) {
                    data[ri] = data[ri-count];
                } else {
                    var insertingRowData=this.setRowAllowEditProp({}), newRowData=this.setRowAllowEditProp({});
                    for(var colInd=0; colInd<this.getColumns().length; colInd++){
                        var col=this.getColumns()[colInd], prop=col["data"];
                        insertingRowData[prop]=null; newRowData[prop]=null;
                    }
                    data[ri]= insertingRowData;
                    if (this.getRowIDName()) {
                        newRowData[this.getRowIDName()]= null; insertingRowData[this.getRowIDName()]= null;
                    }
                    if (valuesForNewRows)
                        for(var rowItem in valuesForNewRows) insertingRowData[rowItem] = valuesForNewRows[rowItem];
                    newChangedRowsData.insertRowData(insertingRowData, newRowData);
                }
            }                                                                                                           //console.log("HTableEditable insertRowsAfterSelected valuesForNewRows=",valuesForNewRows);
            this.handsonTable.render();
            var thisInstance=this;
            //setTimeout(function(){
                thisInstance.onChangeRowsData(newChangedRowsData);
            //}, 1);
        },
        insertRowAfterSelected: function(dataValuesForNewRow){
            return this.insertRowsAfterSelected(1,dataValuesForNewRow);
        },
        /*
         * params { callUpdateContent }
         */
        deleteRow: function(deleteRowData,params){
            var deleteRowIndex= -1, newSelectedRow=null, newSelection=[];
            var data=this.getData(), dataLength=data.length;
            if (dataLength<=0) return;
            for (var rowInd=0; rowInd<dataLength; rowInd++) {
                if (data[rowInd]===deleteRowData) {
                    if (!newSelectedRow) {
                        if (rowInd+1<dataLength) {
                            newSelectedRow=data[rowInd+1]; newSelection[rowInd]=newSelectedRow;
                        } else if (rowInd-1>=0) {
                            newSelectedRow=data[rowInd-1]; newSelection[rowInd-1]=newSelectedRow;
                        }
                    }
                    deleteRowIndex=rowInd; break;
                }
            }                                                                                                           //console.log("HTableEditable deleteRow",deleteRowData,deleteRowIndex,newSelectedRow,newSelection);
            if (deleteRowIndex<0) {
                this.setSelection(null,null);
                return;
            }
            for(var rowInd=deleteRowIndex; rowInd<dataLength-1; rowInd++) data[rowInd]=data[rowInd+1];
            data.length=dataLength-1;
            this.setSelection(newSelectedRow,newSelection);                                                             //console.log("HTableEditable deleteRow params=",params,deleteRowData,newSelectedRow,newSelection);
            if (params&&params.callUpdateContent===false) return;
            var rowsData=[]; rowsData[0]=deleteRowData;
            this.onUpdateContent({deletedRows:rowsData});
        },
        /*
         * params: { filtered, changedRows, deletedRows }
         */
        onUpdateContent: function(params){
            //TODO actions on/after update table content (after set/reset/reload/clear table content data) (params filtered has value)
            //TODO actions after set/clear table filters (params filtered has value)
            //TODO actions after set table data props values (params changedParams has value)
            //TODO actions after deleted table row (params deletedRows has value)
        },

        getChangedRowsData: function (newRowData, oldRowData) {
            function ChangedData(itemName, newRowData, oldRowData){
                this.itemName=itemName; this.values=newRowData; this.oldValues=oldRowData;
                this.getValue= function() {
                    var value=this.values[this.itemName],oldValue=this.oldValues[this.itemName];
                    if (value===undefined&&oldValue!==undefined) return oldValue;
                    return value;
                };
                this.setValue= function(newValue) {
                    if (typeof(newValue)=="number"&&isNaN(newValue)) this.values[this.itemName]=""; else this.values[this.itemName] = newValue;
                    return this;
                };
                this.setValues= function(newValue, oldValue) {
                    if (typeof(newValue)=="number"&&isNaN(newValue)) this.values[this.itemName]=""; else this.values[this.itemName] = newValue;
                    if (typeof(oldValue)=="number"&&isNaN(oldValue)) this.oldValues[this.itemName]=""; else this.oldValues[this.itemName] = oldValue;
                    return this;
                };
                this.isUNDEFNULL= function(){
                    var value=this.values[this.itemName],oldValue=this.oldValues[this.itemName];
                    return (value===undefined||value===null);
                };
                this.isZERO= function(){
                    var value=this.values[this.itemName],oldValue=this.oldValues[this.itemName];
                    return (value!==undefined&&value!==null&&value===0);
                };
                this.isUNDEFNULLZERO= function(){
                    var value=this.values[this.itemName],oldValue=this.oldValues[this.itemName];
                    return (value===undefined||value===null||value===0);
                };
                this.isEMPTY= function(){
                    var value=this.values[this.itemName],oldValue=this.oldValues[this.itemName];
                    return (value===undefined||value===null||value.toString().trim()==="");
                };
                this.isEMPTYZERO= function(){
                    var value=this.values[this.itemName],oldValue=this.oldValues[this.itemName];
                    return (value===undefined||value===null||value==0||value.toString().trim()==="");
                };
                this.isChanged= function(){
                    var value=this.values[this.itemName],oldValue=this.oldValues[this.itemName];
                    return (value===undefined||value!==oldValue);
                };
            }
            function newChangedRowData(newRowData, oldRowData){
                var newInstance= {};
                newInstance["values"]= newRowData; newInstance["oldValues"]= oldRowData;
                newInstance.item= function(itemName){
                    var item=this[itemName];
                    if(!item) {
                        item= new ChangedData(itemName, this.values, this.oldValues);
                        this[itemName]=item;
                    }
                    return item;
                };
                newInstance.addItemData= function(itemName, newValues, oldValues){
                    var rowItemData=this[itemName];
                    if (!rowItemData) {
                        rowItemData=new ChangedData(itemName, newValues, oldValues);
                        this[itemName]=rowItemData;
                    }
                    return this;
                };
                for(var rowItemName in newRowData)
                    newInstance.addItemData(rowItemName, newRowData, oldRowData);
                return newInstance;
            }
            function newChangedRowsData(){
                var newInstance= [];
                newInstance.insertRowData= function(newRowData, oldRowData){
                    this.unshift(newChangedRowData(newRowData, oldRowData));
                };
                newInstance.addRowData= function(newRowData, oldRowData){
                    this.push(newChangedRowData(newRowData, oldRowData));
                };
                return newInstance;
            }

            var newChangedRowsData= newChangedRowsData();
            if (newRowData) newChangedRowsData.addRowData(newRowData, oldRowData);
            return newChangedRowsData;
        },
        onChangeRowsData: function(changedRowsData) {                                                                   //console.log("HTableEditable.onChangeRowsData changedRowsData=",changedRowsData);
            var thisInstance=this;
            var rowsCallback= function(i, changedRowsData, callUpdateContent) {
                var changedRowData=changedRowsData[i];
                if (!changedRowData) {
                    thisInstance.handsonTable.render();
                    thisInstance.onUpdateContent({changedRows:changedRowsData});
                    return;
                }
                setTimeout(function(){
                    rowsCallback(i+1, changedRowsData, callUpdateContent);                                              //console.log("HTableEditable.onChangeRowsData rowsCallback for change=",i+1);
                },1);
            };
            rowsCallback(0,changedRowsData,false);
            thisInstance.handsonTable.render();
        },

        //isChangeItemHasValue: function(changedRowData, itemName){
        //    var value = this.getChangeItemValue(changedRowData, itemName);
        //    if (value===undefined || value===null) return false;
        //    return true;
        //},
        //isChangeItemNumberValue: function(changedRowData, itemName){
        //    var value = this.getChangeItemValue(changedRowData, itemName);
        //    if ((undefined === value) || (null === value) || (value.toString().trim().length===0)) return false;
        //    if (typeof value == 'number') return !isNaN(value);
        //    return !isNaN(value - 0);
        //},
        //isChangeItemNumberNonZeroValue: function(changedRowData, itemName){
        //    var value = this.getChangeItemValue(changedRowData, itemName);
        //    if ((undefined === value) || (null === value) || (value.toString().trim().length===0)) return false;
        //    if (typeof value == 'number') return !isNaN(value) && value!==0;
        //    var dvalue = value - 0;
        //    return !isNaN(dvalue) && dvalue!==0;
        //},
        //setChangeItemIFNull: function(changedRowData, itemName, value){
        //    var changedValue = this.getChangeItemValue(changedRowData, itemName);
        //    if (changedValue===undefined || changedValue===null) changedRowData[itemName] = { newValue: value };
        //},
        //setChangeItemIFEmpty: function(changedRowData, itemName, value){
        //    var changedValue = this.getChangeItemValue(changedRowData, itemName);
        //    if (changedValue===undefined || changedValue===null || changedValue.toString().length===0)
        //        this.setChangeItem(changedRowData, itemName, value);
        //},
        //isChangedNoEmptyItemValue: function(changedRowData, itemName){
        //    var value = changedRowData[itemName];
        //    if (value!==undefined && value.newValue!==undefined
        //        && value.newValue!==null && value.newValue.toString().length>0) return true;
        //    return false;
        //},

        /*
         * params: {method=get/post , url, condition, data, consoleLog, callUpdateContent}
         */
        storeRowDataByURL: function(params, postCallback){
            if (!this.getRowIDName()) return;
            var rowData=params.data, storingData = {};
            for(var dataItem in rowData)
                if (dataItem.indexOf("<!$")<0&&dataItem.indexOf("$!>")<0) storingData[dataItem] = rowData[dataItem];
            var thisInstance = this;                                                                                    //console.log("HTableEditable storeRowDataByURL storingData=",storingData,params.callUpdateContent);
            Request.postJSONData({url:params.url,condition:params.condition,data:storingData, consoleLog:true}
                ,function(success,result){
                    if(!success){
                        rowData["<!$error$!>"]= "Нет связи с сервером!";
//                        instance.setErrorsCommentsForRow(storeRow,resultItem);
                        if(postCallback) postCallback(success,result,rowData);
                        return;
                    }
                    var resultItem = result["resultItem"], updateCount = result["updateCount"], error = result["error"], errors={};
                    if(!resultItem) errors['<!$error_resultItem$!>']="Не удалось получить результат операции с сервера!";
                    if(!error&&updateCount>0){
                        thisInstance.updateRowData(rowData, resultItem,
                            {editPropValue:false, addData:errors, callUpdateContent:params.callUpdateContent} );
                        if(postCallback) postCallback(success,result,rowData);
                        return;
                    }
                    if(error) {
                        errors["<!$error$!>"] = error; console.log("HTableEditable.storeRowDataByURL resultItem ERROR! error=",error);/*!!!TEST LOG!!!*/
                    }
                    if(!updateCount>0) errors["<!$error_updateCount$!>"]= "Данные не были сохранены на сервере!";
                    thisInstance.updateRowData(rowData, resultItem,
                        {editPropValue:true, addData:errors, callUpdateContent:params.callUpdateContent} );             //console.log("HTableEditable.storeRowDataByURL resultItem=",resultItem);
                    //instance.setErrorsCommentsForRow(storeRow,storeRowData);
                    if (postCallback) postCallback(success,result,rowData);
                })
        },
        /*
         * params: {method=get/post , url, condition, consoleLog}
         */
        storeSelectedRowDataByURL: function(params){
            if (!params || !this.getSelectedRow()) return;
            params.data= this.getSelectedRow();
            if (!this.isRowEditable(params.data)) return;
            params.callUpdateContent= true;
            this.storeRowDataByURL(params);
        },
        /*
         * params: {method=get/post , url, condition, rowsData, consoleLog}
         */
        storeRowsDataByURL: function(params){                                                                           //console.log("HTableEditable storeRowsDataByURL rowsData=",params.rowsData);
            if (!params || !params.rowsData) return;
            var storingRowData=[];
            for(var rowInd in params.rowsData){
                var rowData=params.rowsData[rowInd];
                if (this.isRowEditable(rowData)) storingRowData[storingRowData.length]=rowData;
            }
            params.callUpdateContent=false;
            var thisInstance= this;
            var storeRowDataCallback= function(rowInd){
                params.data=storingRowData[rowInd];
                if (params.data) {
                    thisInstance.storeRowDataByURL(params,
                        /*postCallback*/function(){
                            storeRowDataCallback(rowInd+1);
                        });
                    return
                }
                thisInstance.setSelection();
                thisInstance.onUpdateContent({changedRows:storingRowData});
            };
            storeRowDataCallback(0);
        },
        /*
         * params: {method=get/post , url, condition, data, consoleLog, callUpdateContent}
         */
        deleteRowDataByURL: function(params, postCallback){
            if (!params.data || !this.getRowIDName()) return;
            var rowData=params.data, rowIDName=this.getRowIDName(), deletingRowIDValue=rowData[rowIDName];
            if (deletingRowIDValue===undefined||deletingRowIDValue===null) {
                console.log("HTableEditable.deleteRowDataByURL ERROR! NO ROW ID VALUE!");/*!!!TEST LOG!!!*/
                return;
            }
            var deletingData = {};
            deletingData[rowIDName]=deletingRowIDValue;
            var thisInstance = this;                                                                                    //console.log("HTableEditable deleteRowDataByURL ",params.data);
            Request.postJSONData({url:params.url,condition:params.condition,data:deletingData, consoleLog:true},
                function(success,result){
                    if(!success){
                        rowData["<!$error$!>"]= "Нет связи с сервером!";
//                        instance.setErrorsCommentsForRow(storeRow,resultItem);
                        if(postCallback) postCallback(success,result,rowData);
                        return;
                    }
                    var resultItem = result["resultItem"], updateCount = result["updateCount"], error = result["error"], errors={};
                    if(!resultItem) errors['<!$error_resultItem$!>']="Не удалось получить результат операции с сервера!";
                    if(!error&&updateCount>0&&resultItem){
                        var deletedRowIDValue=resultItem[rowIDName];
                        if(deletingRowIDValue===deletedRowIDValue) {
                            thisInstance.deleteRow(rowData,{callUpdateContent:params.callUpdateContent});//this call onUpdateContent
                            return;
                        }
                        errors['<!$error_resultItemID$!>']="Не удалось получить корректный результат операции с сервера!";
                        if(postCallback) postCallback(success,result,rowData);
                        return;
                    }
                    if(error) {
                        errors["<!$error$!>"] = error; console.log("HTableEditable.deleteRowDataByURL resultItem ERROR! error=",error);/*!!!TEST LOG!!!*/
                    }
                    if(!updateCount>0) errors["<!$error_updateCount$!>"]= "Данные не были удалены на сервере!";
                    thisInstance.updateRowData(rowData, rowData,
                        {editPropValue:false, addData:errors, callUpdateContent:params.callUpdateContent} );
                    //instance.setErrorsCommentsForRow(storeRow,storeRowData);
                    if (postCallback) postCallback(success,result,rowData);
                })
        },
        /*
         * params: {method=get/post , url, condition, consoleLog}
         */
        deleteSelectedRowDataByURL: function(params){
            if (!params || !this.getRowIDName() || !this.getSelectedRow()) return;
            params.data= this.getSelectedRow();
            var rowIDValue=params.data[this.getRowIDName()];
            if (rowIDValue===null||rowIDValue===undefined) {                                                            //console.log("HTableEditable.deleteSelectedRowDataByURL params=",params);
                this.deleteRow(params.data);//this call onUpdateContent
                return;
            }
            params.callUpdateContent= true;
            this.deleteRowDataByURL(params);//this call onUpdateContent
        }
    });
});