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
var crypto = require('crypto');
var passwordValidator = require('password-validator');
var passValidator = new passwordValidator();
process.env.NODE_ENV = 'production';
var _current_system = 'user-management';
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
var _client_prefix = ['ice-maker', 'gij', 'web-post', 'user-management'];
var _system_prefix = _client_prefix;
app.use(bodyParser.json());
app.use(methodOverride());
app.use(cors());
app.use(errorHandler);

function convertTZ(fromTZ) {
    return moment.tz(fromTZ, "Asia/Vientiane").format();
}
const http = require('http');
const server = http.createServer(app);
const WebSocket = require('ws');
const wss = new WebSocket.Server({
    server
    //port: 8081,
    //   perMessageDeflate: {
    //     zlibDeflateOptions: { // See zlib defaults.
    //       chunkSize: 1024,
    //       memLevel: 7,
    //       level: 3,
    //     },
    //     zlibInflateOptions: {
    //       chunkSize: 10 * 1024
    //     },
    //     // Other options settable:
    //     clientNoContextTakeover: true, // Defaults to negotiated value.
    //     serverNoContextTakeover: true, // Defaults to negotiated value.
    //     clientMaxWindowBits: 10,       // Defaults to negotiated value.
    //     serverMaxWindowBits: 10,       // Defaults to negotiated value.
    //     // Below options specified as default values.
    //     concurrencyLimit: 10,          // Limits zlib concurrency for perf.
    //     threshold: 1024,               // Size (in bytes) below which messages
    //                                    // should not be compressed.
    //   }
});
r_client.monitor(function (err, res) {
    console.log("Entering monitoring mode.");
});

r_client.on("monitor", function (time, args, raw_reply) {
    //console.log(time + ": " + args); // 1458910076.446514:['set', 'foo', 'bar']
    args = args.toString();
    if (args.indexOf('set') != 0) //capture the set command only
        return;
    //args=args.replace('\\','');
    let js = JSON.parse(args.substring(args.indexOf('{'), args.lastIndexOf('}') + 1));
    let arr = args.split(',');
    //console.log(arr);
    let command = arr[0];
    let key = arr[1];
    let mode = '';
    let timout = 0;
    if (arr[arr.length - 1].indexOf('}') < 0) {
        mode = arr[arr.length - 2];
        timeout = arr[arr.length - 1]
    }
    let clients = wss.clients;
    if (command == "set")
        wss.clients.forEach(function each(ws) {
            const element = ws;
            //console.log(element);
            if (_current_system+"_client_" + element.gui == key) {
                //console.log('client-changed');
                element.send(JSON.stringify(js));
            }
            if (_current_system+"_error_" + element.gui == key) {
                //console.log('error-changed');
                element.send(JSON.stringify(js));
                var l = {
                    log: JSON.stringify(js),
                    logdate: convertTZ(new Date()),
                    type: "error",
                    gui: uuidV4()
                };
                errorLogging(l);
            }
            if (_current_system+"_login_" + element.client.logintoken == key) {
                //console.log('login-changed');
                element.send(JSON.stringify(js));
            }
            if (_current_system+"_usergui_" + element.client.logintoken == key) {

                console.log('gui-changed');
                if (_system_prefix.indexOf(element.client.prefix) > -1)
                    element.send(JSON.stringify(js));
            }
        });
});





function commandReader(js) {
    const deferred = Q.defer();
    // const isValid=validateTopup(js.client);
    // if(!isValid.length)
    switch (js.client.data.command) {
        case 'shake-hands':
        break;
        case 'login':
            login_ws(js).then(res => {
                deferred.resolve(res);
                //console.log(res);
                js.ws.lastupdate = convertTZ(new Date());
            }).catch(err => {
                //console.log(err);
                deferred.reject(err);
            });
            break;
        case 'logout':
            logout_ws(js).then(res => {
                deferred.resolve(res);
            }).catch(err => {
                deferred.reject(err);
            });
            break;
        case 'register':
            register_ws(js).then(res => {
                deferred.resolve(res);
            }).catch(err => {
                deferred.reject(err);
            });
            break;
        case 'add-user-manual':
            addNewUserManual_WS(js).then(res => {
                deferred.resolve(res);
            }).catch(err => {
                deferred.reject(err);
            });
            break;
        case 'check-forgot':
            forgot_password_ws(js).then(res => {
                deferred.resolve(res);
            }).catch(err => {
                deferred.reject(err);
            });
            break;
        case 'submit-forgot':
            submit_forgot_keys_ws(js).then(res => {
                deferred.resolve(res);
            }).catch(err => {
                deferred.reject(err);
            });
            break;

        case 'change-password':
            console.log(js.client);
            change_password_ws(js).then(res => {
                deferred.resolve(res);
            }).catch(err => {
                deferred.reject(err);
            });
            break;
        case 'send-confirm-phone-sms':
            send_confirm_phone_sms_ws(js).then(res => {
                deferred.resolve(res);
            }).catch(err => {
                deferred.reject(err);
            });
            break;
        case 'check-confirm-phone-sms':
            update_phone_ws(js).then(res => {
                deferred.resolve(res);
            }).catch(err => {
                deferred.reject(err);
            });
            break;
        case 'edit-profile':
            update_user_ws(js).then(res => {
                deferred.resolve(res);
            }).catch(err => {
                deferred.reject(err);
            });
            break;
        case 'get-profile':
            get_user_details_ws(js).then(res => {
                deferred.resolve(res);
            }).catch(err => {
                deferred.reject(err);
            });
            break;
        case 'get-user-list':
            show_user_list_ws(js).then(res => {
                deferred.resolve(res);
            }).catch(err => {
                deferred.reject(err);
            });
            break;

        case 'get-client':
            get_client_ws(js).then(res => {
                deferred.resolve(res);
            }).catch(err => {
                deferred.reject(err);
            });
            break;
        case 'get-user-gui':
            get_user_gui_ws(js).then(res => {
                deferred.resolve(res);
            }).catch(err => {
                deferred.reject(err);
            });
            break;
        case 'heart-beat':
            heartbeat_ws(js).then(res => {
                deferred.resolve(res);
            }).catch(err => {
                deferred.reject(err);
            });
            break;
        case 'check-username':
            check_username_ws(js).then(res => {
                deferred.resolve(res);
            }).catch(err => {
                deferred.reject(err);
            });
            break;
        case 'check-password':
            check_password_ws(js).then(res => {
                deferred.resolve(res);
            }).catch(err => {
                deferred.reject(err);
            });
            break;
        case 'get-secret':
            get_secret_ws(js).then(res => {
                deferred.resolve(res);
            }).catch(err => {
                deferred.reject(err);
            });
            break;
        case 'check-secret':
            check_secret_ws(js).then(res => {
                deferred.resolve(res);
            }).catch(err => {
                deferred.reject(err);
            });
            break;
        case 'validate-phonenumber':
            validate_phonenumber_ws(js).then(res => {
                deferred.resolve(res);
            }).catch(err => {
                deferred.reject(err);
            });
            break;
        case 'get-user-info':
            get_user_info_ws(js).then(res => {
                deferred.resolve(res);
            }).catch(err => {
                deferred.reject(err);
            });
            break;
            // case 'system-prefix':
            //     deferred.resolve(get_system_prefix());
            // break;
        default:
            break;
    }
    return deferred.promise;
}
wss.on('connection', function connection(ws, req) {
    const ip = req.connection.remoteAddress;
    console.log('connection from ' + ip);
    //const ip = req.headers['x-forwarded-for'];
    ws.isAlive = true;
    ws.on('pong', heartbeat);
    ws.on('error', function (err) {
        //js.client.data.message=JSON.stringify(err);
        var l = {
            log: err,
            logdate: convertTZ(new Date()),
            type: "error",
            gui: uuidV4()
        };
        errorLogging(l);
    })
    ws.on('message', function incoming(data) {
        let js = {};
        js.client = data = JSON.parse(data);
        js.ws = ws;
        ws.client = data;
        commandReader(js).then(res => {
            //setTimeout(function timeout() {
            // if(!data.client)  data.client={};
            // if(!data.client.gui||data.client.gui==undefined){
            //data.client.gui=uuidV4();
            if (res.client.data.command == 'logout') {
                ws.gui = '';
                ws.lastupdate = 0;
            } else {
                ws.gui = res.client.gui;
                ws.lastupdate = res.client.lastupdate;
            }

            //}   
            // data.client.clientip=ip;// need to handle when IP changed
            // data.client.data.message='OK';
            //data.client.data.TopupResult=res;
            // data.client.lastupdate=convertTZ(new Date());
            //ws.client=data.client;  
            //console.log(res.client);
            // if(res.client.data.command=="system-prefix")
            //         ws.send(JSON.stringify(res));
            // else              
            ws.send(JSON.stringify(res.client));
            //}, 500);
        }).catch(err => {
            js = err;
            var l = {
                log: js.client.data.message,
                logdate: convertTZ(new Date()),
                type: "error",
                gui: uuidV4()
            };
            //console.log(err);
            errorLogging(l);
            console.log('ws sending');
            js.client.data.message = js.client.data.message.message;
            ws.send(JSON.stringify(js.client));
        });
    });

});

