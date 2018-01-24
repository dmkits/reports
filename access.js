
var getDBConnectError= require("./dataBase").getDBConnectError;
var database=require("./dataBase");
var path=require('path');

module.exports= function(app){

    app.use(function (req, res, next) {                                   console.log("ACCESS CONTROLLER req.originalUrl=",req.originalUrl);

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
        if(req.cookies && req.cookies.lpid){
            var userLpid=req.cookies.lpid;
            database.getLPID(userLpid, function(err, lpid){
                if(err){
                    console.log("err=",err);
                    return;
                }
                if(lpid && lpid==userLpid){
                    next();
                    return;
                }
                res.sendFile(path.join(__dirname,"views/login.html"));
            });
            return;
        }
        if(!req.cookies||!req.cookies.lpid){
            res.sendFile(path.join(__dirname,"views/login.html"));
            return;
        }
        next();
    });
};