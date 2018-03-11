const express = require('express');
const app = express();
app.set('trust proxy', true);
const async = require('async');
const uuidV4 = require('uuid/v4');
const nano = require('nano')('http://admin:admin@localhost:5984');
const cors = require('cors');
const fs = require('fs');
const redis = require("redis");
const __browser = require('detect-browser');
var r_client = redis.createClient();
var moment = require('moment-timezone');
var multer = require('multer');
var path = require('path');
var passwordValidator = require('password-validator');
var passValidator = new passwordValidator();
passValidator.is().min(6) // Minimum length 8 
    .is().max(100) // Maximum length 100 
    //.has().uppercase()                              // Must have uppercase letters 
    .has().lowercase() // Must have lowercase letters 
    .has().digits() // Must have digits 
    .has().not().spaces()



    var userValidator = new passwordValidator();
    userValidator.is().min(3)
    .is().max(12)
    .has().digits()
    .has().lowercase()
    .has().not().spaces();
    var phoneValidator = new passwordValidator();
    phoneValidator.is().min(9)
    .has().digits()
    .has().not().spaces();
var util = require('util');
const Q = require('q');
const bodyParser = require('body-parser');
var methodOverride = require('method-override');
var _prefix='';
app.use(bodyParser.json());
app.use(methodOverride());
app.use(cors());
app.use(errorHandler);
function convertTZ(fromTZ) {
    return moment.tz(fromTZ, "Asia/Vientiane").format();
}
var _client={
    username:'',
    logintoken:'',
    logintime:'',
    loginip:'',
    prefix:'',
    data:{
        users:{},
        message:{},
    }
}
var _user={
    username:'',
    password:'',
    phone:'',
    gui:'',
    createddate:'',
    lastupdate:'',
    isactive:'',
    parents:[],
    roles:[],
    logintoken:'',
    expirelogintoken:'',
    description:'',
    photo:'',
    note:'',
    gijvalue:0,
    totalgij:0,
    totalgijpent:0
}
var defaultUser={
    username:'@d31n',
    password:'123456',
    phone:'2054445447',
    gui:uuidV4(),
    createddate:convertTZ(new Date()),
    lastupdate:convertTZ(new Date()),
    isactive:true,
    parents:[],
    roles:['admin','user'],
    logintoken:'',
    expirelogintoken:'',
    description:'',
    photo:'',
    note:'',
    gijvalue:0,
    totalgij:0,
    totalgijpent:0
}
app.all('/init_default_user',function(req,res){
    let js={};
    js.client=req.body;
    js.resp=res;
    if(js.client.secret=='HGT'){
        init_default_user(js);
    }
    else{
        js.client.data.message='NOT ALLOWED';
        js.resp.send(js.client);
    }
});
function copyObject(o1,o2){
    for (const key in o1) {
        o2[key]=o1[key];
    }
}
function init_default_user(js){
    let db=create_db('users');
    findByUserName(defaultUser.username).then(function (res){
        if(res.length)
        if(res.username!=defaultUser.username)
            db.insert(defaultUser,defaultUser.gui,function(err,res){
                if(err)js.resp.send(js.client);
                else{
                    js.client.data.message='OK';
                    js.resp.send(js.client);
                }
            });
        else{
            copyObject(defaultUser,res);
            db.insert(res,res.gui,function(err,res){
                if(err)js.resp.send(js.client);
                else{
                    js.client.data.message='OK';
                    js.resp.send(js.client);
                }
            });
        }
        else{
            db.insert(defaultUser,defaultUser.gui,function(err,res){
                if(err)js.resp.send(js.client);
                else{
                    js.client.data.message='OK';
                    js.resp.send(js.client);
                }
            });
        }
    }).catch(function (err){
        js.client.data.message=err;
        js.resp.send(js.client);
    });
}
var __design_users={
    "_id": "_design/objectList",
    "views": {
      "authentication": {
        "map": "function(doc) {\r\n    if(doc.username.toLowerCase()&&doc.password) {\r\n        emit([doc.username.toLowerCase(),doc.password],doc);\r\n    }\r\n}"
      },
      "findByUsernameAndPhone": {
        "map": "function(doc) {\r\n    if(doc.username.toLowerCase()) {\r\n        emit([doc.username.toLowerCase(),doc.phone],doc);\r\n    }\r\n}"
      },
      "findByUserName": {
        "map": "function(doc) {\r\n    if(doc.username.toLowerCase()) {\r\n        emit(doc.username.toLowerCase(),doc);\r\n    }\r\n}"
      },
      "findByUserGui": {
        "map": "function(doc) {\r\n    if(doc.gui) {\r\n        emit(doc.gui,doc);\r\n    }\r\n}"
      },
      "findExist": {
        "map": "function (doc) {\n if(doc.username.toLowerCase()) \n emit(doc.username.toLowerCase(), doc);\n}"
      },
      "changePassword": {
        "map": "function (doc) {\n    emit([doc.username.toLowerCase(),doc.password,doc.phone], doc);\n}"
      },
      "findByRole": {
        "map": "function (doc) {\n   for(var i=0;i<doc.roles.length;i++) emit([doc.roles[i]], doc);\n}"
      },
      "countByRole": {
        "reduce": "_count",
        "map": "function (doc) {\n   for(var i=0;i<doc.roles.length;i++) emit([doc.roles[i]], doc);\n}"
      },
      "findByParent": {
        "map": "function (doc) {\n   for(var i=0;i<doc.roles.length;i++) emit([doc.parents[i]], doc);\n}"
      },
      "countByParent": {
        "reduce": "_count",
        "map": "function (doc) {\n   for(var i=0;i<doc.roles.length;i++) emit([doc.parents[i]], doc);\n}"
      }
    },
    "language": "javascript"
  };

  var _authen_arr=["/profile","/change_password"]// could get from redis;
  var _author_path=[{
      urlpath:'/login',roles:['guest','user','admin']},
      {urlpath:'/change_password',roles:['user','admin']},
      {urlpath:'/profile',roles:['user','admin']},
      {urlpath:'/home',roles:['guest','user','admin']},
  ];