function noop() {
    console.log('time interval ' + this.gui + " is alive:" + this.isAlive);
}

// > ws._socket.address()
//   { port: 8081,
//     family: 2,
//     address: '127.0.0.1' }

// > ws._socket.remoteAddress
//   '74.125.224.194'

// > ws._socket.remotePort
//   41435
function check_secret_ws(js) {
    let deferred = Q.defer();
    r_client.get(_current_system+'_secret_' + js.client.gui, function (err, res) {
        if (err) {
            js.client.data.message = err;
            deferred.reject(js);
        } else {
            if (!res) {
                console.log('secret not found');
                js.client.data.message = new Error('ERROR no secret found');
                deferred.reject(js);
            }
            else{
                let secret = JSON.parse(res).secret;
                if (secret != js.client.data.secret) {
                    console.log('wrong secret');
                    js.client.data.message = new Error('ERROR wrong secret');
                    deferred.reject(js);
                }else{
                    console.log('secret OK');
                    js.client.data.message = 'OK';
                    deferred.resolve(js);
                }
            }            
            
        }
    });
    return deferred.promise;
}

function get_secret_ws(js) {
    let deferred = Q.defer();
    let secret = randomSecret(6, '1234567890');
    let content = "secret is: " + secret;
    r_client.set(_current_system+'_secret_' + js.client.gui, JSON.stringify({
        secret: secret
    }), 'EX', 60 * 30, function (err, res) {
        if (err) {
            js.client.data.message = err;
            r_client.set(_current_system+'_error_' + js.client.gui, JSON.stringify(js), 'EX', 60 * 5);
            deferred.reject(js);
        } else {
            js.client.data.message = 'OK';
        }
        SMSToPhone(js.client.gui, content, js.client.data.user.phonenumber);
        deferred.resolve(js);
    });
    return deferred.promise;
}

function check_password_ws(js) {
    let deferred = Q.defer();
    let passValidate = validatePassword(js.client.data.username.password);
    if (passValidate.length) {
        js.client.data.message = new Error('ERROR validating ' + (passValidate.toString()));
        deferred.reject(js);
    } else {
        js.client.data.message = 'OK';
        deferred.resolve(js);
    }

    return deferred.promise;
}

function check_username_ws(js) {
    let deferred = Q.defer();
    findUserByUsername(js.client.data.user.username).then(function (res) {
        if (res) {
            js.client.data.message = new Error('ERROR username exist');
            deferred.reject(js);
        } else {
            js.client.data.message = 'OK';
            deferred.resolve(js);
        }
    }).catch(function (err) {
        js.client.data.message = err;
        deferred.reject(js);
    });
    return deferred.promise;
}

function get_user_gui_ws(js) {
    let deferred = Q.defer();
    console.log(js.client.prefix);
    console.log(_system_prefix);
    console.log(_system_prefix.indexOf(js.client.prefix));
    if (_system_prefix.indexOf(js.client.prefix) > -1) {
        console.log('exist');
        r_client.get(_current_system+'_usergui_' + js.client.logintoken, function (err, res) {
            if (err) {
                js.client.data.message = err;
                deferred.reject(js);
            } else {
                if (res) {
                    let gui = JSON.parse(res);
                    js.client.data.user = {};
                    js.client.data.user.gui = gui.gui;
                    deferred.resolve(js);
                } else {
                    js.client.data.message=new Error('ERROR gui not found')
                    deferred.reject(js);
                }
            }
        });
    } else {
        js.client.data.message = new Error('ERROR wrong system');
        deferred.reject(js);
    }

    return deferred.promise;
}

function heartbeat_ws(js) {
    let deferred = Q.defer();
    js.client.lastupdate = convertTZ(new Date());
    js.client.clientip = js.ws._socket.remoteAddress;
    deferred.resolve(js);
    return deferred.promise;
}

function heartbeat() {
    if (!this.lastupdate && !this.gui) {
        console.log('HEART BEAT:' + this.gui + " is alive:" + this.isAlive + " " + this.lastupdate + " logout");
        this.isAlive = false;
    }
    let startDate = moment(this.lastupdate)
    let endDate = moment(convertTZ(new Date()));

    const timeout = endDate.diff(startDate, 'seconds');
    // if(this.gui!=this.gui){
    //     this.isAlive=false;
    //     console.log('HEART BEAT:'+this.gui+" is alive:"+this.isAlive+" "+this.lastupdate+" timeout"+timeout);
    //     return;
    // }
    if (timeout > 60 * 3)
        this.isAlive = false;
    else
        this.isAlive = true;

    console.log('HEART BEAT:' + this.gui + " is alive:" + this.isAlive + " " + this.lastupdate + " timeout" + timeout);
    //this.send(this.client);
}
const interval = setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
        if (ws.isAlive === false) return ws.terminate();
        console.log('TIME INTERVAL');
        ws.isAlive = false;
        ws.ping(noop);
    });
}, 30000); // set 60 seconds 


