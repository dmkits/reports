
var getDBConnectError= require("./dataBase").getDBConnectError;
var database=require("./dataBase");
var path=require('path');
var fs=require('fs');

module.exports= function(app){

    var reqIsJSON= function(headers){
        return(headers&&headers["x-requested-with"]&& headers["x-requested-with"]=="application/json; charset=utf-8")
    };

    app.use(function (req, res, next) {                                                                      console.log("ACCESS CONTROLLER  req.path=",req.path);
        var dbConnectionError=getDBConnectError();
        if(dbConnectionError){
            var sysAdminAccess=false;
            if(req.cookies.noDbConnSysAdminAccess){
                sysAdminAccess=true;
            }else if(req.cookies.lpid){
                var sysAdminLPIDObj = getSysAdminLPIDObj();
                var properties = Object.keys(sysAdminLPIDObj);
                for (var i in properties) {
                    if (sysAdminLPIDObj[properties[i]] == req.cookies.lpid) {
                        sysAdminAccess=true;
                    }
                }
            }
            if(req.originalUrl.indexOf("/sysadmin")>-1 && sysAdminAccess) {
                 next();
                return;
            }
            if(req.originalUrl=="/login" && req.method=="POST"){
                var userName=req.body.user, userPswrd=req.body.pswrd;
                if(!userName ||! userPswrd ){
                    res.sendFile(path.join(__dirname,"views/login.html"));
                    return;
                }
                var sysAdminLoginDataArr=getSysAdminLoginDataArr();
                for(var i in sysAdminLoginDataArr){
                    if(sysAdminLoginDataArr[i].login==userName && sysAdminLoginDataArr[i].pswrd==userPswrd){
                        res.cookie("noDbConnSysAdminAccess", true);
                        res.redirect('/sysadmin');
                        return;
                    }
                }
                res.cookie("loginAsAdmin", '');
                var img= "imgs/girls_big.jpg";
                var title= "REPORTS";
                var icon32x32= "icons/profits32x32.jpg";
                res.render(path.join(__dirname,"views/dbFailed.ejs"),{title:title, bigImg:img,icon:icon32x32, errorReason:"Не удалось подключиться к базе данных!"} );
                return;
            }
            if(req.cookies.loginAsAdmin && req.originalUrl.indexOf("/login")<0){
                res.cookie("loginAsAdmin", '');
                res.sendFile(path.join(__dirname,"views/login.html"));
                return;
            }
            if(req.originalUrl.indexOf("/sysadmin")<0 && sysAdminAccess){
                res.redirect('/sysadmin');
                return;
            }
            if(!req.cookies.loginAsAdmin && req.originalUrl.indexOf("/login")<0){
                if(!reqIsJSON(req.headers)){
                    var img= "imgs/girls_big.jpg";
                    var title= "REPORTS";
                    var icon32x32= "icons/profits32x32.jpg";
                    res.render(path.join(__dirname,"views/dbFailed.ejs"),{title:title, bigImg:img,icon:icon32x32, errorReason:"Не удалось подключиться к базе данных!"} );
                    return;
                }
              res.send({error:"Failed to connect to database!",userErrorMsg:"Не удалось подключиться к базе данных."});
            }
            return;
        }
        if(req.cookies.noDbConnSysAdminAccess && !reqIsJSON(req.headers)){
            res.clearCookie("noDbConnSysAdminAccess");
            res.redirect(req.originalUrl);
            return;
        }
        if(req.originalUrl=="/login" && req.method=="POST"){
            var userName=req.body.user, userPswrd=req.body.pswrd;
            if(!userName ||! userPswrd ){
               res.sendFile(path.join(__dirname,"views/login.html"));
                return;
            }
            database.getPswdByLogin(userName,function(err,result){
                if(result&&result.LPAss && result.LPAss==userPswrd){
                    database.setPLIDForUserSession(result.EmpID, function(err,LPID){
                        if(err){
                            console.log("err=",err);
                            res.send({error:err});
                            return;
                        }
                        var sysAdminLoginDataArr=getSysAdminLoginDataArr();
                        for(var i in sysAdminLoginDataArr){
                            if(sysAdminLoginDataArr[i].login==userName){
                                if(sysAdminLoginDataArr[i].pswrd==userPswrd){
                                    var sysAdminLPIDObj = getSysAdminLPIDObj();
                                    sysAdminLPIDObj[userName]=LPID;
                                    writeSysAdminLPIDObj(sysAdminLPIDObj);
                                    break;
                                }
                               console.log("ERROR!!! Sysadmin passwords in DB and configuration file don't match! No sysadmin privileges was given to the user!");
                            }
                        }
                        res.cookie("lpid", LPID);
                        res.send({result:"success"});
                    })
                }else{
                    res.sendFile(path.join(__dirname,"views/login.html"));
                }
            });
            return;
        }
        if(req.cookies.lpid){
            var userLpid=req.cookies.lpid;
            database.getLPID(userLpid, function(err, lpid){
                if(err){
                    console.log("err=",err);
                    res.send({error:err});
                    return;
                }
                if(lpid && lpid==userLpid) {
                    var sysAdminLPIDObj = getSysAdminLPIDObj();
                    var properties = Object.keys(sysAdminLPIDObj);
                    for (var i in properties) {
                        if (sysAdminLPIDObj[properties[i]] == req.cookies.lpid) {
                            next();
                            return;
                        }
                    }
                    if (req.originalUrl.indexOf("/sysadmin") > -1) {
                        res.redirect('/');
                        return;
                    }
                    next();
                    return;
                }
                res.sendFile(path.join(__dirname, "views/login.html"));
            });
            return;
        }
        if(!req.cookies.lpid && !req.cookies.noDbConnSysAdminAccess && req.originalUrl.indexOf("/login")<0){
            res.sendFile(path.join(__dirname,"views/login.html"));
            return;
        }
        next();
    });
};

function getSysAdminLPIDObj(){
    try{
        var sysAdminsLPID=JSON.parse(fs.readFileSync(path.join(__dirname,"sysAdmins.json")));
    }catch(e){
        console.log("FAILED to get sysadmin LPID. Reason: ",e);
        return;
    }
    return sysAdminsLPID;
}
function getSysAdminLoginDataArr(){
    try{
        var sysAdminsPswrd=JSON.parse(fs.readFileSync(path.join(__dirname,"config.json")));
    }catch(e){
        console.log("FAILED to get sysadmin LPID. Reason: ",e);
        return;
    }
    return sysAdminsPswrd["sysAdmins"];
}
function writeSysAdminLPIDObj(sysAdminLPIDObj){
    fs.writeFile(path.join(__dirname,"sysAdmins.json"), JSON.stringify(sysAdminLPIDObj), function(err){
        if(err){
            console.log("err=",err);
        }
    })
}