// var checkAuthen = function (req, res, next) {
//     let js={};
//     js.client=req.body;
//     isAuthen=false;
//     if(checkAuthenPath(req.path,_authen_arr)){
//         for (let index = 0; index < _arrUsers.length; index++) {
//             const element = _arrUsers[index];
//             if(element.username==js.client.username&&element.logintoken==js.client.logintoken)
//                 isAuthen=true;
//         }
//         if(isAuthen)
//             next();
//         else
//             res.redirect('/login');
//     }else
//         next();
//   }
const checkPrefix =function(req,res,next){
    let js={};
    //js.client.ip=req.ip;
    js.client=req.body;
    console.log('using path'+req.path);
    if(req.path=='/get_client')
        next();
    else if(client_prefix.indexOf(js.client.prefix)>-1){
        next();
    }
    else next();
    //TESTING
    //else res.send(new Error('ERROR NOT ALLOW'));
}
app.use(checkPrefix); 
 //app.use(checkAuthen);

  function checkAuthenPath(urlpath){
    if(_authen_arr.indexOf(urlpath)>-1)
        return true;
    return false;
  }

  var checkAuthor = function (req, res, next) {
    let js={};
    js.client=req.body;
    isAuthen=false;
    if(checkAuthenPath(req.path)){
        for (let index = 0; index < _arrUsers.length; index++) {
            const element = _arrUsers[index];
            if(element.username==js.client.username&&element.logintoken==js.client.logintoken)
                isAuthen=true;
        }
        if(isAuthen){
            checkUserRoles(js.client.username).then(function(res){
                if(checkRolePath(req.path,res)){
                    next();
                }
                else 
                    res.send(new Error('No Athorize'));
            }).catch(function(err){
                res.send(err);
            });
            //next();
        }
        else
            res.redirect('/login');
    }else
        next();
  }
