var async = require("async");
var mysql = require("mysql");
var util = require('../util');

module.exports = function (app, pool) {
    app.get("/info", function (req, res) {
        var result = {};
        pool.getConnection(function (err, conn) {
            var sql = "SELECT * from firetable;";
            conn.query(sql, function (err, rows) {
                var result = returnResult(err, res);
                if (rows) {
                    result.message = rows;
                }
                conn.release();
                result.status = res.statusCode;
                JSON.stringify(result);
                res.render('fire/index', {
                    info: rows
                });
            });
        });
    });

    app.get("/fire", function (req, res) {
        var result = {};
        pool.getConnection(function (err, conn) {
            var sql = "SELECT id, date_format(lifedate,'%Y-%m-%d') lifedate, date_format(regdate,'%Y-%m-%d') regdate from fireexp;";
            conn.query(sql, function (err, rows) {
                var result = returnResult(err, res);
                if (rows) {
                    result.message = rows;
                }
                conn.release();
                result.status = res.statusCode;
                JSON.stringify(result);
                res.render('fire/fire', {
                    rows: rows
                });
            });
        });
    });

    //온도, 가스 POST
    app.post("/postinfo", function (req, res) {
        var result = {};
        var temp = null;
        var gas = null;
        var verify = 0;
        async.waterfall([
                function (callback) {
                    temp = mysql.escape(parseFloat(req.body.temp));
                    gas = mysql.escape(parseFloat(req.body.gas));
                    verify = mysql.escape(req.body.verify);
                    callback();
                },
                function (callback) {
                    if (temp == undefined) {
                        callback(new Error("Temp is empty."));
                    } else if (gas == undefined) {
                        callback(new Error("Gas is empty"));
                    } else if (verify == undefined) {
                        callback(new Error("Verify is empty"));
                    } else {
                        if (temp >= 10 && gas >= 1000) {
                            verify = 1;
                        } else {
                            verify = 0;
                        }
                        pool.getConnection(function (err, conn) {
                            // title 정보를 DB에 넣기 위한 SQL문 준비
                            var sql = "INSERT INTO firetable (temp, gas, verify) VALUES (" + temp + ", " + gas + ", " + verify + ");";
                            console.log("SQL: " + sql);
                            conn.query(sql, function (err) {
                                if (err) {
                                    conn.release();
                                    callback(err);
                                } else {
                                    conn.release();
                                    callback();
                                }
                            });
                        });
                    }
                }
            ],
            function (err) {
                result = returnResult(err, res)
                result.status = res.statusCode;
                res.send(result);
            });
    });

    //온도, 가스 GET JSON 사이트
    app.get("/getinfo", function (req, res) {
        var result = {};
        pool.getConnection(function (err, conn) {
            var sql = "SELECT temp, gas from firetable order by num desc limit 1;";
            conn.query(sql, function (err, rows) {
                var result = returnResult(err, res);
                if (rows) {
                    result.message = rows;
                }
                conn.release();
                //result.status = res.statusCode;
                res.send(result);
            });
        });
    });

    //온도, 가스 VERIFY 사이트
    app.get("/verify", function (req, res) {
        var result = {};
        pool.getConnection(function (err, conn) {
            var sql = "SELECT verify from firetable order by num desc limit 1;";
            conn.query(sql, function (err, rows) {
                //var result = returnResult(err, res);
                if (rows) {
                    //result.message = rows;
                }
                conn.release();
                //result.status = res.statusCode;
                //result = util.JSONtoString(rows[0]);
                //JSON.parse(rows[0])["verify"];
                res.send(rows[0]);
            });
        });
    });

    //소화기 번호, 유통기한, 점검날짜 POST
    app.post("/postdate", function (req, res) {
        var result = {};
        var id = null;
        var lifedate = null;
        var regdate = null;
        async.waterfall([
                function (callback) {
                    id = mysql.escape(req.body.id);
                    lifedate = mysql.escape(req.body.lifedate);
                    regdate = mysql.escape(req.body.regdate);
                    callback();
                },
                function (callback) {
                    if (id == undefined) {
                        callback(new Error("Id is empty."));
                    } else if (lifedate == undefined) {
                        callback(new Error("Lifedate is empty"));
                    } else if (regdate == undefined) {
                        callback(new Error("Regdate is empty"));
                    } else {
                        pool.getConnection(function (err, conn) {
                            var sql = "INSERT INTO fireexp (id, lifedate, regdate) VALUES (" + id + ", " + lifedate + ", " + regdate + ");";
                            console.log("SQL: " + sql);
                            conn.query(sql, function (err) {
                                if (err) {
                                    conn.release();
                                    callback(err);
                                } else {
                                    conn.release();
                                    callback();
                                }
                            });
                        });
                    }
                }
            ],
            function (err) {
                result = returnResult(err, res)
                result.status = res.statusCode;
                res.send(result);
            });
    });

    //소화기 번호, 유통기한, 점검날짜 GET JSON 사이트
    app.get("/date", function (req, res) {
        var result = {};
        pool.getConnection(function (err, conn) {
            var sql = "SELECT id, date_format(lifedate,'%Y-%m-%d') lifedate, date_format(regdate,'%Y-%m-%d') regdate from fireexp;";
            conn.query(sql, function (err, rows) {
                var result = returnResult(err, res);
                if (rows) {
                    result.message = rows;
                }
                conn.release();
                //result.status = res.statusCode;
                res.send(result);
            });
        });
    });

    //소화기 번호, 유통기한, 점검날짜 GET JSON 사이트
    app.get("/date/:id", function (req, res) {
        var result = {};
        pool.getConnection(function (err, conn) {
            id = mysql.escape(parseInt(req.params.id));
            var sql = "SELECT date_format(lifedate,'%Y-%m-%d') lifedate, date_format(regdate,'%Y-%m-%d') regdate from fireexp where id = " + id + ";";
            conn.query(sql, function (err, rows) {
                var result = returnResult(err, res);
                if (rows) {
                    result.message = rows;
                }
                conn.release();
                //result.status = res.statusCode;
                res.send(rows);
            });
        });
    });
}

var returnResult = function (err, res) {
    // 결과를 눈으로 보기 쉽게하기 위해 result 객체 생성
    var result = {};
    if (err) {
        res.status(400);
        result.message = err.stack;
    } else {
        res.status(200);
        result.message = "Success";
    }
    return result;
}