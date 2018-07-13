var moment = require('moment');
var reportsConfigParams={
    checkDateParams:function(){
        var instance=this;
        this.api.pause(1000);
        return instance.assert.visible('@topBdateLabel')
            .assert.containsText('@topBdateLabel',"@BDATE")
            .assert.containsText('@topEdateLabel',"@EDATE")
            .assert.valueContains('@topBdateInput',  moment().startOf('year').format('YYYY-MM-DD'))
            .assert.valueContains('@topEdateInput',  moment().format('YYYY-MM-DD'))
    }
};

module.exports = {
    commands:[reportsConfigParams],
    elements: {
        topFileName: "#filename",
        topRunBtn: "#sqlRunBtn",
        topSaveBtn: "#sqlSaveBtn",
        topParams:"#sqlParamsTable",
        topBdateLabel:'label[for="BDATE"]',
        topEdateLabel:'label[for="EDATE"]',
        topBdateInput:'input[id="BDATE"]',
        topEdateInput:'input[id="EDATE"]',
        topSavedFilesInfo:'#savedFilesInfo',

        leftBtnList:"#reports_list",
        leftBtnPcats:"#sales_by_pcats",
        leftBtnProds:"#sales_by_prods",
        leftBtnDays:"#sales_by_days",

        JSONContent:"#jsonDisplayContent",
        SQLContent:"#sqlDisplayContent",

        queryResultContent:"#sql_queries_RightContent",

        dialogWindow:'div[class="dijitDialog"]',
        closeDialog:'span[class="dijitDialogCloseIcon"]',
        submitBtn:'input[type="submit"]',
        cancelBtn:'input[type="button"]'
    }
};