function checkRolePath(urlpath,roles){
    for (let index = 0; index < roles.length; index++) {
        for (let i = 0; i < _author_path.length; i++) {
            if(_author_path[i].urlpath==urlpath&&_author_path[i].roles.indexOf(roles[index])>-1)
                return true;
        }       
    }
    return false;
}
//app.use(checkAuthor);
function findUserRoles(username){
    let deferred=Q.defer();
    let db=create_db('users');
    db.view(__design_view,'findUserRolesByUsername',{keys:[username]},function(err,res){
        if(err)deferred.reject(err);
        else{
            if(res.rows.length){
                deferred.resolve(res.rows[0].roles);
            }
            else{
                deferred.reject(new Error('ERROR User not found'));
            }
        }
    });
    return deferred.promise;
}
function checkUserRoles(username){
    let deferred=Q.defer();
    findUserRoles(username).then(function(res){
        deferred.resolve(res);
    }).catch(function(err){
        deferred.reject(err);
    });
}
var _arrUsers=[];
var client_prefix=['ice-maker','gij','web-post'];
function clearPrefix(){
    for (let index = 0; index < client_prefix.length; index++) {
        const element = client_prefix[index];
        if(element.indexOf('GUEST')>-1){
            delete element;
        }
    }
}
setInterval(clearPrefix,1000*60*5); // clear prefix every 5 minutes , so client need to send hearbeat regularly to gain new a new prefix;
app.all('/', function (req, res) {
    let js={};
    js.client = req.body; //client.data.device
    js.resp = res;
    res.sendFile(path.join(__dirname+'/index.html'));
});
function init_client(client){
    if(client==undefined||null)client=_client;
    if(client.data==undefined||null)client=_client;
}
app.post('/test',function(req,res){
    res.send('TEST OK');
});
function checkTest(){
    let deferred=Q.defer();
    deferred.resolve('OK');
    return deferred.promise;
}
app.post('/get_client', function (req, res) {
    let js={};
    js.client = req.body; //client.data.device
    js.resp = res;
    //console.log('get_client');
    // res.send(js.client);
    init_client(js.client);
    getClient(js.client).then(function(res){
        js.client=res;
        js.client.loginip=req.ip;        
        js.client.accessedtime=convertTZ(new Date());
        js.client.timeout=60*60*24;
        js.client.gui=uuidV4();
        r_client.set('_client_'+js.client.gui,JSON.stringify(js.client));
        js.client.data.message='OK';
        js.client.prefix='GUEST-'+uuidV4();
        client_prefix.push(js.client.prefix);
        //console.log('before send '+JSON.stringify(js.client));
        js.resp.send(js.client);
        
    }).catch(function(err){    
        //console.log(err);    
        js.client.data.message=err;
        js.resp.send(js.client);
    });
});
app.all('/hearbeat',function(req,res){
    let js={};
    js.client = req.body; //client.data.device
    js.resp = res;
    js.client.loginip=req.ip;  // if need to do when ip changed
    js.client.prefix='GUEST-'+uuidV4();
    client_prefix.push(js.client.prefix);
    js.resp.send(js.client);
});
function getClient(client){
    let deferred=Q.defer();
    try {
        client.logintoken=uuidV4();
        deferred.resolve(client);
    } catch (err) {
        client.data.message=err;
        deferred.reject(client);
    }
    return deferred.promise;
}

app.all('/login', function (req, res) {
    let js={};
    js.client = req.body; //client.data.device
    js.resp = res;
    if(req.ip!==js.client.loginip){
        js.client.data.message=new Error('ERROR IP CHANGED');
        res.send(js.client);
    }
    login(js);
});

function login(js) {
    authentication(js.client.data.user).then(function(res){
        js.client.data.message='OK';
        js.client.logintoken=uuidV4();
        js.client.logintime=convertTZ(new Date());
        js.resp.send(js.client);
        _arrUsers.push(js.client);
    }).catch(function(err){
        js.client.data.message=err;
        js.resp.send(js.client);
    });
}
function authentication(userinfo){
    let deferred=Q.defer();
    let db=create_db('users');
    db.view(__design_view,'authentication',{keys:[username,password],function(err,res){
        if(err)deferred.reject(err);
        else{
            if(res.rows.length){
                deferred.resolve('OK');
            }
            else{
                deferred.reject('ERROR authentication');
            }
        }
    }})
    return deferred.promise;
}
app.all('/register', function (req, res) {
    let js={};
    js.client = req.body; //client.data.device
    js.resp = res;
    register(js);
});

function register(js) {
    addNewUser(js.client.data.user).then(function(res){
        js.client.data.message='OK added a new user';
        js.client.resp.send(client)
    }).catch(function(err){
        js.client.data.message=err;
        js.resp.send(client);
    });
}
function addNewUser(userinfo){
    let deferred=Q.defer();
    let db=create_db('users');
    if(r=validateUserInfo(userinfo.username).length)
        deferred.reject(r);
    if(r=validatePhoneInfo(userinfo.phone).length)
        deferred.reject(r);
    if(r=validatePassword(userinfo.password).length)
        deferred.reject(r);

    db.insert(userinfo,userinfo.gui,function(err,res){
        if(err) deferred.reject(err);
        else{
            deferred.resolve(res);
        }
    });
    return deferred.promise;
}
function validateUserInfo(userinfo){
    return userValidator.validate(userinfo.username,{list:true});
}

function validatePhoneInfo(userinfo){
    return phoneValidator.validate(userinfo.phone,{list:true});
}

