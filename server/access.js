
var database=require("./dataBase");
var common=require("./common");
var path=require('path');
var logger=require('./logger')();

module.exports= function(app) {

    var reqIsJSON = function (headers) {
        return (headers && headers["x-requested-with"] && headers["x-requested-with"] == "application/json; charset=utf-8")
    };
    var reqIsAJAX = function (headers) {
        return (headers && headers["content-type"] == "application/x-www-form-urlencoded" && headers["x-requested-with"] == "XMLHttpRequest");
    };

    app.use(function (req, res, next) {   logger.info("ACCESS CONTROLLER  req.path=", req.path, " params:",req.query,{});
        if (req.originalUrl.indexOf("/login") >= 0) {
            next();
            return;
        }
        if (req.cookies.lpid) {
            var sysAdminAccess = false;
            var sysAdminLogin = null;
            var sysAdminLPIDObj = common.getSysAdminLPIDObj();
            var properties = Object.keys(sysAdminLPIDObj);
            for (var i in properties) {
                if (sysAdminLPIDObj[properties[i]] == req.cookies.lpid) {
                    sysAdminAccess = true;
                    sysAdminLogin = properties[i];
                }
            }
            if (sysAdminAccess) {
                req.isSysadmin= true;
                req.userRoleCode="sysadmin";
                req.loginEmpName="sysadmin ("+sysAdminLogin+")";
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
            if (app.DBConnectError) {
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
                    errorReason: "Не удалось обратиться к базе данных!"
                });
                return;
            }
            database.selectParamsMSSQLQuery("select Login, EmpName, ShiftPostID, EmpID  from r_Emps where LPID=@LPID",
                {LPID:req.cookies.lpid}, function (err, result) {
                if (err) {
                    res.send({error: err});
                    logger.error(err);
                    return;
                }
                var result=result[0];
                if (!result || !result.Login) {
                    if (reqIsJSON(req.headers) || reqIsAJAX(req.headers)) {
                        res.send({error: "Failed to get data! Reason: unknown user!", userErrorMsg: "Неизвестный пользователь."});
                        return;
                    }
                    res.sendFile(path.join(__dirname, '../pages', 'login.html'));
                    return;
                }
                req.userRoleCode=result.ShiftPostID;
                req.userID=result.EmpID;
                req.loginEmpName=result.EmpName;
                if(result.ShiftPostID==1) req.isAdminUser= true;
                else req.isAdminUser= false;
                next();
            });
            return;
        }
        if (app.DBConnectError) {
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
                errorReason: "Не удалось обратиться к базе данных!"
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