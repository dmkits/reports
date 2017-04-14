/**
 * Created by dmkits on 18.12.16.
 */
define(["dojo/_base/declare", "app", "templateDocumentBase", "hTableSimpleFiltered"],
    function(declare, APP, DocumentBase, HTable) {
        return declare("TemplateDocumentSimpleTable", [DocumentBase], {
            /*
            * args: {titleText, dataURL, dataURLAction, buttonUpdate, buttonPrint, printFormats={ ... } }
            * default:
            * buttonUpdate=true, buttonPrint=true, printFormats={ numericFormat:"0,000,000.[00]", dateFormat:"DD.MM.YY", currencyFormat:"0,000,000.[00]" }
            * */
            constructor: function(args,parentName){
                this.srcNodeRef = document.getElementById(parentName);
                declare.safeMixin(this,args);
                if (this.buttonUpdate===undefined) this.buttonUpdate= true;
                if (this.buttonPrint===undefined) this.buttonPrint= true;
                if (this.printFormats===undefined) this.printFormats= { numericFormat:"0,000,000.[00]", dateFormat:"DD.MM.YY", currencyFormat:"0,000,000.[00]" };
                if (this.detailContentErrorMsg===undefined) this.detailContentErrorMsg="Failed get data!";
            },

            postCreate: function(){
                this.topContent = this.setChildContentPaneTo(this, {region:'top'}, "margin:0;padding:0;border:none");
                var topTable = this.addTableTo(this.topContent.containerNode);
                this.topTableRow = this.addRowToTable(topTable);
                var topTableHeaderCell = this.addLeftCellToTableRow(this.topTableRow,1);
                this.topTableErrorMsg= this.topTableRow.children[this.topTableRow.children.length-1];
                var topHeader = document.createElement("h1");
                topHeader.appendChild(document.createTextNode(this.titleText));
                topTableHeaderCell.appendChild(topHeader);
                this.detailContentHTable =
                    new HTable({region:'center',style:"margin:0;padding:0;", readOnly:true, wordWrap:true, useFilters:true /*,allowFillHandle:false,*/});
                this.addChild(this.detailContentHTable);
                var instance = this;
                this.detailContentHTable.onUpdateContent = function(){ instance.onUpdateDetailContent(); }
                this.detailContentHTable.onSelect = function(firstSelectedRowData, selection){
                    this.setSelection(firstSelectedRowData, selection);
                    instance.onSelectDetailContent(firstSelectedRowData, selection);
                };
            },
            setDetailContent: function(){
                var condition = {};
                if(this.dataURLAction) condition["action"]=this.dataURLAction;
                if (this.beginDateBox) condition[this.beginDateBox.conditionName] =
                    this.beginDateBox.format(this.beginDateBox.get("value"),{selector:"date",datePattern:"yyyy-MM-dd"});
                if (this.endDateBox) condition[this.endDateBox.conditionName] =
                    this.endDateBox.format(this.endDateBox.get("value"),{selector:"date",datePattern:"yyyy-MM-dd"});
                var topTableErrorMsg= this.topTableErrorMsg, detailContentErrorMsg=this.detailContentErrorMsg;
                this.loadDetailContent(this.detailContentHTable, this.dataURL,condition, topTableErrorMsg, detailContentErrorMsg);
            },
            setLoadDetailContent: function(loadDetailContentCallback){
                if (loadDetailContentCallback) this.loadDetailContent= loadDetailContentCallback;
                return this;
            },
            loadDetailContent: function(detailContentHTable, url, condition, topTableErrorMsg, detailContentErrorMsg){
                detailContentHTable.setContentFromUrl({url:url,condition:condition},
                    function(success,result){
                        if (!success || (success&&result.error)) topTableErrorMsg.innerHTML= "<b style='color:red'>"+detailContentErrorMsg+"</b>";
                        else topTableErrorMsg.innerHTML="";
                    });
            },
            setDetailContentErrorMsg: function(detailContentErrorMsg){
                this.detailContentErrorMsg= detailContentErrorMsg;
                return this;
            },
            getDetailContent: function(){
                return this.detailContentHTable.getContent();
            },
            getDetailContentSelectedRow: function(){
                return this.detailContentHTable.getSelectedRow();
            },
            getDetailContentItemSum: function(tableItemName){
                return this.detailContentHTable.getContentItemSum(tableItemName);
            },
            onUpdateDetailContent: function(){
                if (!this.totals) return;
                for(var tableItemName in this.totals){
                    var totalBox = this.totals[tableItemName];
                    totalBox.updateValue();
                }
                if (this.infoPane&&this.infoPane.updateCallback) this.infoPane.updateCallback(this.infoPane, this);
            },
            onSelectDetailContent: function(firstSelectedRowData, selection){
                if (this.infoPane&&this.infoPane.updateCallback) this.infoPane.updateCallback(this.infoPane, this);
            },

            setBeginDateBox: function(labelText, conditionName, initValueDate){
                if (initValueDate===undefined||initValueDate===null) initValueDate= APP.curMonthBDate();
                this.beginDateBox= this.addTableCellDateBoxTo(this.topTableRow,
                    {labelText:labelText, labelStyle:"margin-left:5px;", cellWidth:110, cellStyle:"text-align:right;",
                        inputParams:{conditionName:conditionName}, initValueDate:initValueDate});
                var instance = this;
                this.beginDateBox.onChange = function(){
                    instance.setDetailContent();
                };
                return this;
            },
            setEndDateBox: function(labelText, conditionName, initValueDate){
                if (initValueDate===undefined||initValueDate===null) initValueDate= APP.today();
                this.endDateBox= this.addTableCellDateBoxTo(this.topTableRow,
                    {labelText:labelText, labelStyle:"margin-left:5px;", cellWidth:110, cellStyle:"text-align:right;",
                        inputParams:{conditionName:conditionName}, initValueDate:initValueDate});
                var instance = this;
                this.endDateBox.onChange = function(){
                    instance.setDetailContent();
                };
                return this;
            },
            setBtnUpdate: function(width, labelText){
                if (width===undefined) width=200;
                if (!labelText) labelText="Обновить";
                this.btnUpdate= this.addTableCellButtonTo(this.topTableRow, {labelText:labelText, cellWidth:width, cellStyle:"text-align:right;"});
                var instance= this;
                this.btnUpdate.onClick = function(){
                    instance.setDetailContent();
                };
                return this;
            },
            setBtnPrint: function(width, labelText, printFormats){
                if (width===undefined) width=100;
                if (!this.btnUpdate) this.setBtnUpdate(width);
                if (!labelText) labelText="Печатать";
                this.btnPrint= this.addTableCellButtonTo(this.topTableRow, {labelText:labelText, cellWidth:1, cellStyle:"text-align:right;"});
                var instance = this;
                this.btnPrint.onClick = function(){
                    instance.doPrint();
                };
                return this;
            },

            setTotalContent: function(){
                if (!this.totalContent) {
                    this.totalContent = this.setChildContentPaneTo(this, {region:'bottom',style:"margin:0;padding:0;border:none;"});
                    this.totalTable = this.addTableTo(this.totalContent.containerNode);
                    this.addTotalRow();
                }
                return this;
            },
            addTotalRow: function(){
                this.totalTableRow = this.addRowToTable(this.totalTable);
                if (!this.totalTableData) this.totalTableData= [];
                this.totalTableData[this.totalTableData.length]= [];
                return this;
            },
            setTotalEmpty: function(width){
                this.setTotalContent();
                this.addLeftCellToTableRow(this.totalTableRow, width);
                var totalTableRowData= this.totalTableData[this.totalTableData.length-1];
                totalTableRowData[totalTableRowData.length]= null;
                return this;
            },
            setTotalText: function(text, width){
                this.setTotalContent();
                var totalTableCell = this.addLeftCellToTableRow(this.totalTableRow, width);
                //var totalTableCellDiv = document.createElement("div");
                //totalTableCellDiv.setAttribute("style","width:"+width+"px");
                //totalTableCell.appendChild(totalTableCellDiv);
                if (text) totalTableCell.appendChild(document.createTextNode(text));
                return this;
            },
            setTotalNumberBox: function(labelText, tableItemName, width, boldfont, inputWidth){
                this.setTotalContent();
                if (inputWidth==undefined) inputWidth=70;
                var boldFontStyle="";
                if (boldfont) boldFontStyle = "font-weight: bold";
                var totalNumberTextBox= this.addTableCellNumberTextBoxTo(this.totalTableRow,
                    {labelText:labelText, labelStyle:boldFontStyle, cellWidth:width, cellStyle:"text-align:right;",
                        inputStyle:"text-align:right;width:"+inputWidth+"px;"+boldFontStyle,
                        inputParams:{readOnly:true, labelText:labelText,width:inputWidth,boldFont:boldfont, constraints:{pattern:"#,###,###,##0.00"}} });
                if (!this.totals) this.totals = {};
                this.totals[tableItemName]= totalNumberTextBox;
                var totalTableRowData= this.totalTableData[this.totalTableData.length-1];
                totalTableRowData[totalTableRowData.length]= totalNumberTextBox;
                return totalNumberTextBox;
            },
            setTotalCount: function(labelText, width, boldfont, inputWidth){
                var totalNumberTextBox= this.setTotalNumberBox(labelText, "TableRowCount", width, boldfont, inputWidth);
                var thisInstance = this;
                totalNumberTextBox.updateValue = function(){
                    this.set("value", thisInstance.getDetailContent().length);
                };
                return this;
            },
            setTotalCountBoldfont: function(labelText, width){
                return this.setTotalCount(labelText, width, true);
            },
            setTotalSum: function(labelText, tableItemName, width, boldfont){
                var totalNumberTextBox= this.setTotalNumberBox(labelText, tableItemName, width, boldfont);
                var thisInstance = this;
                totalNumberTextBox.updateValue = function(){
                    this.set("value", thisInstance.getDetailContentItemSum(tableItemName));
                };
                return this;
            },
            setTotalSumBoldfont: function(labelText, tableItemName, width){
                return this.setTotalSum(labelText, tableItemName, width, true);
            },

            setPopupMenuItem: function(itemID, itemName, callback){
                this.detailContentHTable.setMenuItem(itemID, itemName, callback);
                return this;
            },

            setInfoPane: function(width, updateInfoPaneCallback){
                if (!this.infoPane) {
                    if (width===undefined) width=100;
                    this.infoPane = this.setChildContentPaneTo(this, {region:'right'}, "height:100%;width:"+width+"px;");
                    this.addChild(this.infoPane);
                    if (updateInfoPaneCallback) this.infoPane.updateCallback = updateInfoPaneCallback;
                }
                return this;
            },

            startUp: function(){
                if (this.buttonUpdate!=false&&!this.btnUpdate) this.setBtnUpdate();
                if (this.buttonPrint!=false&&!this.btnPrint) this.setBtnPrint();
                this.setDetailContent();
                return this;
            },

            doPrint: function(printData, printFormats){
                var printData = {};
                printData.header= [];
                var printDataHeaderTitle= [];
                printData.header[0]= printDataHeaderTitle;
                if (this.titleText) {
                    this.addPrintDataTextTo(printDataHeaderTitle, this.titleText, 0, "width:100%;font-size:14px;font-weight:bold;text-align:center;");
                }
                var printDataHeader= [];
                printData.header[1]= printDataHeader;
                this.addPrintDataEmptyTo(printDataHeader);
                if (this.beginDateBox||this.endDateBox)
                    this.addPrintDataTextTo(printDataHeader, "Период:",80,"text-align:right;");
                if (this.beginDateBox)
                    this.addPrintDataCellTo(printDataHeader,"с ",this.beginDateBox.get("value"),"date",100);
                if (this.endDateBox)
                    this.addPrintDataCellTo(printDataHeader,"по ",this.endDateBox.get("value"),"date",100);
                this.addPrintDataEmptyTo(printDataHeader);

                printData.columns = this.detailContentHTable.getColumns();
                printData.data = this.detailContentHTable.getContent();

                if (this.totals){
                    printData.total= [];
                    for(var tRowIndex in this.totalTableData){
                        var tRowData= this.totalTableData[tRowIndex];
                        var printDataTotalRow= [];
                        printData.total[printData.total.length]= printDataTotalRow;
                        for(var tCellIndex in tRowData){
                            var tCellData= tRowData[tCellIndex];
                            if (tCellData===null) this.addPrintDataEmptyTo(printDataTotalRow);
                            if (tCellData!==null) {
                                var style="font-size:12px;";
                                if (tCellData.boldFont) style="font-size:14px;font-weight:bold;";
                                this.addPrintDataCellTo(printDataTotalRow,tCellData.labelText,tCellData.get("value"),"numeric",tCellData.width,70,style);
                            }
                        }
                    }
                }
                this.setPrintDataFormats(printData, printFormats);
                var printWindow= window.open("/print/printSimpleDocument");                                             //console.log("doPrint printWindow printData=",printData);
                printWindow["printTableContentData"]= printData;
            }
        });
    });