var _client = {
    username: '',
    logintoken: '',
    logintime: '',
    loginip: '',
    clientip: '',
    prefix: '',
    data: {
        users: {},
        message: {},
    }
}
var _user = {
    username: '',
    password: '',
    phone: '',
    gui: '',
    createddate: '',
    lastupdate: '',
    isactive: '',
    parents: [],
    roles: [],
    logintoken: '',
    expirelogintoken: '',
    description: '',
    photo: '',
    note: '',
    system: '', //system, gij, ice-maker,gps,lom
    gijvalue: 0,
    totalgij: 0,
    totalgijpent: 0
}
var defaultUser = {
    username: '@d31n',
    password: '123456',
    phone: '2054445447',
    gui: uuidV4(),
    createddate: convertTZ(new Date()),
    lastupdate: convertTZ(new Date()),
    isactive: true,
    parents: [],
    roles: ['admin', 'user'],
    logintoken: '',
    expirelogintoken: '',
    description: '',
    photo: '',
    note: '',
    system: ['gij', 'web-post', 'user-management', 'ice-maker', 'gps'],
    gijvalue: 0,
    totalgij: 0,
    totalgijpent: 0
}

app.all('/init_default_user', function (req, res) {
    let js = {};
    js.client = req.body;
    js.resp = res;
    r_client.get(_current_system+'_client_' + js.client.gui, function (err, res) {
        if (err) {
            js.client.data.message = err;
            js.resp.send(js.client);
        }        
        if (res) {
            res = JSON.parse(res);
            if (res.gui == js.client.gui)
                if (js.client.secret == 'HGT') {
                    init_default_user(js);
                }
            else {
                js.client.data.message = 'ERRO NOT ALLOWED, init default user failed';
                js.resp.send(js.client);
            } else {
                js.client.data.message = 'ERROR NOT ALLOWED, client is not initialized properly';
                js.resp.send(js.client);
            }
        }
        init_default_user(js);
    });

});

function copyObject(o1, o2) {
    for (const key in o1) {
        o2[key] = o1[key];
    }
}

