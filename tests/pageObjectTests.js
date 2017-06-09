var fs=require('fs');

var stringConfig=fs.readFileSync('./test.cfg','utf8');
var dbConfig = JSON.parse(stringConfig);
var dbServer=dbConfig.server;
var dbPort=dbConfig.port;
var dbName=dbConfig.database;
var dbUser=dbConfig.user;
var dbPassword=dbConfig.password;
var reportsConfig=dbConfig['reports.config']?dbConfig['reports.config']:"";


module.exports={
    'Sysadmin Header Tests': function (browser) {
        var mainHeader = browser.page.sysadminHeader();
        mainHeader.navigate()
            .waitForElementVisible('body', 1000)
            //.assert.visible("@img")
            //.assert.title('REPORTS')
            //.assert.containsText('@mode', "MODE:test")
            //.assert.containsText('@port', "PORT:8181")
            //.assert.containsText('@dbName', "DB NAME:"+dbName)
            //.assert.containsText('@dbConnectionState', 'Connected')
            //.assert.containsText('@user', "USER:"+dbUser)
            //.assert.visible('@SpartUpParamsBtn')
            //.assert.visible('@ReportsConfigBtn')
          //  .click('@SpartUpParamsBtn');
    },
    //'Sysadmin Startup params Tests': function (browser) {
    //    var paramsPage = browser.page.startUpParams();
    //    var mainHeader=browser.page.sysadminHeader();
    //
    //    paramsPage
    //        .waitForElementVisible('@pageContent',1000)
    //        .assert.containsText('@pageContent','system startup parameters:')
    //        .waitForElementVisible('@localConfigInfo',1000, true, function(){
    //            browser.pause(2000, function(){
    //                paramsPage.assert.containsText('@localConfigInfo', "Configuration loaded.")
    //            });
    //        })
    //    .click('@loadSettingsBtn', function(){
    //            browser.pause(1000, function(){
    //                paramsPage.assert.containsText('@localConfigInfo', "Configuration reloaded.")
    //            });
    //        })
    //        .waitForElementVisible('@dbServer', 2000)
    //        .assert.valueContains('@dbServer',dbServer)
    //        .waitForElementVisible('@dbPort', 2000)
    //        .assert.valueContains('@dbPort',dbPort)
    //        .waitForElementVisible('@dbName', 2000)
    //        .assert.valueContains('@dbName',dbName)
    //        .waitForElementVisible('@dbUser', 2000)
    //        .assert.valueContains('@dbUser',dbUser)
    //        .waitForElementVisible('@dbPassword', 2000)
    //        .assert.valueContains('@dbPassword',dbPassword)
    //        .waitForElementVisible('@repoConfig', 2000)
    //        .assert.valueContains('@repoConfig',reportsConfig)
    //
    //        .waitForElementVisible('@dbServer', 2000)
    //        .clearValue('@dbServer', function () {
    //          //  paramsPage.assert.valueContains('@dbServer', '')
    //              paramsPage.setValue('@dbServer', '192.168.0.93_false', function () {
    //                    var mainHeader=browser.page.sysadminHeader();
    //                    paramsPage
    //                        .click('@StoreAndReconnectBtn', function(){
    //                            browser.pause(6000, function(){
    //                                paramsPage.assert.containsText('@localConfigInfo', "Configuration saved.")
    //                                    .assert.containsText('@localConfigInfo', "Failed to connect to database!")
    //                            });
    //                        });
    //                    mainHeader
    //                        .waitForElementVisible('@dbConnectionState', 1000)
    //                        .assert.containsText("@dbConnectionState","Failed to connect to database!");
    //                });
    //        })
    //        .resetDBConfig()
    //        .waitForElementVisible('@dbName', 1000)
    //        .clearValue('@dbName', function () {
    //            //  paramsPage.assert.valueContains('@dbServer', '')
    //            paramsPage.setValue('@dbName', 'GMSSample38xml_false', function () {
    //                var mainHeader=browser.page.sysadminHeader();
    //                paramsPage
    //                    .click('@StoreAndReconnectBtn', function(){
    //                        browser.pause(1000, function(){
    //                            paramsPage.assert.containsText('@localConfigInfo', "Configuration saved.")
    //                                .assert.containsText('@localConfigInfo', "Failed to connect to database!")
    //                        });
    //                    });
    //                mainHeader.waitForElementVisible('@dbName', 1000)
    //                    .assert.containsText("@dbName","GMSSample38xml_false")
    //                    .waitForElementVisible('@dbConnectionState', 1000)
    //                    .assert.containsText("@dbConnectionState","Failed to connect to database!");
    //            });
    //        })
    //        .resetDBConfig()
    //        .waitForElementVisible('@dbUser', 1000)
    //        .clearValue('@dbUser', function () {
    //            paramsPage.assert.valueContains('@dbUser', '')
    //                .setValue('@dbUser', 'sa1', function () {
    //                    var mainHeader=browser.page.sysadminHeader();
    //                    paramsPage.assert.valueContains('@dbUser', 'sa1')
    //                              .click('@StoreAndReconnectBtn');
    //                    mainHeader.waitForElementVisible('@user', 1000);
    //                    browser.pause(1000);
    //                    mainHeader .assert.containsText("@user","sa1")
    //                        .waitForElementVisible('@dbConnectionState', 1000)
    //                        .assert.containsText("@dbConnectionState","Failed to connect to database!");
    //                });
    //        })
    //        .resetDBConfig()
    //        .waitForElementVisible('@dbPassword', 1000)
    //        .clearValue('@dbPassword', function () {
    //            paramsPage.assert.valueContains('@dbPassword', '')
    //                .setValue('@dbPassword', 'false', function () {
    //                    var mainHeader=browser.page.sysadminHeader();
    //                    paramsPage.assert.valueContains('@dbPassword', 'false')
    //                        .click('@StoreAndReconnectBtn');
    //                    mainHeader
    //                        .waitForElementVisible('@dbConnectionState', 1000)
    //                        .assert.containsText("@dbConnectionState","Failed to connect to database!");
    //                });
    //        })
    //    .resetDBConfig();
    //
    //},


    'Sysadmin Reports Config Tests': function (browser) {
        var mainHeader = browser.page.sysadminHeader();
        var reportsConfig=browser.page.reportsConfig();
        var today=new Date();
        mainHeader.click('@ReportsConfigBtn');
        reportsConfig
            .waitForElementVisible('@topFileName', 1000)
            .assert.containsText('@topFileName', 'reports_list')
            .waitForElementVisible('@topRunBtn', 1000)
            .assert.containsText('@topRunBtn', "Run")
            .waitForElementVisible('@topSaveBtn', 1000)
            .assert.containsText('@topSaveBtn', "Save") //topParams
            .assert.hidden('@topParams')
            .waitForElementVisible('@JSONContent', 1000)
            .assert.valueContains('@JSONContent', getJSONContentForID('reports_list'))

            .click('@leftBtnPcats', function(){
                reportsConfig.assert.valueContains('@JSONContent', getJSONContentForID('sales_by_pcats'))
                    .assert.valueContains('@SQLContent', getSQLContentForID('sales_by_pcats'))
                    .assert.containsText('@topFileName', 'sales_by_pcats')
                    .checkDateParams()
            })

            .click('@leftBtnProds', function(){
                reportsConfig.assert.valueContains('@JSONContent', getJSONContentForID('sales_by_prods'))
                    .assert.valueContains('@SQLContent', getSQLContentForID('sales_by_prods'))
                    .assert.containsText('@topFileName', 'sales_by_prods')
                    .checkDateParams()
            })

            .click('@leftBtnDays', function () {
                reportsConfig.assert.valueContains('@JSONContent', getJSONContentForID('sales_by_days'))
                    .assert.valueContains('@SQLContent', getSQLContentForID('sales_by_days'))
                    .assert.containsText('@topFileName', 'sales_by_days')
                    .checkDateParams()
                    .click('@topSaveBtn', function(){
                        reportsConfig
                            .assert.visible('@dialogWindow') //submitBtn
                            .assert.containsText('@dialogWindow', "Сохранить изменеия в файл?")
                            .assert.visible('@closeDialog')
                            //.click('@closeDialog', function(){
                            //    reportsConfig.assert.elementNotPresent('@dialogWindow')
                            //})
                            .click('@submitBtn',function(){
                                //browser.pause(2000, function(){
                                //    reportsConfig.assert.containsText('@topSavedFilesInfo','ReportID: sales_by_days Result: Config SAVED, SQL SAVED')
                                //})
                                reportsConfig.waitForElementVisible('@topFileName', 1000, function(){
                                    reportsConfig.assert.valueContains('@topSavedFilesInfo','ReportID')
                                })
                            });
                    })
            });








        browser.end();
    }
};

function getJSONContentForID(id) {
    var strContent = fs.readFileSync("./reportsConfigForTests/" + id + ".json",'utf-8');
    return strContent;
}

function getSQLContentForID(id) {
    var strContent = fs.readFileSync("./reportsConfigForTests/" + id + ".sql",'utf-8');
    return strContent;
}