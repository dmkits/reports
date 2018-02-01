
var getDBConnectError= require("./dataBase").getDBConnectError;
var database=require("./dataBase");
var path=require('path');
var fs=require('fs');

module.exports= function(app) {

    var reqIsJSON = function (headers) {
        return (headers && headers["x-requested-with"] && headers["x-requested-with"] == "application/json; charset=utf-8")
    };
    var reqIsAJAX = function (headers) {
        return (headers && headers["content-type"] == "application/x-www-form-urlencoded" && headers["x-requested-with"] == "XMLHttpRequest");
    };

    app.use(function (req, res, next) {
        console.log("ACCESS CONTROLLER  req.path=", req.path);
        var noDbConn = getDBConnectError();
        if (req.originalUrl.indexOf("/login") >= 0) {
            next();
            return;
        }
        if (req.cookies.lpid) {
            var sysAdminAccess = false;
            var sysAdminLPIDObj = getSysAdminLPIDObj();
            var properties = Object.keys(sysAdminLPIDObj);
            for (var i in properties) {
                if (sysAdminLPIDObj[properties[i]] == req.cookies.lpid) {
                    sysAdminAccess = true;
                }
            }
            if (sysAdminAccess) {
                req.isSysadmin= true;
                next();
                return;
            }
            if (req.originalUrl.indexOf("/sysadmin") >= 0) {
                if (reqIsJSON(req.headers) || reqIsAJAX(req.headers)) {
                    res.send({
                        error: "Failed to go to sysadmin page! No sysadmin permission was given to the user!",
                        userErrorMsg: "Отказано в доступе на страничку системного администратора. Причина: у пользователя нет полномочий."
                    });
                    return;
                }
                res.redirect('/');
                return;
            }
            if (noDbConn) {
                if (reqIsJSON(req.headers) || reqIsAJAX(req.headers)) {
                    res.send({
                        error: "Failed to connect to database!",
                        userErrorMsg: "Не удалось подключиться к базе данных."
                    });
                    return;
                }
                var img = "imgs/girls_big.jpg";
                var title = "REPORTS";
                var icon32x32 = "icons/profits32x32.jpg";
                res.render(path.join(__dirname, "../pages/dbFailed.ejs"), {
                    title: title,
                    bigImg: img,
                    icon: icon32x32,
                    errorReason: "Не удалось подключиться к базе данных!"
                });
                return;
            }

            database.getUserNameAndStateCodeByLpid(req.cookies.lpid, function (err, result) {
                if (err) {
                    res.send({error: err});
                    log.error(err);
                    return;
                }
                if (!result || !result.EmpName) {
                    if (reqIsJSON(req.headers) || reqIsAJAX(req.headers)) {
                        res.send({error: "Failed to get data! Reason: unknown user!", userErrorMsg: "Неизвестный пользователь."});
                        return;
                    }
                    res.sendFile(path.join(__dirname, '../pages', 'login.html'));
                    return;
                }
                if(result.ShiftPostID==1) req.isAdminUser= true;
                else req.isAdminUser= false;
                next();
            });
            return;
        }
        if (noDbConn) {
            if (reqIsJSON(req.headers) || reqIsAJAX(req.headers)) {
                res.send({
                    error: "Failed to connect to database!",
                    userErrorMsg: "Не удалось подключиться к базе данных."
                });
                return;
            }
            var img = "imgs/girls_big.jpg";
            var title = "REPORTS";
            var icon32x32 = "icons/profits32x32.jpg";
            res.render(path.join(__dirname, "../pages/dbFailed.ejs"), {
                title: title,
                bigImg: img,
                icon: icon32x32,
                errorReason: "Не удалось подключиться к базе данных!"
            });
            return;
        }
        if (reqIsJSON(req.headers) || reqIsAJAX(req.headers)) {
            res.send({
                error: "Failed to get data! Reason: user is not authorized!",
                userErrorMsg: "Не удалось плучить данные. Пользователь не авторизирован."
            });
            return;
        }
        res.sendFile(path.join(__dirname, '../pages', 'login.html'));
    });
};

function getSysAdminLPIDObj(){
    try{
        var sysAdminsLPID=JSON.parse(fs.readFileSync(path.join(__dirname,"../sysAdmins.json")));
    }catch(e){
        console.log("FAILED to get sysadmin LPID. Reason: ",e);
        return;
    }
    return sysAdminsLPID;
}
function getSysAdminLoginDataArr(){
    try{
        var sysAdminsPswrd=JSON.parse(fs.readFileSync(path.join(__dirname,"../config.json")));
    }catch(e){
        console.log("FAILED to get sysadmin LPID. Reason: ",e);
        return;
    }
    return sysAdminsPswrd["sysAdmins"];
}
function writeSysAdminLPIDObj(sysAdminLPIDObj) {
    fs.writeFile(path.join(__dirname, "../sysAdmins.json"), JSON.stringify(sysAdminLPIDObj), function (err) {
        if (err) {
            console.log("err=", err);
        }
    })
}