function init_default_user(js) {
    let db = create_db('gijusers');
    console.log('default user:'+defaultUser.username);
    findUserByUsername(defaultUser.username).then(function (res) {
        console.log('res');
        console.log(res);
        console.log('res');
        if (res) {
                // currentGUI=res.gui+"";
                // copyObject(defaultUser,res);
                // res.gui=currentGUI;
                // console.log('new default user');
                // console.log(res);
                nano.db.destroy('gijusers', function (err, body) {
                    js.client.data={};
                    js.client.data.message='destroy OK';
                    //initDB();
                    js.resp.send(js.client);
                });  

        }
        else {
            js.client.data = {};
            db.insert(defaultUser, defaultUser.gui, function (err, res) {
                if (err) {
                    js.client.data.message = err;
                    js.resp.send(js.client);
                } else {
                    js.client.data.message = 'OK';
                    js.resp.send(js.client);
                }
            });
        }
    }).catch(function (err) {
        js.client.data={};
        js.client.data.message = err;
        js.resp.send(js.client);
    });
}
var __design_users = {
    "_id": "_design/objectList",
    "views": {
        "authentication": {
            "map": "function(doc) {\r\n    if(doc.username.toLowerCase()&&doc.password) {\r\n        emit([doc.username.toLowerCase(),doc.password],doc);\r\n    }\r\n}"
        },
        "findByPhone": {
            "map": "function(doc) {\r\n    if(doc.phone) {\r\n        emit(doc.phone,doc);\r\n    }\r\n}"
        },
        "findByUsernameAndPhone": {
            "map": "function(doc) {\r\n    if(doc.username.toLowerCase()) {\r\n        emit([doc.username.toLowerCase(),doc.phone],doc);\r\n    }\r\n}"
        },
        "findByUsername": {
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

//var _authen_arr = ["/profile", "/change_password"] // could get from redis;
var _author_path = [{
        urlpath: '/login',
        roles: ['guest', 'user', 'admin']
    },
    {
        urlpath: '/change_password',
        roles: ['user', 'admin']
    },
    {
        urlpath: '/profile',
        roles: ['user', 'admin']
    },
    {
        urlpath: '/home',
        roles: ['guest', 'user', 'admin']
    },
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
const checkPrefix = function (req, res, next) {
    let js = {};
    //js.client.ip=req.ip;
    js.client = req.body;
    console.log('using path' + req.path);
    if (req.path == '/get_client')
        next();
    else if (_client_prefix.indexOf(js.client.prefix) > -1) {
        next();
    } else next();
    //TESTING
    //else res.send(new Error('ERROR NOT ALLOW'));
}
app.use(checkPrefix);
//app.use(checkAuthen);

// function checkAuthenPath(urlpath) {
//     if (_authen_arr.indexOf(urlpath) > -1)
//         return true;
//     return false;
// }

// var checkAuthor = function (req, res, next) {
//     let js = {};
//     js.client = req.body;
//     isAuthen = false;
//     if (checkAuthenPath(req.path)) {
//         for (let index = 0; index < _arrUsers.length; index++) {
//             const element = _arrUsers[index];
//             if (element.username == js.client.username && element.logintoken == js.client.logintoken)
//                 isAuthen = true;
//         }
//         if (isAuthen) {
//             checkUserRoles(js.client.username).then(function (res) {
//                 if (checkRolePath(req.path, res)) {
//                     next();
//                 } else
//                     res.send(new Error('ERROR No Athorize'));
//             }).catch(function (err) {
//                 res.send(err);
//             });
//             //next();
//         } else
//             res.redirect('/login');
//     } else
//         next();
// }

// function checkRolePath(urlpath, roles) {
//     for (let index = 0; index < roles.length; index++) {
//         for (let i = 0; i < _author_path.length; i++) {
//             if (_author_path[i].urlpath == urlpath && _author_path[i].roles.indexOf(roles[index]) > -1)
//                 return true;
//         }
//     }
//     return false;
// }
//app.use(checkAuthor);
function findUserRoles(gui) {
    let deferred = Q.defer();
    let db = create_db('gijusers');
    db.view(__design_view, 'findByUserGui', {
        keys: [username]
    }, function (err, res) {
        if (err) deferred.reject(err);
        else {
            if (res.rows.length) {
                deferred.resolve(res.rows[0].roles);
            } else {
                deferred.reject(new Error('ERROR User not found'));
            }
        }
    });
    return deferred.promise;
}

function checkUserRoles(gui) {
    let deferred = Q.defer();
    findUserRoles(gui).then(function (res) {
        deferred.resolve(res);
    }).catch(function (err) {
        deferred.reject(err);
    });
}
//var _arrUsers = [];

function clearPrefix() {
    for (let index = 0; index < _client_prefix.length; index++) {
        const element = _client_prefix[index];
        if (element.indexOf('GUEST') > -1) {
            delete element;
        }
    }
}
setInterval(clearPrefix, 1000 * 60 * 5); // clear prefix every 5 minutes , so client need to send hearbeat regularly to gain new a new prefix;
//console.log(__dirname+'public');
app.use('/public', express.static(__dirname + '/public'));
app.all('/', function (req, res) {
    let js = {};
    js.client = req.body; //client.data.device
    js.resp = res;
    res.sendFile(path.join(__dirname + '/index.html'));
});

function get_system_prefix() {
    return _system_prefix;
}

function init_client(client) {
    if (client == undefined || null) client = _client;
    if (client.data == undefined || null) client = _client;
}
app.post('/test', function (req, res) {
    res.send('TEST OK');
});

function checkTest() {
    let deferred = Q.defer();
    deferred.resolve('OK');
    return deferred.promise;
}

function get_client_ws(js) {
    let deferred = Q.defer();
    init_client(js.client);
    getClient(js.client).then(function (res) {
        //js.client=res;
        //console.log(js.ws._socket.remoteAddress);
        js.client.clientip = js.ws._socket.remoteAddress;
        js.client.accessedtime = convertTZ(new Date());
        js.client.lastupdate = convertTZ(new Date());
        js.client.timeout = 60 * 60 * 24;
        //js.client.gui=uuidV4();        

        js.client.data.message = 'OK';
        if (!js.client.prefix)
            js.client.prefix = 'GUEST-' + uuidV4();
        //_client_prefix.push(js.client.prefix);
        //console.log('before send '+JSON.stringify(js.client));
        r_client.set(_current_system+'_client_' + js.client.gui, JSON.stringify({
            command: 'client-changed',
            client: js.client
        }), 'EX', 60 * 60 / 2);
        deferred.resolve(js);

    }).catch(function (err) {
        //console.log(err);    
        js.client.data.message = err;
        deferred.reject(js);
    });
    return deferred.promise;
}
app.post('/get_client', function (req, res) {
    let js = {};
    js.client = req.body; //client.data.device
    js.resp = res;
    //console.log('get_client');
    // res.send(js.client);
    init_client(js.client);
    getClient(js.client).then(function (res) {
        js.client = res;
        js.client.clientip = req.ip;
        js.client.accessedtime = convertTZ(new Date());
        js.client.timeout = 60 * 60 * 24;
        //js.client.gui=uuidV4();

        js.client.data.message = 'OK';
        if (!js.client.prefix)
            js.client.prefix = 'GUEST-' + uuidV4();
        //_client_prefix.push(js.client.prefix);
        //console.log('before send '+JSON.stringify(js.client));
        r_client.set(_current_system+'_client_' + js.client.gui, JSON.stringify(js.client), 'EX', 60 * 60 / 2);
        js.resp.send(js.client);

    }).catch(function (err) {
        //console.log(err);    
        js.client.data.message = err;
        js.resp.send(js.client);
    });
});
app.all('/hearbeat', function (req, res) {
    let js = {};
    js.client = req.body; //client.data.device
    js.resp = res;
    js.client.clientip = req.ip; // if need to do when ip changed
    if (js.client.prefix.indexOf('GUEST') > -1)
        js.client.prefix = 'GUEST-' + uuidV4();
    _client_prefix.push(js.client.prefix);
    js.resp.send(js.client);
});

function getClient(client) {
    let deferred = Q.defer();
    try {
        client.gui = uuidV4();
        deferred.resolve(client);
    } catch (err) {
        client.data.message = err;
        deferred.reject(client);
    }
    return deferred.promise;
}

app.all('/login', function (req, res) {
    let js = {};
    js.client = req.body; //client.data.device
    js.resp = res;
    if (req.ip !== js.client.loginip) {
        js.client.data.message = new Error('ERROR IP CHANGED');
        res.send(js.client);
    }
    login(js);
});

function login_ws(js) {
    let deferred = Q.defer();
    authentication(js.client.data.user).then(function (res) {
        console.log('authen res');
        console.log(res);        
        if (!_client_prefix.match(res.system).length) {
            js.client.username = '';
            js.client.data.user = {};
            js.client.loginip = js.ws._socket.remoteAddress;
            js.client.logintoken = '';
            js.client.logintime = '';
            js.client.data.message = new Error('ERROR not allow this user');
            return;
        }

        if (!res.system.match(['user-management']).length) {
            js.client.username = '';
            js.client.data.user = {};
            js.client.loginip = js.ws._socket.remoteAddress;
            js.client.logintoken = '';
            js.client.logintime = '';
            js.client.data.message = new Error('ERROR user has no an authorization');
            return;
        }

        js.client.username = js.client.data.user.username;
        js.client.data.user = {};
        js.client.loginip = js.ws._socket.remoteAddress;
        js.client.data.message = 'OK';
        js.client.logintoken = uuidV4();
        js.client.logintime = convertTZ(new Date());
        //js.resp.send(js.client);
        //_arrUsers.push(js.client);
        r_client.set(_current_system+'_login_' + js.client.logintoken, JSON.stringify({
            command: 'login-changed',
            logintoken: js.client.logintoken,
            logintime: js.client.logintime,
            username: js.client.data.user.username
        }), 'EX', 60 * 5);
        console.log('gui-changing');
        //console.log(res);
        r_client.set(_current_system+'_usergui_' + js.client.logintoken, JSON.stringify({
            command: 'usergui-changed',
            gui: res.gui
        }), 'EX', 60 * 5);
        deferred.resolve(js);
    }).catch(function (err) {
        js.client.data.message = err;
        js.client.data.user = {};
        js.client.accessedtime = convertTZ(new Date());
        //js.resp.send(js.client);
        deferred.reject(js);
    });
    return deferred.promise;
}

function login(js) {
    authentication(js.client.data.user).then(function (res) {
        js.client.username = js.client.data.user.username;
        js.client.data.user = {};
        js.client.data.message = 'OK';
        js.client.logintoken = uuidV4();
        js.client.logintime = convertTZ(new Date());
        js.resp.send(js.client);
        //_arrUsers.push(js.client);
    }).catch(function (err) {
        js.client.data.message = err;
        js.resp.send(js.client);
    });
}

function authentication(userinfo) {
    let deferred = Q.defer();
    let db = create_db('gijusers');
    console.log('check authen');
    db.view(__design_view, 'authentication', {
        key: [userinfo.username, userinfo.password]
    }, function (err, res) {
        console.log('checking login')
        // console.log("res:"+res);
        // console.log("error:"+err);
        if (err) deferred.reject(err);
        else {
            //console.log('login ok')
            if(res){
                if (res.rows.length) {
                    deferred.resolve(res.rows[0].value);
                } 
            }     
            deferred.reject(new Error('ERROR wrong username or password'));       
        }
    })
    return deferred.promise;
}

app.all('/register', function (req, res) {
    let js = {};
    js.client = req.body; //client.data.device
    js.resp = res;
    register(js);
});

function register_ws(js) {
    let deferred = Q.defer();
    if (_client_prefix.indexOf(js.client.prefix) > -1)
        js.client.data.user.system.push(js.client.prefix);
    else
        js.client.data.user.system.push('default');
    check_secret_ws(js).then(function (res) {
        addNewUser(js.client.data.user).then(function (res) {
            js.client.data.message = 'OK added a new user';
            deferred.resolve(js);
        });
    }).catch(function (err) {
        js.client.data.message = err;
        deferred.reject(js);
    });
    return deferred.promise;
}

function register(js) {
    js.client.data.user.system.push('default');
    addNewUser(js.client.data.user).then(function (res) {
        js.client.data.message = 'OK added a new user';
        js.client.resp.send(client);
    }).catch(function (err) {
        js.client.data.message = err;
        js.resp.send(client);
    });
}
app.all('/manual_add_user', function (req, res) {
    let js = {};
    js.client = req.body; //client.data.device
    js.resp = res;
    js.client.data.user.system.push('default');
    addNewUser(js.client.data.user).then(function (res) {
        s.client.data.message = 'OK added a new user';
        js.client.resp.send(client);
    }).catch(function (err) {
        js.client.data.message = err;
        js.resp.send(client);
    });
});

function addNewUserManual_WS(js) {
    let deferred = Q.defer();
    js.client.data.user.system.push('default');
    addNewUser(js.client.data.user).then(function (res) {
        js.client.data.message = 'OK added a new user';
        deferred.resolve(js);
    }).catch(function (err) {
        js.client.data.message = err;
        deferred.reject(js);
    });
    return deferred.promise;
}

function addNewUser(userinfo) {
    let deferred = Q.defer();
    let db = create_db('gijusers');

    findUserByUsername(userinfo.parents[0]).then(function (res) {
        if (!res) {
            userinfo.parents.push(defaultUser.username);
        }

        if ((r = validateUserInfo(userinfo.username)).length)
            deferred.reject(r);
        if ((r = validatePhoneInfo(userinfo.phone)).length)
            deferred.reject(r);
        if ((r = validatePassword(userinfo.password)).length)
            deferred.reject(r);
        db.insert(userinfo, userinfo.gui, function (err, res) {
            if (err) deferred.reject(err);
            else {
                deferred.resolve(res);
            }
        });

    }).then(function (err) {
        deferred.reject(err);
    });

    return deferred.promise;
}

function validateUserInfo(userinfo) {
    return userValidator.validate(userinfo.username, {
        list: true
    });
}

function validatePhoneInfo(userinfo) {
    return phoneValidator.validate(userinfo.phone, {
        list: true
    });
}

app.all('/update_user', function (req, res) {
    let js = {};
    js.client = req.body; //client.data.device
    js.resp = res;
    findUserByUsername(client.data.user.username).then(function (res) {
        if (res) {

            js.client.data.user.password = res.password;
            js.cient.data.user.phone = res.phone;
            js.client.data.user._rev = res._rev;
            js.client.data.user._id = res._id;
            updateUser(client.data.user).then(function (res) {
                js.client.data.message = 'OK updated';
                console.log('updating');
                if (fs.existsSync(__dirname + "/temp/" + client.data.user.photo)) {
                    fs.rename(__dirname + "/temp/" + client.data.user.photo, __dirname + '/photo/' + client.data.user.photo);
                }
                js.resp.send(js.client);
            });
        } else {
            throw new Error('ERROR user not found');
        }
    }).catch(function (err) {
        console.log(err);
        js.client.data.message = err;
        js.resp.send(js.client);
    });
});

function update_user_ws(js) {
    let deferred = Q.defer();
    r_client.get(_current_system+'_usergui_' + js.client.logintoken, function (err, gui) {
        let c = JSON.parse(gui);
        gui = c.gui;
        findUserByGUI(gui).then(function (res) {            
            if (res) {
                //js.client.data={};
                //js.client.data.user={};     

                res.lastupdate = convertTZ(new Date());
                res.photo = js.client.data.user.photo;
                res.note = js.client.data.user.note;
                res.description = js.client.data.user.description;

                updateUser(res).then(function (res) {
                    js.client.data.message = 'OK updated';
                    try {
                        if (js.client.data.user.photo)
                            if (fs.existsSync(__dirname + "/temp/" + js.client.data.user.photo)) {
                                fs.rename(__dirname + "/temp/" + js.client.data.user.photo, __dirname + '/photo/' + js.client.data.user.photo);
                            }
                    } catch (error) {
                        console.log(error);
                    }
                    deferred.resolve(js);
                }).catch(function (err) {
                    js.client.data.message = err;
                    console.log(err);
                    deferred.reject(js);
                });
            } else {
                //throw new Error('ERROR user not found');
                js.client.data.message = new Error('ERROR user not found');
                deferred.reject(js);
            }
        }).catch(function (err) {
            js.client.data.message = err;
            deferred.reject(js);
        });
    });


    return deferred.promise;
}

function validate_phonenumber_ws(js) {
    let deferred = Q.defer();
    let phonesize = js.client.data.user.phonenumber.length;
    let phone = js.client.data.user.phonenumber;
    LTC = phone.indexOf('205');
    UNI = phone.indexOf('209');
    if (phonesize < 10 || phonesize > 10) {
        js.client.data.message = new Error('ERROR phone must start with 205 or 209 and 10 digit in total');
        deferred.reject(js);
    }
    if (LTC < 0 && UNI < 0) {
        js.client.data.message = new Error('ERROR we support only LAOTEL and UNITEL number only');
        deferred.reject(js);
    }
    deferred.resolve('OK');
    return deferred.promise;
}

function send_confirm_phone_sms_ws(js) {
    let deferred = Q.defer();
    let p = {};
    let phone = js.client.data.user.phonenumber;
    validate_phonenumber_ws(js).then(function (res) {
        findUserByPhone(phone).then(function (res) {
            if (res) {
                p.secret = randomSecret(6, '1234567890');
                //p.phone=phone;
                r_client.set(_current_system+'_phone_' + js.client.gui, secret, 'EX', 60 * 30);
                SMSToPhone(js.client.gui, 'your secret is :' + p.secret, phone);
                js.client.data.message = 'OK';
                deferred.resolve(js);
            } else {
                js.client.data.message = new Error('ERROR phone or username not found');;
                deferred.reject(js);
            }
        })
    }).catch(function (err) {
        js.client.data.message = err;
        deferred.reject(js);
    });


    return deferred.promise;
}
app.all('/confirm_phone_sms', function (req, res) {
    let js = {};
    js.client = req.body; //client.data.device
    js.resp = res;
    let p = {};
    let phone = js.client.data.user.phone;
    findUserByUsernameAndPhone(js.client.data.username, phone).then(function (res) {
        if (res) {
            p.secret = randomSecret(6, '1234567890');
            p.phone = phone;
           // phoneSecret.push(p);
            SMSToPhone(js.client.gui, 'your secret is :' + p.secret, phone);
            js.resp.send('secret sms sent to this phone:' + p.phone);
        }
    }).catch(function (err) {
        js.client.data.message = err;
        js.resp.send(js.client);
    });

});

function checkPhoneSecret(secret, phone) {
    for (let index = 0; index < phoneSecret.length; index++) {
        const element = phoneSecret[index];
        if (element.secret == secret && element.phone == phone) {
            return true;
            delete phoneSecret[index];
        }
    }
    return false;
}

// function check_phone_secret_ws(js) {
//     let deferred = Q.defer();
//     if (checkPhoneSecret(js.client.data.secret, js.client.data.phone))
//         deferred.resolve('OK');
//     else
//         deferred.reject(new Error('ERROR Wrong secret'));
//     return deferred.promise;
// }

function update_phone_ws(js) {
    let deferred = Q.defer();
    r_client.get(_current_system+'_phone_' + js.client.gui, function (err, res) {
        if (err) {
            js.client.data.message = err;
            deferred.reject(js);
        } else {
            if(res){
                res = JSON.parse(res);
                if (res.secret == js.client.data.secret) {
                    findUserByPhone(js.client.data.user.phonenumber).then(function (res) {
                        if (res) {
                            //client.data.user.password=res.password;
                            res.oldphone.push(res.phone);
                            res.phone = js.client.data.user.phonenumber;
                            updateUser(res).then(function (res) {
                                js.client.data.message = 'OK updated';
                                deferred.resolve(js);
                            });
                        } else {
                            js.client.data.message = new Error('ERROR user not found');
                            deferred.reject(js);
                        }
                    }).catch(function (err) {
                        //console.log(err);
                        js.client.data.message = err;
                        deferred.reject(js);
                    });
                } else {
                    js.client.data.message = new Error('ERROR wrong secret and phone');
                    deferred.reject(js);
                }
            }
            else{
                js.client.data.message=new Error('ERROR empty secret');
                deferred.reject(js); 
            }
        }
    });
    return deferred.promise;
}
app.all('/update_phone', function (req, res) {
    let js = {};
    js.client = req.body; //client.data.device
    js.resp = res;
    if (checkPhoneSecret(js.client.data.secret, js.client.data.user.phone))
        findUserByUsername(client.data.user.username).then(function (res) {
            if (res) {
                //client.data.user.password=res.password;
                res.phone = cient.data.user.phone;
                updateUser(res).then(function (res) {
                    js.client.data.message = 'OK updated';
                    js.resp.send(js.client);
                });
            } else {
                throw new Error('ERROR user not found');
            }
        }).catch(function (err) {
            console.log(err);
            js.client.data.message = err;
            js.resp.send(js.client);
        });
    else {
        js.client.data.message = new Error('ERROR wrong secret and phone');
        js.resp.send(js.client);
    }

});
app.all('/show_user_list', function (req, res) {
    let js = {};
    js.client = req.body; //client.data.device
    js.resp = res;
    showUserList(js.client.data.user.username).then(function (res) {
        js.client.data.user = res;
        js.client.data.message = 'OK';
        js.resp.send(js.client);
    }).catch(function (err) {
        js.client.data.message = err;
        js.resp.send(js.client);
    });
});

function show_user_list_ws(js) {
    let deferred = Q.defer();
    findUserByGUI(js.client.data.usergui).then(res => {
        findUserListByParentName(res.username).then(function (res) {
            deferred.resolve(res)
        });
    }).catch(err => {
        deferred.reject(err);
    });
    return deferred.promise;
}



function showUserList(gui) {
    let deferred = Q.defer();
    findUserByGUI(gui).then(res => {
        findUserListByParentName(res.username).then(function (res) {
            deferred.resolve(res)
        });
    }).catch(err => {
        deferred.reject(err);
    });
    return deferred.promise;
}

function findUserListByParentName(username) {
    let deferred = Q.defer();
    let db = create_db('gijusers');
    db.view(__design_view, 'findByParent', {
        key: [username]
    }, function (err, res) {
        if (err) deferred.reject(err);
        else {
            if (res.rows.length) {
                let arr = [];
                for (let index = 0; index < res.rows.length; index++) {
                    const element = res.rows[index].value;
                    let e = {};
                    e.gui = element.gui;
                    e.username = element.username;
                    e._id = element._id;
                    arr.push(e);
                }
                deferred.resolve(arr);
            } else {
                deferred.reject('ERROR NO SUB USERS');
            }
        }
    });
    return deferred.promise;
}

function get_user_info_ws(js) {
    let deferred = Q.defer();
    findUserByGUI(js.client.data.user.gui).then(function (res) {
        js.client.data.user = res;
        js.client.data.message = 'OK';
        deferred.resolve(js);
    }).catch(function (err) {
        js.client.data.message = err;
        deferred.reject(js);
    });
    return deferred.promise;
}

app.all('/display_user_details', function (req, res) {
    let js = {};
    js.client = req.body; //client.data.device
    js.resp = res;
    displayUserDetails(js.client.data.user.gui).then(function (res) {
        js.client.data.user = res;
        js.client.data.message = 'OK';
        js.resp.send(js.client);
    }).catch(function (err) {
        js.client.data.message = err;
        js.resp.send(js.client);
    });

});

function get_user_details_ws(js) {
    let deferred = Q.defer();
    r_client.get(_current_system+'_usergui_' + js.client.logintoken, function (err, gui) {
        if(err){
            js.client.data.message = err;
            deferred.reject(js);
        }
        else{
            if(gui){
                let c = JSON.parse(gui);
                gui = c.gui;
                displayUserDetails(gui).then(function (res) {
                    js.client.data.user = res;
                    js.client.data.message = 'OK';
                    deferred.resolve(js);
                }).catch(function (err) {
                    js.client.data.message = err;
                    deferred.reject(js);
                });
            }else{
                js.client.data.message = new Error('gui not found');
                deferred.reject(js);
            }
        }
        
    });
    return deferred.promise;
}

function displayUserDetails(gui) {
    let deferred = Q.defer();
    findUserByGUI(gui).then(function (res) {
        cleanUserInfo(res);
        deferred.resolve(res);
    }).catch(function (err) {
        deferred.reject(err);
    });
    return deferred.promise;
}

function cleanUserInfo(element) {
    delete element._rev;
    delete element._id;
    delete element.gui;
    delete element.oldphone;
    delete element.roles;
    delete element.parents;
    delete element.isactive;
    delete element.system;
    delete element.password;
}

function findUserByGUI(gui) {
    let deferred = Q.defer();
    let db = create_db('gijusers');
    db.view(__design_view, 'findByUserGui', {
        key: gui
    }, function (err, res) {
        if (err) deferred.reject(err);
        else {
            let arr = [];
            for (let index = 0; index < res.rows.length; index++) {
                const element = res.rows[index].value;
                //cleanUserInfo(element);
                arr.push(element);
            }
            deferred.resolve(arr[0]);
        }
    });
    return deferred.promise;
}

var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, __dirname + '/temp');
    },
    filename: function (req, file, callback) {
        console.log(file)
        callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
});
app.all('/upload_photo_profile', function (req, res) {
    let js = {};
    js.client = req.body;
    var upload = multer({
        storage: storage,
        fileFilter: function (req, file, callback) {
            var ext = path.extname(file.originalname)
            if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
                return callback(res.end('Only images are allowed'), null)
            }
            callback(null, true);
        }
    }).single('photoProfile');
    upload(req, res, function (err) {
        js.client.data.file.filename = req.file.filename;
        res.end(js.client);
    });
});

