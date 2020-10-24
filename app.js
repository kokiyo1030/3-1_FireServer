var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var flash = require('connect-flash');
var session = require('express-session');
var static = require('serve-static');
var passport = require('./config/passport');
var util = require('./util');
var mysql = require('mysql');
var mysqlConfig = require('./mysqlConfig');
var path = require('path');
var app = express();

// DB setting
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect('mongodb://localhost:27017/local');
var db = mongoose.connection;
db.once('open', function () {
    console.log('DB connected');
});
db.on('error', function (err) {
    console.log('DB ERROR : ' + err);
});

// Other settings
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use('/public', static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(methodOverride('_method'));
app.use(flash());
app.use(session({
    secret: 'MySecret',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(function (req, res, next) {
    res.locals.isAuthenticated = req.isAuthenticated();
    res.locals.currentUser = req.user;
    next();
});

var pool = mysql.createPool({
    host: mysqlConfig.mysql.host,
    port: mysqlConfig.mysql.port,
    user: mysqlConfig.mysql.username,
    password: mysqlConfig.mysql.password,
    database: mysqlConfig.mysql.db,
    connectionLimit: 20,
    waitForConnections: false
});

// Routes
app.use('/', require('./routes/home'));
app.use('/posts', util.getPostQueryString, require('./routes/posts'));
app.use('/users', require('./routes/users'));
app.use('/comments', util.getPostQueryString, require('./routes/comments'));
var routes = require('./routes/mysql')(app, pool);

// Port setting
var port = 3000;
app.listen(port, function () {
    console.log('server on! http://localhost:' + port);
});