app.all('/update_user', function (req, res) {
    let js={};
    js.client = req.body; //client.data.device
    js.resp = res;
    findUserByUsername(client.data.user.username).then(function(res){
        if(res){
            client.data.user.password=res.password;
            cient.data.user.phone=res.phone;
            updateUser(client.data.user).then(function(res){
                js.client.data.message='OK updated';
                js.resp.send(js.client);
            });
        }
        else{
            throw new Error('ERROR could not update');
        }
    }).catch(function(err){
        console.log(err);
        js.client.data.message=err;
        js.resp.send(js.client);
    });
});

app.all('/logout', function (req, res) {
    let js={};
    js.client = req.body; //client.data.device
    js.resp = res;
    logout(js.client);
    js.resp.send('OK logout');
});
function cleanLoginUsers(){
    for (let index = 0; index < _arrUsers.length; index++) {
        let startDate = moment(_arrUsers[index].logintime)
        let endDate = moment(convertTZ(new Date()));
        const timeout = endDate.diff(startDate, 'seconds'); 
        if(timeout>60*60*24*3)
            delete _arrUsers[index];
    }
}
function logout(client) {
    for (let index = 0; index < _arrUsers.length; index++) {
        const element = _arrUsers[index];       
        if(element.username==client.data.username&&element.logintoken==client.data.logintoken){
                delete _arrUsers[index];
        }

    }
}

app.all('/submit_forgot_keys', function (req, res) {
    let js={};
    js.client = req.body; //client.data.device
    js.resp = res;
    submit_forgot_keys(client.data.user.phone).then(function (res) {
        let content = '';
        content = 'send code to username:' + res.username;
        content += ' with phone number:' + res.phone;
        content += ' please check SMS for keys'+res.keys;
        
        js.client.data.message=SMStoPhone(content, phone);
        js.client.resp.send(js.client);
    }).catch(function (err) {
        js.client.data.message=err;
        js.resp.send(js.client);
    });
});

function SMSToPhone(content, phone) {

}
var _arrForgotKeys = [];
const crypto = require("crypto");

//const id = crypto.randomBytes(16).toString("hex");
function generateFogotKeys(username) {
    r=crypto.randomBytes(2).toString("base64");
    _arrForgotKeys.push({keys:r,username:username,createdTime:convertTZ(new Date())});
    return r;
}

function submit_forgot_keys(phone) {
    //SMS to phone the forgot key
    let deferred = Q.defer();
    findUsernameByPhone(phone).then(function (res) {
        let keys = generateFogotKeys(res.username);
        deferred.resolve({
            username: res.username,
            phone: phone,
            keys: keys
        });
    }).catch(function (err) {
        deferred.reject(err);
    });
    return deferred.promise;
}

function findUsernameByPhone(phone) {
    let deferred = Q.defer();
    let db = create_db('users');
    db.view(__design_view, 'findByUsernameAndPhone', {
        key: [phone]
    }, function (err, res) {
        if (err) deferred.reject(err);
        else {
            if (res.rows.length) {
                deferred.resolve(res.rows[0].value);
            } else
                deferred.reject(new Error('ERROR no records'));
        }
    });
    return deferred.promise;
}

app.all('/forgot_password', function (req, res) {
    let js={};
    js.client = req.body; //client.data.device
    js.resp = res;
    forgot_password(client.data.user.username, client.forgotkeys).then(function (res) {
        js.client.data.message=res;
        js.client.resp.send(js.client);
    }).catch(function (err) {
        js.client.data.message=err;
        js.resp.send(js.client);
    });
});

function checkForgotKeys(keys,username) {
    let res=false;
    for (let index = 0; index < _arrForgotKeys.length; index++) {
        if (_arrForgotKeys[index].keys == keys && _arrForgotKeys[index].username) {
            delete _arrForgotKeys[i];
            res=true;
        }
        else{
            startDate=moment(_arrForgotKeys[i].createdTime);
            endDate=moment(convertTZ(new Date()));
            var secondsDiff = endDate.diff(startDate, 'seconds'); // time out 30 minutes
            if(secondsDiff>60*30)
                delete _arrForgotKeys[i];            
        }
    }
    return res;
}

function forgot_password(username, forgotkeys) {
    let deferred = Q.defer();
    if (checkForgotKeys(forgotkeys,username))
        findUserByUsername(username).then(function (res) {
            res.password = 123456;
            updateUser(res).then(function (res) {
                deferred.resolve('OK 123456');
            })
        }).catch(function (err) {
            db.reject(err);
        });
    else
        deferred.reject(new Error('Wrong fogot keys'));
    return client.promise;
}