app.all('/logout', function (req, res) {
    let js = {};
    js.client = req.body; //client.data.device
    js.resp = res;
    logout(js.client);
    js.resp.send('OK logout');
});

// function cleanLoginUsers() {
//     for (let index = 0; index < _arrUsers.length; index++) {
//         let startDate = moment(_arrUsers[index].logintime)
//         let endDate = moment(convertTZ(new Date()));
//         const timeout = endDate.diff(startDate, 'seconds');
//         if (timeout > 60 * 60 * 24 * 3)
//             delete _arrUsers[index];
//     }
// }

function logout_ws(js) {
    let deferred = Q.defer();
    let client = js.client;
    // for (let index = 0; index < _arrUsers.length; index++) {
    //     const element = _arrUsers[index];       
    //     if(element.username==client.data.username&&element.logintoken==client.data.logintoken){
    //r_client.del('_client_'+client.gui);
    r_client.del('_login_' + client.logintoken);
    r_client.del('_usergui_' + client.logintoken);
    js.client.data = {};
    js.client.data.command = 'logout';
    js.client.accessedtime = convertTZ(new Date());
    js.client.data.message = 'OK';
    deferred.resolve(js);
    //delete _arrUsers[index];                
    //     }
    // }
    return deferred.promise;
}

function logout(client) {
    // for (let index = 0; index < _arrUsers.length; index++) {
    //     const element = _arrUsers[index];       
    //     if(element.username==client.data.username&&element.logintoken==client.data.logintoken){
    r_client.del('_client_' + element.gui);
    r_client.del('_login_' + element.gui);
    //         delete _arrUsers[index];                
    //     }
    // }
}

