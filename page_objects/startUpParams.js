var fs=require('fs');
var stringConfig=fs.readFileSync('./test.cfg','utf8');
var dbConfig = JSON.parse(stringConfig);
var dbServer=dbConfig.server;
var dbPort=dbConfig.port;
var dbName=dbConfig.database;
var dbUser=dbConfig.user;
var dbPassword=dbConfig.password;
var reportsConfig=dbConfig['reports.config']?dbConfig['reports.config']:"";
var startUpParamsCommands = {
    resetDBConfig: function () {
        var instance=this;
        this.api.pause(1000);
        return instance.waitForElementVisible('@dbServer',1000)
            .waitForElementVisible('@dbPort',1000)
            .waitForElementVisible('@dbName',1000)
            .waitForElementVisible('@dbUser',1000)
            .waitForElementVisible('@dbPassword',1000)
            .waitForElementVisible('@repoConfig',1000)
            .clearValue('@dbServer', function () {
                instance.setValue('@dbServer', dbServer);
            })
            .clearValue('@dbPort', function () {
                instance.setValue('@dbPort', dbPort);
            })
            .clearValue('@dbName', function () {
                instance.setValue('@dbName', dbName)
            })
            .clearValue('@dbUser', function () {
                instance.setValue('@dbUser', dbUser)
            })
            .clearValue('@dbPassword', function () {
                instance.setValue('@dbPassword', dbPassword)
            })
            .clearValue('@repoConfig', function () {
                instance.setValue('@repoConfig', reportsConfig);
            })
            .click('@StoreAndReconnectBtn');
    }
};

module.exports={
    commands:[startUpParamsCommands],
    elements:{
        pageContent:'#sa_startup_params_PageContent',
        dbServer:'input[id="db.server"]',
        dbPort:'input[id="db.port"]',
        dbName:'input[id="db.name"]',
        dbUser:'input[id="db.user"]',
        dbPassword:'input[id="db.password"]',
        repoConfig:'input[id="reports.config"]',
        loadSettingsBtn:"#SA_startup_params_BtnAppLocalConfigLoad",
        StoreAndReconnectBtn:'#SA_startup_params_BtnAppLocalConfigSaveAndReconnect',
        localConfigInfo:'#sa_startup_params_appLocalConfig'
    }
};