function findUserByUsername(username) {
    let deferred = Q.defer();
    let db = create_db('users');
    db.view(__design_view,'findByUsername', {
        key: [username]
    }, function (err, res) {
        if (err) deferred.reject(err);
        else {
            if (res.rows.length) {
                deferred.resolve(res[0]);
            } else {
                deferred.reject(new Error('ERROR this has info'));
            }
        }
    })
    return deferred.promise;
}
app.all('/change_password', function (req, res) {
    let js={};
    js.client = req.body; //client.data.device
    js.resp = res;
    if (checkUserPermission(client.data.user.username))
        change_password(client.data.user.username, client.data.phone, client.data.oldpass, client.data.newpass).then(function (res) {
            js.client.data.message='OK changed password';
            js.resp.send(js.client);
        }).catch(function (err) {
            js.client.data.message=err;
            js.resp.send(js.client);
        });
    else
        client.resp.send('Error this username has no permission');
});

function checkUserPermission(username) {
    findUserByUsername(username).then(function(res){
        console.log(res);
        return true;
    }).catch(function(err){
        console.log(err);
        return false;
    });
    return false;
}

function validatePassword(pass) {
    return passValidator.validate(pass, {
        list: true
    });

}

function updateUser(userinfo) {
    let deferred = Q.defer();
    let db = create_db('users');
    db.insert(userinfo, userInfo.gui, function (err, res) {
        if (err) deferred.reject(err);
        else {
            deferred.resolve('OK');
        }
    });
    return deferred.promise;
}

function change_password(username, phone, oldpass, newpass) {
    let deferred = Q.defer();
    let db = create_db('users');
    findUserByUsernameAndPhone(username, oldpass, phone).then(function (res) {
        if (res) {
            let passValidate = validatePassword(newpass);
            if (passValidate.length) deferred.reject(new Error('Error validating ' + (passValidate.toString())));
            else {
                res.password = newpass;
                updateUser(res);
            }
        }
    }).catch(function (err) {
        deferred.reject(err);
    });
    return deferred.promise;
}

function findUserByUsernameAndPhone(username, oldpass, phone) {
    let deferred = Q.defer();
    let db = create_db('users');
    db.view(__design_view, 'findByUsernameAndPhone', {
        key: [username, password, phone]
    }, function (err, res) {
        if (err) deferred.reject(err);
        else {
            if (res.rows.length) {
                //let arr=[];
                deferred.resolve(res.rows[0].value);
            } else {
                deferred.reject(new Error('Username and phone not found'));
            }
        }
    });
    return deferred.promise;
}


// var terminal    = require("web-terminal");

// terminal(app);

__design_view = "objectList";
function initDB() {
    init_db('users', __design_users);
}
function init_db(dbname, design) {
    // create a new database
    var db;
    async.eachSeries([
        db = create_db(dbname),
        db = nano.use(dbname),
        db.insert(design, function (err, res) {
            if (err) {
                db.get('_design/objectList', function (err, res) {
                    if (err) console.log('could not find design ' + err.message);
                    else {
                        if (res) {
                            var d = res;
                            //console.log("d:"+JSON.stringify(d));
                            db.destroy('_design/objectList', d._rev, function (err, res) {
                                if (err) console.log(err);
                                else {
                                    //console.log(res);
                                    db.insert(design, "_design/objectList", function (err, res) {
                                        if (err) console.log('err insert new design ' + dbname);
                                        else {
                                            //console.log('insert design completed ' + dbname);
                                        }
                                    });
                                }
                            });
                        } else {
                           // console.log("could not find design");
                        }
                    }
                });
            } else{
                //console.log('created design ' + dbname);
            }
                
        })
    ], function (err) {
        console.log('exist ' + dbname);
    });
    //db = nano.use(dbname);
    //return db;
}

function init_redis() {
    r_client.flushdb(function (err, succeeded) {
        console.log(succeeded); // will be true if successfull
    });
}
function errorHandler(err, req, res, next) {
    console.log(err);
    var l = {
        log: err,
        logdate: convertTZ(new Date()),
        type: "error",
        gui: uuidV4()
    };
    errorLogging(l);
    if (res.headersSent) {
        return next(err);
    }
    res.status(500);
    res.render('error', {
        error: err
    });
}

function errorLogging(log) {
    var db = create_db("errorlogs");
    console.log(log);
    db.insert(log, log.gui, function (err, body) {
        if (err) console.log(err);
        else {
            console.log("log oK ");
        }
    });
}
app.listen(6688, "0.0.0.0", function () {
    console.log('Example app listening on port 6688!')
});