function cleanRedis(k) {
    let deferred = Q.defer();
    var jobs = [];
    r_client.keys('*', function (err, keys) {
        if (err) deferred.reject(err);
        else {
            for (let index = 0; index < keys.length; index++) {
                const element = keys[index];
                r_client.del(k);
            }
        }
    });
    return deferred.promise;
}

app.all('/submit_forgot_keys', function (req, res) {
    let js = {};
    js.client = req.body; //client.data.device
    js.resp = res;
    submit_forgot_keys(client.data.user.phone).then(function (res) {
        let content = '';
        content = 'send code to username:' + res.username;
        content += ' with phone number:' + res.phone;
        content += ' please check SMS for keys' + res.keys;

        SMSToPhone(js.client.gui, content, phone);
        js.client.resp.send(js.client);
    }).catch(function (err) {
        js.client.data.message = err;
        js.resp.send(js.client);
    });
});

function submit_forgot_keys_ws(js) {
    let deferred = Q.defer();
    submit_forgot_keys(js).then(function (res) {
        let content = '';
        content = 'send code to username:' + js.client.username;
        content += ' with phone number:' + js.client.data.user.phonenumber;
        content += ' please check SMS for keys ' + js.client.data.forgot;
        delete js.client.data.forgot;
        js.client.data.message = 'OK';
        SMSToPhone(js.client.gui, content, js.client.data.user.phonenumber);
        deferred.resolve(js)
    }).catch(function (err) {
        js.client.data.message = err;
        deferred.reject(js);
    });
    return deferred.promise;
}

function randomSecret(howMany, chars) {
    chars = chars ||
        "abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789";
    var rnd = crypto.randomBytes(howMany),
        value = new Array(howMany),
        len = chars.length;

    for (var i = 0; i < howMany; i++) {
        value[i] = chars[rnd[i] % len]
    };

    return value.join('');
}
var phoneSecret = [];

function LTCserviceSMS(client) {
    client.system = 'user-management';
    let ws_client = new WebSocket('ws://localhost:8081/');//ltcservice
    ws_client.on('open', function open() {
        ws_client.send(JSON.stringify(client), function (err) {
            if (err)
                r_client.set(_current_system+'_error_' + client.gui, JSON.stringify({
                    command: 'error-changed',
                    err: err
                }), 'EX', 60 * 5);
        });
    });
    ws_client.on('message', function incoming(data) {
        data = JSON.parse(data);
        delete data.system;
        //delete data.res.SendSMSResult.user_id;
        r_client.set(_current_system+'_client_' + client.gui, JSON.stringify({
            command: 'client-changed',
            client: data
        }), 'EX', 60 * 60 / 2);
    });
    ws_client.on("error", (err) => {
        r_client.set(_current_system+'_error_' + client.gui, JSON.stringify({
            command: 'error-changed',
            err: err
        }), 'EX', 60 * 5);

    });
}
//SMSToPhone('TEST','2055516321');
function SMSToPhone(clientgui, content, phone) {
    let client = {};
    let js = {};
    client.gui = clientgui;
    client.data = {};
    client.data.sms = {};
    client.data.sms.phonenumber = phone;
    client.data.sms.content = content;
    client.data.command = 'send-sms';
    js.client = {};
    js.client.data = {};
    js.client.data.user = {};
    js.client.data.user.phonenumber = phone;
    console.log('send secret: ' + content);
    validate_phonenumber_ws(js).then(function (res) {
        console.log('validate: ' + res);
        if (res) {
            console.log('SMS to ' + client.data.sms.phonenumber);
            LTCserviceSMS(client);
        }
    }).catch(function (err) {
        throw err;
    });

}

//var _arrForgotKeys = [];
//const crypto = require("crypto");

//const id = crypto.randomBytes(16).toString("hex");
function generateFogotKeys(username) {
    return crypto.randomBytes(2).toString("base64");
}

function submit_forgot_keys(js) {
    //SMS to phone the forgot key
    let deferred = Q.defer();
    findUserByPhone(js.client.data.user.phonenumber).then(function (res) {
        let keys = randomSecret(6, '1234567890');
        js.client.username = res.username;
        js.client.data.forgot = keys;
        r_client.set(_current_system+'_forgot_' + js.client.gui, JSON.stringify({
            forgot: keys
        }))
        deferred.resolve(js);
    }).catch(function (err) {
        deferred.reject(err);
    });
    return deferred.promise;
}

function findUserByPhone(phone) {
    let deferred = Q.defer();
    let db = create_db('gijusers');
    db.view(__design_view, 'findByPhone', {
        key: phone
    }, function (err, res) {
        if (err) deferred.reject(err);
        else {
            if (res.rows.length) {
                console.log(res);
                deferred.resolve(res.rows[0].value);
            } else
                deferred.reject(new Error('ERROR no records'));
        }
    });
    return deferred.promise;
}


app.all('/forgot_password', function (req, res) {
    let js = {};
    js.client = req.body; //client.data.device
    js.resp = res;
    forgot_password(js.client.data.user.username, js.client.data.forgot).then(function (res) {
        js.client.data.message = res;
        js.client.resp.send(js.client);
    }).catch(function (err) {
        js.client.data.message = err;
        js.resp.send(js.client);
    });
});

function forgot_password_ws(js) {
    let deferred = Q.defer();
    forgot_password(js).then(function (res) {
        js.client.data.message = res;
        deferred.resolve(js);
    }).catch(function (err) {
        js.client.data.message = err;
        deferred.reject(js);
    });
    return deferred.promise;
}

function forgot_password(js) {
    let deferred = Q.defer();
    r_client.get(_current_system+'_forgot_' + js.client.gui, function (err, res) {
        if (err) deferred.reject(err);
        else {
            if(res){
            res = JSON.parse(res);
            if (res.forgot == js.client.data.forgot) {
                findUserByPhone(js.client.data.user.phonenumber).then(function (res) {
                    res.password = "123456";
                    updateUser(res).then(function (res) {
                        deferred.resolve('OK 123456');
                    })
                }).catch(function (err) {
                    deferred.reject(err);
                });
            } else
                deferred.reject(new Error('ERROR wrong keys'));
            }
        }
    });

    return deferred.promise;
}

function findUserByUsername(username) {
    let deferred = Q.defer();
    let db = create_db('gijusers');
    db.view(__design_view, 'findByUsername', {
        key: username
    }, function (err, res) {
        if (err) deferred.reject(err);
        else {
            console.log(res);
            if (res.rows.length){
                console.log('here '+res.rows[0].value);
                deferred.resolve(res.rows[0].value);
            }
            else{
                // console.log('here err');
                // deferred.reject(new Error('ERROR user not found'));
                deferred.resolve('');
            }
        }
    })
    return deferred.promise;
}
app.all('/change_password', function (req, res) {
    let js = {};
    js.client = req.body; //client.data.device
    js.resp = res;
    // if (checkUserPermission(js.client.data.user.username))
    change_password(js.client.data.user.username, js.client.data.user.phonenumber, js.client.data.user.oldpassword, js.client.data.user.newpassword).then(function (res) {
        js.client.data.message = 'OK changed password';
        js.resp.send(js.client);
    }).catch(function (err) {
        js.client.data.message = err;
        js.resp.send(js.client);
    });
    // else
    //     js.resp.send('Error this username has no permission');
});

function change_password_ws(js) {
    let deferred = Q.defer();
    if (js.client.data.user.newpassword != js.client.data.user.confirmpassword) {
        js.client.data.message = new Error('ERROR wrong confirm password');
        deferred.reject(js);
    } else
        r_client.get(_current_system+'_usergui_' + js.client.logintoken, function (err, gui) {
            if(err){
                js.client.data.message = err;
                deferred.reject(js);
            }else{
                if(gui){
                    let c = JSON.parse(gui);
                    gui = c.gui;
                    findUserByGUI(gui).then(function (res) {
                        change_password(js.client.data.user.username, js.client.data.user.phonenumber, js.client.data.user.oldpassword, js.client.data.user.newpassword).then(function (res) {
                            js.client.data.message = 'OK changed password';
                            deferred.resolve(js);
                        }).catch(function (err) {
                            js.client.data.message = err;
                            deferred.reject(js);
                        });
                    });
                }else{
                    js.client.data.message = new Error('gui not found');
                    deferred.reject(js);
                }                            
            }
        });
    return deferred.promise;
}

function checkUserPermission(username) {
    findUserByUsername(username).then(function (res) {
        // console.log(res);
        if (res)
            return true;
        return false;
    }).catch(function (err) {
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
    let db = create_db('gijusers');
    console.log(userinfo);
    db.insert(userinfo, userinfo.gui, function (err, res) {
        if (err) deferred.reject(err);
        else {
            deferred.resolve('OK ' + JSON.stringify(res));
        }
    });
    return deferred.promise;
}

function change_password(username, phone, oldpass, newpass) {
    let deferred = Q.defer();
    let db = create_db('gijusers');
    console.log("username:" + username);
    console.log("phone:" + phone);
    console.log("oldpass:" + oldpass);
    console.log("newpass:" + newpass);
    findUserByUsernameAndPhone(username, phone).then(function (res) {
        console.log('found :' + JSON.stringify(res));
        if (res) {
            if (res.password != oldpass)
                deferred.reject(new Error('ERROR wrong password'));
            let passValidate = validatePassword(newpass);
            if (passValidate.length) deferred.reject(new Error('ERROR validating ' + (passValidate.toString())));
            else {
                res.password = newpass;
                console.log('updating ' + JSON.stringify(res));
                updateUser(res).then(res => {
                    deferred.resolve('OK');
                });
            }
        }
    }).catch(function (err) {
        deferred.reject(err);
    });
    return deferred.promise;
}

function findUserByUsernameAndPhone(username, phone) {
    let deferred = Q.defer();
    let db = create_db('gijusers');
    console.log("finding : " + username + " phone:" + phone);
    db.view(__design_view, 'findByUsernameAndPhone', {
        key: [username, phone]
    }, function (err, res) {
        if (err) deferred.reject(err);
        else {
            if (res.rows.length) {
                //let arr=[];
                deferred.resolve(res.rows[0].value);
            } else {
                deferred.reject(new Error('ERROR Username and phone not found'));
            }
        }
    });
    return deferred.promise;
}


// var terminal    = require("web-terminal");

// terminal(app);

__design_view = "objectList";

function initDB() {

    init_db('gijusers', __design_users);

}

function create_db(dbname) {
    let db;
    nano.db.create(dbname, function (err, body) {
        // specify the database we are going to use    
        if (!err) {
            console.log('database ' + dbname + ' created!');
        } else
            console.log(dbname + " could not be created!");
    });
    db = nano.use(dbname);
    return db;
};

function init_db(dbname, design) {
    // create a new database
    var db;
    async.eachSeries([
        db = create_db(dbname),
        db = nano.use(dbname),
        db.insert(design, function (err, res) {
            if (err) {
                // console.log(design);
                //console.log(err);
                db.get('_design/objectList', function (err, res) {
                    if (err) console.log('could not find design ' + err);
                    else {
                        if (res) {
                            var d = res;
                            //console.log("d:"+JSON.stringify(d));
                            db.destroy('_design/objectList', d._rev, function (err, res) {
                                if (err) console.log(err);
                                else {
                                    //console.log(res);
                                    db.insert(design, "_design/objectList", function (err, res) {
                                        if (err) console.log('err insert new design ' + dbname + err);
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
            } else {
                console.log('created design ' + dbname);
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

/****** INIT DB */
initDB();



Array.prototype.match = function (arr2) {
    var ret = [];
    this.sort();
    arr2.sort();
    for (var i = 0; i < this.length; i += 1) {
        if (arr2.indexOf(this[i]) > -1) {
            ret.push(this[i]);
        }
    }
    return ret;
};


server.listen(6688, "0.0.0.0", function () {
    console.log('Example app listening on port 6688!')
});