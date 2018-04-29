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
    //.is().max(100) // Maximum length 100 
    //.has().uppercase()                              // Must have uppercase letters 
    //.has().lowercase() // Must have lowercase letters 
    //.has().digits() // Must have digits 
    .has().not().spaces()



var userValidator = new passwordValidator();
userValidator.is().min(3)
    //.is().max(12)
    //.has().digits()
    //.lowercase()
    .has().not().spaces();
var phoneValidator = new passwordValidator();
phoneValidator.is().min(10)
    .has().digits()
    .has().not().spaces();
var util = require('util');
const Q = require('q');
const bodyParser = require('body-parser');
var methodOverride = require('method-override');
var _client_prefix = ['ice-maker', 'gij', 'web-post', 'user-management', 'default'];
var _system_prefix = ['ice-maker', 'gij', 'web-post', 'user-management'];
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
    if (command==="set")
        wss.clients.forEach(function each(ws) {
            const element = ws;
            //console.log(element);
            if (_current_system + "_client_" + element.gui===key) {
                console.log('client-changed');
                element.send(JSON.stringify(js));
            }
            if (_current_system + "_error_" + element.gui===key) {
                console.log('error-changed');
                element.send(JSON.stringify(js));
                var l = {
                    log: JSON.stringify(js),
                    logdate: convertTZ(new Date()),
                    type: "error",
                    gui: uuidV4()
                };
                errorLogging(l);
            }
            if (element['client'] !== undefined) {
                if (_current_system + "_login_" + element.client.logintoken===key) {
                    console.log('login-changed');
                    element.send(JSON.stringify(js));
                }
                if (_current_system + "_usergui_" + element.client.logintoken===key) {
                    console.log('usergui-changed');
                    if (_system_prefix.indexOf(element.client.prefix) > -1)
                        element.send(JSON.stringify(js));
                }
                if (_current_system + "_forgot_" + element.client.gui===key) {

                    console.log('forgot-changed');
                    //if (_system_prefix.indexOf(element.client.prefix) > -1)
                    element.send(JSON.stringify(js));
                }
                if (_current_system + "_phone_" + element.client.logintoken===key) {

                    console.log('phone-changed');
                    //if (_system_prefix.indexOf(element.client.prefix) > -1)
                    element.send(JSON.stringify(js));
                }
                if (_current_system + "_secret_" + element.client.gui===key) {

                    console.log('secret-changed');
                    //if (_system_prefix.indexOf(element.client.prefix) > -1)
                    element.send(JSON.stringify(js));
                }
                if (_current_system + "_message_" + element.client.logintoken===key) {
                    console.log('message-changed');
                    //if (_system_prefix.indexOf(element.client.prefix) > -1)
                    element.send(JSON.stringify(js));
                }
                if ("_online_" + element.client.username===key) {
                    console.log('online-changed');
                    // broad cast to all or goup ;
                    element.send(JSON.stringify(js));
                }
                if (_current_system + "_notification_" + element.client.logintoken===key) {
                    console.log('notification-changed');
                    //console.log(js);
                    //if (_system_prefix.indexOf(element.client.prefix) > -1)
                    element.send(JSON.stringify(js));
                }
            }
        });
});

function checkAuthorize(js) {
    let deferred = Q.defer();
    deferred.resolve(js); // JUST BY PASS THIS TEMPORARY
    if (0)
        try {
            let except = ['ping', 'login', 'shake-hands', 'heart-beat', 'register',
                'check-secret', 'get-secret', 'submit-forgot', 'check-forgot', 'reset-forgot',
                'check-username', 'check-password', 'check-phone'
            ];
            if (expt.indexOf(js.client.data.command) > -1) {
                js.client.data.message = 'OK';
                deferred.resolve(js);
            } else {
                r_client.get(_current_system + '_login_' + js.client.logintoken, (err, res) => {
                    if (err) {
                        js.client.data.message = err;
                        deferred.reject(js);
                    } else {
                        res = JSON.parse(res);
                        if (res.client.logintoken) {
                            js.client.data.message = 'OK';
                            deferred.resolve(js);
                        } else {
                            js.client.data.message = new Error('ERROR empty login');
                            deferred.resolve(js);
                        }
                    }
                });
            }

        } catch (error) {
            js.client.data.message = error;
            deferred.reject(js);
        }
    return deferred.promise;
}

function commandReader(js) {
    const deferred = Q.defer();
    // const isValid=validateTopup(js.client);
    // if(!isValid.length)
    try {
        console.log('command : ' + js.client.data.command);
        checkAuthorize(js).then(res => {
            switch (js.client.data.command) {
                case 'ping':
                    console.log('ping test');
                    js.client.data.message = 'PONG test';
                    deferred.resolve(js);
                    break;
                case 'shake-hands':
                    get_client_ws(js).then(res => {
                        deferred.resolve(res);
                    }).catch(err => {
                        deferred.reject(err);
                    });
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
                    console.log('regiseter here');
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
                    check_forgot_ws(js).then(res => {
                        deferred.resolve(res);
                    }).catch(err => {
                        deferred.reject(err);
                    });
                    break;
                case 'reset-forgot':
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
                    check_confirm_phone_ws(js).then(res => {
                        deferred.resolve(res);
                    }).catch(err => {
                        deferred.reject(err);
                    });
                    break;
                case 'update-confirm-phone-sms':
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
                case 'find-by-username':
                    findUserByUsername(js).then(res => {
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
                case 'check-phonenumber':
                    check_phonenumber_ws(js).then(res => {
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
                case 'get-transaction':
                    get_transaction_id_ws(js).then(res => {
                        deferred.resolve(res);
                    }).catch(err => {
                        deferred.reject(err);
                    });
                    break;
                case 'check-transaction':
                    check_transaction_id_ws(js).then(res => {
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
        }).catch(err => {
            throw new Error('Error no authorize');
        });
    } catch (error) {
        js = {};
        js.client = {};
        js.client.data = {};
        js.client.data.message = error;
        deferred.reject(js);
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
        console.log(data);
        js.ws = ws;
        ws.client = data;
        commandReader(js).then(res => {
            //setTimeout(function timeout() {
            // if(!data.client)  data.client={};
            // if(!data.client.gui||data.client.gui==undefined){
            //data.client.gui=uuidV4();
            if (res.client.data.command==='logout') {
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
    r_client.get(_current_system + '_secret_' + js.client.gui, function (err, res) {
        if (err) {
            js.client.data.message = err;
            deferred.reject(js);
        } else {
            // console.log('secret');
            // console.log(res);
            // console.log('secret');
            if (!res) {
                console.log('secret not found');
                js.client.data.message = new Error('ERROR no secret found');
                deferred.reject(js);
            } else {
                let secret = JSON.parse(res).secret;
                // console.log('secret:'+secret);
                // console.log('your secret:'+secret);
                if (secret != js.client.data.secret) {
                    console.log('wrong secret');
                    js.client.data.message = new Error('ERROR wrong secret');
                    deferred.reject(js);
                } else {
                    console.log('secret OK');
                    js.client.data.message = 'OK';
                    deferred.resolve(js);
                }
            }

        }
    });
    return deferred.promise;
}

function get_transaction_id_ws(js) {
    let deferred = Q.defer();
    let t = {};
    t.transactionid = uuidV4();
    t.transactiontime = convertTZ(new Date());
    js.client.data.transaction = t;
    r_client.set(_current_system + '_transaction_' + js.client.gui + js.client.data.transactionid, JSON.stringify({
        command: 'transaction-changed',
        client: js.client
    }), 'EX', 60 * 1, (err, res) => {
        if (err) {
            js.client.data.message = err;
            deferred.reject(js);
        } else {
            if (res) {
                js.client.data.message = 'OK';
                deferred.resolve(js);
            } else {
                js.client.data.message = new Error('ERROR set transaction failed');
                deferred.reject(js);
            }
        }
    });
    return deferred.promise;
}

function check_transaction_id_ws(js) {
    let deferred = Q.defer();
    r_client.get(_current_system + '_transaction_' + js.client.gui + js.client.data.transactionid, (err, res) => {
        if (err) {
            js.client.data.message = err;
            deferred.reject(js);
        } else {
            if (res) {
                const t = JSON.stringify(res);
                js.client.data.message = 'OK transaction';
                js.client.data.transaction = t;
                deferred.resolve(js);
            } else {
                js.client.data.message = new Error('ERROR get transaction failed');
                deferred.reject(js);
            }
        }
    });
    return deferred.promise;
}

function get_secret_ws(js) {
    let deferred = Q.defer();
    let secret = randomSecret(6, '1234567890');
    let content = "secret is: " + secret;
    r_client.get(_current_system + '_secret_' + js.client.gui, (err, res) => {
        if (err) {
            js.client.data.message = err;
            deferred.reject(js);
        } else {
            if (res) {
                js.client.data.message = new Error('ERROR could not send out need 3 minutes');
                deferred.reject(js);
            } else {
                r_client.set(_current_system + '_secret_' + js.client.gui, JSON.stringify({
                    command: 'secret-changed',
                    secret: secret
                }), 'EX', 60 * 3, function (err, res) {
                    if (err) {
                        js.client.data.message = err;
                        setErrorStatus(js.client);
                        deferred.reject(js);
                    } else {
                        js.client.data.message = 'OK';
                        SMSToPhone(js,content, js.client.data.user.phonenumber);
                        deferred.resolve(js);
                    }
                });
            }
        }
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

function check_phonenumber_ws(js) {
    let deferred = Q.defer();
    checkUserByPhone(js.client.data.user.phonenumber).then(function (res) {
        if (res.length) {
            js.client.data.message = new Error('ERROR this phonenumber exist');
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
    // console.log(js.client.prefix);
    // console.log(_system_prefix);
    console.log(_system_prefix.indexOf(js.client['prefix']));
    if (_system_prefix.indexOf(js.client['prefix']) > -1) {
        console.log('exist');
        r_client.get(_current_system + '_usergui_' + js.client.logintoken, function (err, res) {
            if (err) {
                js.client.data.message = err;
                deferred.reject(js);
            } else {
                if (res) {
                    let gui = JSON.parse(res);
                    js.client.data.user = {};
                    js.client.data.message = 'OK';
                    js.client.data.user.gui = gui.gui;
                    deferred.resolve(js);
                } else {
                    js.client.data.message = new Error('ERROR gui not found')
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
    js.client.data.message = 'heart beat';
    r_client.get(_current_system + '_login_' + js.client.logintoken, function (err, res) {
        if (err) {
            js.client.data.message = err;
            setErrorStatus(js.client);
        } else if (res) {
            js.client.data.message = 'heart beat with login';
            r_client.get(_current_system + '_usergui_' + js.client.logintoken, (err, res) => {
                if (err) {
                    js.client.data.message = err;
                    deferred.reject(js);
                } else {
                    res = JSON.parse(res);
                    if (res.gui) {
                        setUserGUIStatus(js.client, res.gui)
                    } else {
                        js.client.data.message = new Error('ERROR gui not found');
                        deferred.reject(js);
                    }
                }
            });
            setLoginStatus(js.client);
            setClientStatus(js.client);
            setOnlineStatus(js.client);

        } else {
            js.client.data.message = 'heart beat no login';
            setClientStatus(js.client)
        };
    });
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
    phonenumber: '',
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
    totalgijspent: 0
}
var defaultUser = {
    username: '@d31n',
    password: '123456',
    phonenumber: '2054445447',
    gui: uuidV4(),
    createddate: convertTZ(new Date()),
    lastupdate: convertTZ(new Date()),
    isactive: true,
    parents: ["default"],
    roles: ['admin', 'user'],
    logintoken: '',
    expirelogintoken: '',
    description: '',
    photo: '',
    note: '',
    system: ['gij', 'web-post', 'user-management', 'ice-maker', 'gps'],
    gijvalue: 0,
    totalgij: 0,
    totalgijspent: 0
}
var sDefaultUsers = [{
        username: 'webpost-admin',
        password: '123456',
        phonenumber: '2055516321',
        gui: uuidV4(),
        createddate: convertTZ(new Date()),
        lastupdate: convertTZ(new Date()),
        isactive: true,
        parents: ["default"],
        roles: ['admin', 'user'],
        logintoken: '',
        expirelogintoken: '',
        description: '',
        photo: '',
        note: '',
        system: ['web-post', 'gij'],
        gijvalue: 0,
        totalgij: 0,
        totalgijspent: 0
    },
    {
        username: 'gij-admin',
        password: '123456',
        phonenumber: '2055516321',
        gui: uuidV4(),
        createddate: convertTZ(new Date()),
        lastupdate: convertTZ(new Date()),
        isactive: true,
        parents: ["default"],
        roles: ['admin', 'user'],
        logintoken: '',
        expirelogintoken: '',
        description: '',
        photo: '',
        note: '',
        system: ['gij'],
        gijvalue: 0,
        totalgij: 0,
        totalgijspent: 0
    },
    {
        username: 'gps-admin',
        password: '123456',
        phonenumber: '2055516321',
        gui: uuidV4(),
        createddate: convertTZ(new Date()),
        lastupdate: convertTZ(new Date()),
        isactive: true,
        parents: ["default"],
        roles: ['admin', 'user'],
        logintoken: '',
        expirelogintoken: '',
        description: '',
        photo: '',
        note: '',
        system: ['gps', 'gij'],
        gijvalue: 0,
        totalgij: 0,
        totalgijspent: 0
    },
    {
        username: 'ice-maker-admin',
        password: '123456',
        phonenumber: '2055516321',
        gui: uuidV4(),
        createddate: convertTZ(new Date()),
        lastupdate: convertTZ(new Date()),
        isactive: true,
        parents: ["default"],
        roles: ['admin', 'user'],
        logintoken: '',
        expirelogintoken: '',
        description: '',
        photo: '',
        note: '',
        system: ['ice-maker', 'gij'],
        gijvalue: 0,
        totalgij: 0,
        totalgijspent: 0
    },
];
app.all('/default_users', function (req, res) {
    let js = {};
    js.client = {};
    js.resp = res;
    js.client.data = {};
    //initDB();
    res.end();

});
app.all('/init_default_user', function (req, res) {
    let js = {};
    js.client = req.body;
    js.resp = res;
    r_client.get(_current_system + '_client_' + js.client.gui, function (err, res) {
        if (err) {
            js.client.data.message = err;
            js.resp.send(js.client);
        }
        if (res) {
            res = JSON.parse(res);
            if (res.gui===js.client.gui)
                if (js.client.secret==='HGT') {
                    init_default_user(js);
                    js.client.data.message = 'init OK by HGT';

                    js.resp.send(js.client);
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
        //js.client.data.message = 'INIT OK ';
        // js.resp.send(js.client);
    });
});

function copyObject(o1, o2) {
    for (const key in o1) {
        o2[key] = o1[key];
    }
}

function loadAdmin(js) {
    let db = create_db('gijusers');
    db.view(__design_view, 'findAdmin', {
        key: 'user-management'
    }, function (err, res) {
        if (err) {
            js.client.data.message = err;
            js.resp.send(js.client);
        } else {
            if (res.rows.length) {
                defaultUser = res.rows[0];
                js.client.data.message = 'OK';
                js.resp.send(js.client);
            } else {
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
        }
    });
}

function init_default_user(js) {
    //let db = create_db('gijusers');
    //console.log('default user:'+defaultUser.username);
    // findUserByUsername(defaultUser.username).then(function (res) {
    //     if (res) {
    nano.db.destroy('gijusers', function (err, body) {
        js.client.data = {};
        js.client.data.message = 'destroy OK';
        nano.db.create('gijusers', function (err, body) {
            // specify the database we are going to use    
            if (!err) {
                console.log('database  created!');
            } else{
                    console.log("gijusers could not be created!");
            }
            let db = nano.use('gijusers');
            db.insert(__design_users, "_design/objectList", function (err, res) {
                if (err) console.log('err insert new design ' + err);
                else {
                    //setTimeout(() => {
                    sDefaultUsers.push(defaultUser);
                    db.bulk({
                        docs: sDefaultUsers
                    }, function (err, res) {
                        if (err) {
                            js.client.data.message = err;
                            js.resp.send(js.client);
                        } else {
                            js.client.data.message = 'OK INIT default users';
                            js.resp.send(js.client);
                        }
                    });
                    //}, 1000*3);
                }
            });
            
        });

    });
    //     } else {
    //         js.client.data = {};
    //         db.insert(defaultUser, defaultUser.gui, function (err, res) {
    //             if (err) {
    //                 js.client.data.message = err;
    //                 js.resp.send(js.client);
    //             } else {
    //                 db.bulk({
    //                     docs: sDefaultUsers
    //                 }, function (err, res) {
    //                     if (err) {
    //                         js.client.data.message = err;
    //                         js.resp.send(js.client);
    //                     } else {
    //                         js.client.data.message = 'OK INIT';
    //                         js.resp.send(js.client);
    //                     }
    //                 });
    //             }
    //         });
    //     }
    // }).catch(function (err) {
    //     js.client.data = {};
    //     js.client.data.message = err;
    //     js.resp.send(js.client);
    // });
}
var __design_users = {
    "_id": "_design/objectList",
    "views": {
        "authentication": {
            "map": "function(doc) {\r\n    if(doc.username.toLowerCase()&&doc.password) {\r\n        emit([doc.username.toLowerCase(),doc.password],doc);\r\n    }\r\n}"
        },
        "findByPhone": {
            "map": "function(doc) {\r\n    if(doc.phonenumber) {\r\n        emit(doc.phonenumber,doc);\r\n    }\r\n}"
        },
        "findByUsernameAndPhone": {
            "map": "function(doc) {\r\n    if(doc.username.toLowerCase()) {\r\n        emit([doc.username.toLowerCase(),doc.phonenumber],doc);\r\n    }\r\n}"
        },
        "findByUsername": {
            "map": "function(doc) {\r\n    if(doc.username.toLowerCase()) {\r\n        emit(doc.username.toLowerCase(),doc);\r\n    }\r\n}"
        },
        "searchByUsername":{
            "map":`function (doc) {
                if(doc.username)
                emit(doc.username, doc);
                //startkey="abc"&endkey="abc\ufff0"
                }`
        },
        "findByUserGui": {
            "map": "function(doc) {\r\n    if(doc.gui) {\r\n        emit(doc.gui,doc);\r\n    }\r\n}"
        },
        "findExist": {
            "map": "function (doc) {\n if(doc.username.toLowerCase()) \n emit(doc.username.toLowerCase(), doc);\n}"
        },
        "changePassword": {
            "map": "function (doc) {\n    emit([doc.username.toLowerCase(),doc.password,doc.phonenumber], doc);\n}"
        },
        "findByRole": {
            "map": "function (doc) {\n   for(var i=0;i<doc.roles.length;i++) emit([doc.roles[i]], doc);\n}"
        },
        "countByRole": {
            "reduce": "_count",
            "map": "function (doc) {\n   for(var i=0;i<doc.roles.length;i++) emit([doc.roles[i]], doc);\n}"
        },
        "findByParent": {
            "map": "function (doc) {\n   for(var i=0;i<doc.parents.length;i++) emit([doc.parents[i]], doc);\n}"
        },
        "searchByParent": {
            "map": "function (doc) {\n   for(var i=0;i<doc.parents.length;i++) if(doc.username)emit([doc.parents[i],doc.username], doc);\n}"
        },
        "countByParent": {
            "reduce": "_count",
            "map": "function (doc) {\n   for(var i=0;i<doc.parents.length;i++) emit([doc.parents[i]], doc);\n}"
        },
        "findAdmin": {
            "map": "function (doc) {\n   for(var i=0;i<doc.system.length;i++) emit([doc.system[i]], doc);\n}"
        },
        "countAdmin": {
            "reduce": "_count",
            "map": "function (doc) {\n   for(var i=0;i<doc.system.length;i++) emit([doc.system[i]], doc);\n}"
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
    if (req.path==='/get_client')
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
//             if (element.username===js.client.username && element.logintoken===js.client.logintoken)
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
//             if (_author_path[i].urlpath===urlpath && _author_path[i].roles.indexOf(roles[index]) > -1)
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
            element = '';
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
    if (client===undefined || null) client = _client;
    if (client.data===undefined || null) client = _client;
}
app.post('/test', function (req, res) {
    res.send('TEST OK');
});

function checkTest() {
    let deferred = Q.defer();
    deferred.resolve('OK');
    return deferred.promise;
}

function checkCurrentClient(client) {
    let deferred = Q.defer();
    r_client.get(_current_system + '_client_' + client.gui, (err, res) => {
        if (err) deferred.reject(err);
        else {
            if (res) {
                deferred.resolve('1');
            } else {
                deferred.resolve('');
            }
        }
    });
    return deferred.promise;
}

function get_client_ws(js) {
    let deferred = Q.defer();
    init_client(js.client);
    checkCurrentClient(js.client).then(res => {
        if (res) {
            js.client.clientip = js.ws._socket.remoteAddress;
            js.client.lastupdate = convertTZ(new Date());
            setClientStatus(js.client);
            deferred.resolve(js);
        } else {
            getClient(js.client).then(function (res) {
                //js.client=res;
                //console.log(js.ws._socket.remoteAddress);
                js.client.clientip = js.ws._socket.remoteAddress;
                js.client.accessedtime = convertTZ(new Date());
                js.client.lastupdate = convertTZ(new Date());
                js.client.timeout = 60 * 60 * 24;
                js.client.logintoken = '';
                js.client.logintime = '';
                //js.client.gui=uuidV4();        
                js.client.data.message = 'OK new client';
                if (!js.client.prefix)
                    js.client.prefix = 'GUEST-' + uuidV4();
                //_client_prefix.push(js.client.prefix);
                //console.log('before send '+JSON.stringify(js.client));
                setClientStatus(js.client);
                deferred.resolve(js);

            }).catch(function (err) {
                //console.log(err);    
                js.client.data.message = err;
                deferred.reject(js);
            });
        }
    }).catch(err => {
        deferred.reject(err);
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
        setClientStatus(js.client);
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
    try {
        authentication(js.client.data.user).then(function (user) {
            console.log('authen res');
            //console.log(res);
            r_client.get('_online_' + user.username, (err, res) => {
                let online = JSON.parse(res);
                if (err) {
                    js.client.data.message = err;
                    js.client.data.user = {};
                    js.client.accessedtime = convertTZ(new Date());
                    //js.resp.send(js.client);
                    deferred.reject(js);
                } else {
                    if(!online){

                    } else{
                        /// need to clear other login 
                        // console.log(online);
                        // if (online.client.login) {
                        //     for (let index = 0; index < online.client.login.length; index++) {
                        //          //// TODO: this FUNCTION TO ALLOW 1 LOGIN TOKEN only
                        //         const element = online.login[index];
                        //         r_client.del(_current_system + '_login_' + element.logintoken);
                        //         r_client.del(_current_system + '_usergui_' + element.logintoken);
                        //     }
                        // }
                    }
                    if (!_client_prefix.match(user.system).length) {
                            js.client.username = '';
                            js.client.data.user = {};
                            js.client.loginip = js.ws._socket.remoteAddress;
                            js.client.logintoken = '';
                            js.client.logintime = '';
                            js.client.data.message = new Error('ERROR not allow this user');
                            deferred.reject(js);
                        }
                        // else if (!res.system.match(['user-management']).length) {
                        //     js.client.username = '';
                        //     js.client.data.user = {};
                        //     js.client.loginip = js.ws._socket.remoteAddress;
                        //     js.client.logintoken = '';
                        //     js.client.logintime = '';
                        //     js.client.data.message = new Error('ERROR user has no an authorization');
                        //     deferred.reject(js);
                        // }
                        else {
                            js.client.username = js.client.data.user.username;
                            js.client.data.user = {};
                            js.client.loginip = js.ws._socket.remoteAddress;
                            js.client.data.message = 'OK Login';
                            js.client.logintoken = uuidV4();
                            js.client.logintime = convertTZ(new Date());
                            //js.resp.send(js.client);
                            //_arrUsers.push(js.client);
                            js.client.data.user = {};
                            setLoginStatus(js.client);
                            setUserGUIStatus(js.client, user.gui);
                            setOnlineStatus(js.client);
                            setTimeout(() => {
                                deferred.resolve(js);
                            }, 1000*3);
                            
                        }                    

                }
            });
        }).catch(function (err) {
            js.client.data.message = err;
            js.client.data.user = {};
            js.client.accessedtime = convertTZ(new Date());
            //js.resp.send(js.client);
            deferred.reject(js);
        });
    } catch (error) {
        js.client.data.message = error;
        js.client.data.user = {};
        js.client.accessedtime = convertTZ(new Date());
        //js.resp.send(js.client);
        deferred.reject(js);
    }

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
    try {
        db.view(__design_view, 'authentication', {
            key: [userinfo.username + '', userinfo.password + '']
        }, function (err, res) {
            console.log('checking login')
            // console.log("res:"+res);
            // console.log("error:"+err);
            if (err) deferred.reject(err);
            else {
                //console.log('login ok')
                if (res) {
                    if (res.rows.length) {
                        deferred.resolve(res.rows[0].value);
                    }
                }
                deferred.reject(new Error('ERROR wrong username or password'));
            }
        });
    } catch (error) {
        deferred.reject(error);
    }

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
    js.client.data.user.system = [];
    console.log('register ws');
    if (_client_prefix.indexOf(js.client.prefix) > -1)
        js.client.data.user.system.push(js.client.prefix);
    else {
        js.client.data.user.system.push('default');
        js.client.data.user.system.push('gij');
    }
    check_secret_ws(js).then(function (res) {
        console.log('check secret confirmed ');
        addNewUser(js.client.data.user).then(function (res) {
            js.client.data.message = 'OK added a new user ';
            r_client.del(_current_system + '_secret_' + js.client.gui);
            deferred.resolve(js);
        }).catch(function (err) {
            console.log('error add new user ');
            console.log(err);
            js.client.data.message = err;
            deferred.reject(js);
        });
    }).catch(function (err) {
        console.log('check secret error ' + err);
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
    js.client.data.user.system.push('gij');
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
    let parents = [];
    if (userinfo.parents===undefined) {
        userinfo.parents = ['default'];
    }
    parents.push(userinfo.parents[0]);
    //console.log(userinfo.confirmpassword+"  -  "+userinfo.password);
    if (userinfo.confirmpassword != userinfo.password)
        deferred.reject(new Error('ERROR wrong confirmed password'));
    else
        checkUserByPhone(userinfo.phonenumber).then(function (res) {
            //console.log('phone length');
            //console.log(res);
            if (res.length) {
                deferred.reject(new Error('ERROR you could not use this phonenumber'));
            } else {
                findUserByUsername(userinfo.username).then(function (res) {
                    if (res) {
                        deferred.reject(new Error('ERROR this user exist'));
                    } else {
                        findUserByUsername(parents[0]).then(function (res) {
                            if (!res) {
                                userinfo.parents.push(defaultUser.username);
                            }
                            userinfo.username = userinfo.username.trim().toLowerCase();
                            if ((r = validateUserInfo(userinfo.username)).length)
                                deferred.reject(r);
                            else if ((r = validatePhoneInfo(userinfo.phonenumber)).length)
                                deferred.reject(r);
                            else if ((r = validatePassword(userinfo.password)).length)
                                deferred.reject(r);
                            else {
                                userinfo.gui = uuidV4();
                                userinfo.createddate = convertTZ(new Date());
                                userinfo.lastupdate = convertTZ(new Date());
                                userinfo.isactive = true;
                                userinfo.roles = ['user'];
                                userinfo.description = "";
                                userinfo.photo = "";
                                userinfo.note = "";
                                userinfo.gijvalue = 0;
                                userinfo.totalgij = 0;
                                userinfo.totalgijspent = 0;
                                db.insert(userinfo, userinfo.gui, function (err, res) {
                                    if (err) deferred.reject(err);
                                    else {
                                        console.log('user added');
                                        //console.log(res);
                                        deferred.resolve(res);
                                    }
                                });
                            }
                        }).catch(function (err) {
                            deferred.reject(err);
                        });
                    }
                }).catch(function (err) {
                    deferred.reject(err);
                });
            }
        }).catch(function (err) {
            deferred.reject(err);
        });

    return deferred.promise;
}

function validateUserInfo(u) {
    console.log(u);
    return userValidator.validate(u, {
        list: true
    });
}

function validatePhoneInfo(p) {
    console.log(p);
    return phoneValidator.validate(p, {
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
            js.cient.data.user.phonenumber = res.phonenumber;
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
    r_client.get(_current_system + '_usergui_' + js.client.logintoken, function (err, gui) {
        if (err) {
            js.client.data.message = err;
            deferred.reject(js);
        } else if (gui) {
            let c = JSON.parse(gui);
            gui = c.gui;
            findUserByGUI(gui).then(function (res) {
                if (res) {
                    // console.log('TEST');
                    // console.log(res);
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
        } else {
            js.client.data.message = new Error('ERROR key not found');
            deferred.reject(js);
        }
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
    try {
        if(phone===js.client.data.user.newphonenumber){
            js.client.data.message = new Error('ERROR old phone number and new phone number are the same ');
            deferred.reject(js);
        }else{
            r_client.get(_current_system + '_phone_' + js.client.gui, (err, res) => {
                if (err) {
                    js.client.data.message = err;
                    deferred.resolve(js);
                } else {
                    if (res) {
                        js.client.data.message = new Error('ERROR could send more message need 3 minutes');
                        deferred.reject(js);
                    } else {
                        validate_phonenumber_ws(js).then(function (res) {
                            findUserByPhone(phone).then(function (res) {
                                if (res) {
                                    findUserByPhone(js.client.data.user.newphonenumber).then(function (res) {
                                        if(res){
                                            js.client.data.message = new Error('ERROR can not use this new phone number');;
                                            deferred.reject(js);
                                        }else{
                                            p.secret = randomSecret(6, '1234567890');
                                            //p.phonenumber=phone;
                                            setPhoneStatus(js.client, p.secret);
                                            SMSToPhone(js, 'your secret is :' + p.secret, js.client.data.user.newphonenumber);
                                            js.client.data.message = 'OK';
                                            deferred.resolve(js);
                                        }
                                    }).catch(err=>{
                                        js.client.data.message = err;
                                        deferred.reject(js);
                                    });
                                } else {
                                    js.client.data.message = new Error('ERROR phone or username not found');;
                                    deferred.reject(js);
                                }
                            }).catch(function (err) {
                                js.client.data.message = err;
                                deferred.reject(js);
                            });
                        }).catch(function (err) {
                            js.client.data.message = err;
                            deferred.reject(js);
                        });
                    }
                }
            });
        }
        
    } catch (error) {
        js.client.data.message = error;
        deferred.reject(js);
    }

    return deferred.promise;
}
app.all('/confirm_phone_sms', function (req, res) {
    let js = {};
    js.client = req.body; //client.data.device
    js.resp = res;
    let p = {};
    let phone = js.client.data.user.phonenumber;
    findUserByUsernameAndPhone(js.client.data.username, phone).then(function (res) {
        if (res) {
            p.secret = randomSecret(6, '1234567890');
            p.phonenumber = phone;
            // phoneSecret.push(p);
            SMSToPhone(js, 'your secret is :' + p.secret, phone);
            js.resp.send('secret sms sent to this phone:' + p.phonenumber);
        }
    }).catch(function (err) {
        js.client.data.message = err;
        js.resp.send(js.client);
    });

});

// function checkPhoneSecret(secret, phone) {
//     for (let index = 0; index < phoneSecret.length; index++) {
//         const element = phoneSecret[index];
//         if (element.secret===secret && element.phonenumber===phone) {
//             return true;
//             delete phoneSecret[index];
//         }
//     }
//     return false;
// }

// function check_phone_secret_ws(js) {
//     let deferred = Q.defer();
//     if (checkPhoneSecret(js.client.data.secret, js.client.data.phonenumber))
//         deferred.resolve('OK');
//     else
//         deferred.reject(new Error('ERROR Wrong secret'));
//     return deferred.promise;
// }
function check_confirm_phone_ws(js) {
    let deferred = Q.defer();
    r_client.get(_current_system + '_phone_' + js.client.gui, function (err, res) {
        if (err) {
            js.client.data.message = err;
            deferred.reject(js);
        } else {
            if (res) {
                res = JSON.parse(res);
                
                // console.log('client');
                // console.log(js.client);
                // console.log('res')
                // console.log(res.secret);
                // console.log((res.secret === js.client.data.secret));

                if (res.secret === js.client.data.secret) {
                    findUserByPhone(js.client.data.user.phonenumber).then(function (res) {
                        if (res) {
                            js.client.data.message = 'OK secret';
                            deferred.resolve(js);
                        } else {
                            js.client.data.message = new Error('ERROR no phonenumber found');
                            deferred.reject(js);
                        }
                    }).catch(function (err) {
                        //console.log(err);
                        js.client.data.message = err;
                        deferred.reject(js);
                    });
                } else {
                    js.client.data.message = new Error('ERROR wrong secret');
                    deferred.reject(js);
                }
            } else {
                js.client.data.message = new Error('ERROR empty secret');
                deferred.reject(js);
            }
        }
    });
    return deferred.promise;
}

function update_phone_ws(js) {
    let deferred = Q.defer();
    r_client.get(_current_system + '_phone_' + js.client.gui, function (err, res) {
        if (err) {
            js.client.data.message = err;
            deferred.reject(js);
        } else {
            if (res) {
                res = JSON.parse(res);
                if (res.secret === js.client.data.secret) {
                    findUserByPhone(js.client.data.user.phonenumber).then(function (res) {
                        if (res) {
                            //client.data.user.password=res.password;
                            if (res.oldphone === undefined)
                                res.oldphone = [];
                            res.oldphone.push(res.phonenumber);
                            res.phonenumber = js.client.data.user.newphonenumber;
                            //delete js.client.data.user.newphonenumber;
                            js.client.data.user.phonenumber = res.phonenumber;
                            updateUser(res).then(function (res) {
                                r_client.del(_current_system + '_phone_' + js.client.gui);
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
            } else {
                js.client.data.message = new Error('ERROR empty secret');
                deferred.reject(js);
            }
        }
    });
    return deferred.promise;
}
// app.all('/update_phone', function (req, res) {
//     let js = {};
//     js.client = req.body; //client.data.device
//     js.resp = res;
//     if (checkPhoneSecret(js.client.data.secret, js.client.data.user.phonenumber))
//         findUserByUsername(client.data.user.username).then(function (res) {
//             if (res) {
//                 //client.data.user.password=res.password;
//                 res.phonenumber = cient.data.user.phonenumber;
//                 updateUser(res).then(function (res) {
//                     js.client.data.message = 'OK updated';
//                     js.resp.send(js.client);
//                 });
//             } else {
//                 throw new Error('ERROR user not found');
//             }
//         }).catch(function (err) {
//             console.log(err);
//             js.client.data.message = err;
//             js.resp.send(js.client);
//         });
//     else {
//         js.client.data.message = new Error('ERROR wrong secret and phone');
//         js.resp.send(js.client);
//     }

// });
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

function countUserListByParentName(username) {
    let deferred = Q.defer();
    let db = create_db('gijusers');
    db.view(__design_view, 'countByParent', {
            key: [username + '']
        },
        function (err, res) {
            if (err) deferred.reject(err);
            else {
                if (rows)
                    deferred.resolve(res.rows[0].value);
                else
                    deferred.reject(0);
            }
        });
}
function searchUserByParentName(parent,username){
    let deferred = Q.defer();
    let db = create_db('gijusers');
    db.view(__design_view, 'searchByParent', {
        startkey: [parent + '',username+''],
        endkey: [parent + '',username+'\ufff0'],
        descending:true,
        limit:30
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
                deferred.resolve({
                    arr: arr,
                    count: count
                });
            } else {
                deferred.reject(new Error('ERROR NO SUB USERS'));
            }
        }
    });
    return deferred.promise;
}
function findUserListByParentName(username) {
    let deferred = Q.defer();
    let db = create_db('gijusers');
    countUserListByParentName(username).then(function (res) {
        let count = res;
        if (res) {
            db.view(__design_view, 'findByParent', {
                key: [username + '']
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
                        deferred.resolve({
                            arr: arr,
                            count: count
                        });
                    } else {
                        deferred.reject(new Error('ERROR NO SUB USERS'));
                    }
                }
            });
        }
    }).catch(function (err) {
        deferred.reject(new Error('ERROR not found by this parent'));
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
    r_client.get(_current_system + '_usergui_' + js.client.logintoken, function (err, gui) {
        if (err) {
            js.client.data.message = err;
            deferred.reject(js);
        } else {
            if (gui) {
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
            } else {
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
        if (res) {
            filterObject(res);
            deferred.resolve(res);
        } else {
            deferred.reject(new Error('ERROR no user profile'));
        }
    }).catch(function (err) {
        deferred.reject(err);
    });
    return deferred.promise;
}

function filterObject(obj) {
    var need = ['gui', '_rev', '_id', 'password', 'oldphone', 'system', 'parents', 'roles', 'isActive'];
    //console.log(key);
    for (var i in obj) {
        //if(i==='password')
        //console.log(obj[i]);
        for (x = 0; x < need.length; x++) {
            let key = need[x];
            if (!obj.hasOwnProperty(i)) {} else if (Array.isArray(obj[i])) {
                obj[i] = '';
            } else if (typeof obj[i]==='object') {
                filterObject(obj[i], need);
            } else if (i.indexOf(key) > -1) {
                obj[i] = '';
            }
        }
    }
    return obj;
}

function cleanUserInfo(element) {
    element._rev = '';
    element._id = '';
    element.gui = '';
    element.oldphone = '';
    element.roles = '';
    element.parents = '';
    element.isactive = '';
    element.system = '';
    element.password = '';
}

function findUserByGUI(gui) {
    let deferred = Q.defer();
    let db = create_db('gijusers');
    db.view(__design_view, 'findByUserGui', {
        key: gui + ''
    }, function (err, res) {
        if (err) deferred.reject(err);
        else {
            let arr = [];
            for (let index = 0; index < res.rows.length; index++) {
                const element = res.rows[index].value;
                //cleanUserInfo(element);
                arr.push(element);
            }
            console.log('FOUND ' + gui);
            if (arr[0].gui === gui)
                deferred.resolve(arr[0]);
            else
                deferred.reject(new Error('ERROR system found more record please contact admin'));
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
    r_client.del(_current_system + '_login_' + js.client.logintoken);
    r_client.del(_current_system + '_usergui_' + js.client.logintoken);
    js.client.data = {};
    js.client.data.user = {};
    js.client.data.command = 'logout';
    js.client.accessedtime = convertTZ(new Date());
    js.client.data.message = 'OK';
    js.client.logintoken = '';
    js.client.loginip = '';
    js.client.logintime = '';
    js.client.username = '';
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
    r_client.del('_client_' + client.gui);
    r_client.del('_login_' + client.logintoken);
    r_client.del('_usergui_' + client.logintoken);
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
    submit_forgot_keys(client.data.user.phonenumber).then(function (res) {
        let content = '';
        content = 'send code to username:' + res.username;
        content += ' with phone number:' + res.phonenumber;
        content += ' please check SMS for keys' + res.keys;

        SMSToPhone(js, content, phone);
        js.client.resp.send(js.client);
    }).catch(function (err) {
        js.client.data.message = err;
        js.resp.send(js.client);
    });
});

function submit_forgot_keys_ws(js) {
    let deferred = Q.defer();
    get_for_got_keys(js).then(function (res) {
        let content = '';
        content = 'send code to username:' + js.client.username;
        content += ' with phone number:' + js.client.data.user.phonenumber;
        content += ' please check SMS for keys ' + js.client.data.forgot;
        js.client.data.forgot = '';
        js.client.data.message = 'OK';
        console.log('forgot here');
        SMSToPhone(js, content, js.client.data.user.phonenumber);
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

function setPhoneStatus(client, secret) {
    r_client.set(_current_system + '_phone_' + client.gui, JSON.stringify({
        command: 'phone-changed',
        secret: secret
    }), 'EX', 60 * 3);
}

function setUserGUIStatus(client, gui) {
    r_client.set(_current_system + '_usergui_' + client.logintoken, JSON.stringify({
        command: 'usergui-changed',
        gui: gui
    }), 'EX', 60 * 60 / 2);
}

function setLoginStatus(client) {
    r_client.set(_current_system + '_login_' + client.logintoken, JSON.stringify({
        command: 'login-changed',
        client: client
    }), 'EX', 60 * 5);
}

function setForgotStatus(client,keys) {
    r_client.set(_current_system + '_forgot_' + client.gui, JSON.stringify({
        command: 'forgot-changed',
        forgot: keys
    }), 'EX', 60 * 3);
}

function setClientStatus(client) {
    r_client.set(_current_system + '_client_' + client.gui, JSON.stringify({
        command: 'client-changed',
        client: client
    }), 'EX', 60 * 5);
}

function setOnlineStatus(client) {
    try {
        r_client.get('_online_' + client.username, (err, res) => {
            if (err) {
                client.data.message = err;
                setErrorStatus(client);
            } else {
                let arr = [{
                    logintoken: client.logintoken,
                    loginip: client.loginip,
                    clientip:client.clientip,
                    gui:client.gui
                }];
                if (res) {                   
                    res=JSON.parse(res);                                    
                    if(res.client.login!==undefined){
                        // res.client.login.push(arr[0]);
                        // arr=res.login;
                        let exist=false;
                        for (let index = 0; index < res.client.login.length; index++) {
                            const element = res.client.login[index];
                            console.log('%s %s %s',element.gui,element.clientip,element.loginip);
                            console.log('%s %s %s',client.gui,client.clientip,client.loginip);

                            if(element.gui===client.gui&&element.clientip===client.clientip&&element.loginip===client.loginip){
                                exist=true;
                                console.log('exist');
                                break;
                            }
                        }
                        if(!exist){
                            arr = res.client.login.concat(arr);                            
                        }  
                    }                                            
                }
                r_client.set('_online_' + client.username, JSON.stringify({
                    command: 'online-changed',
                    client: {
                        username: client.username,
                        onlinetime: convertTZ(new Date()),
                        system: _current_system,
                        login: arr,
                    }
                }), 'EX', 60 * 30 / 2);
            }
        });
    } catch (error) {
        console.log(error);
        client.data.message = error;
        setErrorStatus(client);
    }

}

function setErrorStatus(client) {
    r_client.set(_current_system + '_error_' + client.gui, JSON.stringify({
        command: 'error-changed',
        client: client
    }), 'EX', 60 * 5);
}

function setNotificationStatus(client) {
    r_client.set(_current_system + '_notification_' + client.logintoken, JSON.stringify({
        command: 'notification-changed',
        client: client
    }), 'EX', 60 * 60 / 2); // client side could not see this , the other server as a client can see this .
}

function LTCserviceSMS(client) {
    try {
        client.data.command = 'send-sms'
        client.prefix = 'user-management';
        let ws_client = new WebSocket('ws://nonav.net:8081/'); //ltcservice
        ws_client.on('open', function open() {
            ws_client.send(JSON.stringify(client), function (err) {
                if (err) {
                    client.data.message = err;
                    client.data.sms.content='';
                    setErrorStatus(client);                    
                }
                console.log('socket open...');
                //client.data.sms.content=''; /// FOR TESTING ONLY
                client.data.message = 'SMS has been sent out'; 
                client.prefix = '';                
                setNotificationStatus(client);

            });
        });
        ws_client.on('message', function incoming(data) {
            console.log("RECIEVED  FROM SMS : ");
            
            client = JSON.parse(data);
            //console.log(client);
            //client.data.sms.content=''; /// FOR TESTING ONLY
            client.data.message = 'SMS recieved!'; 
            client.data.command = 'recieved-sms';
            client.prefix = '';
            
            setNotificationStatus(client);
            //setOnlineStatus(client);
    
        });
        ws_client.on("error", (err) => {
            client.data.message = err;            
            setErrorStatus(client);
        });     
    } catch (error) {
        client.data.message = err;
        setErrorStatus(client);
    }
   
}
//SMSToPhone('TEST','2055516321');
function SMSToPhone(js, content, phone) {
    try {
        //client.gui = clientgui;
        // js.client.data = {};
        js.client.data.sms = {};
        js.client.data.sms.phonenumber = phone;
        js.client.data.sms.content = content;
        // client.data.command = 'send-sms';
        // js.client = {};
        // js.client.data = {};
        // js.client.data.user = {};
        // js.client.data.user.phonenumber = phone;
        console.log('send secret: ' + content);
        validate_phonenumber_ws(js).then(function (res) {
            console.log('validate: ' + res);
            if (res) {
                console.log('SMS to ' + js.client.data.sms.phonenumber);
                LTCserviceSMS(js.client);
            }
        }).catch(function (err) {
            throw err;
        });
    } catch (error) {
        throw error;
    }
}

//var _arrForgotKeys = [];
//const crypto = require("crypto");

//const id = crypto.randomBytes(16).toString("hex");
function generateFogotKeys(username) {
    return crypto.randomBytes(2).toString("base64");
}

function get_for_got_keys(js) {
    //SMS to phone the forgot key
    let deferred = Q.defer();
    //console.log('forgot here 0'+js.client.data.user.phonenumber);
    //console.log(js);
    r_client.get(_current_system + '_forgot_' + js.client.gui, (err, res) => {
        if (err) {
            deferred.reject(err);
        } else {
            if (res) {
                deferred.reject(new Error('ERROR could not send next sms need 3 minutes'));
            } else {
                findUserByPhone(js.client.data.user.phonenumber).then(function (res) {
                    if(res){
                        let keys = randomSecret(6, '1234567890');
                        js.client.username = res.username;
                        js.client.data.forgot = keys;
                        setForgotStatus(js.client,keys);
    
    
                        //console.log('forgot here 1');
                        //js.client.data.message='OK';
                        deferred.resolve("OK");
                    }                   
                    else{
                        deferred.reject(new Error('ERROR phone number not found'));
                    }
                }).catch(function (err) {
                    // console.log(err);
                    //js.client.data.message=err;
                    deferred.reject(err);
                });
            }
        }
    });
    return deferred.promise;
}

function checkUserByPhone(phone) {
    let deferred = Q.defer();
    let db = create_db('gijusers');
    db.view(__design_view, 'findByPhone', {
        key: phone + ''
    }, function (err, res) {
        if (err) deferred.reject(err);
        else {
            let arr = [];
            if (res.rows.length) {
                arr.push(res.rows[0].value);
            }
            deferred.resolve(arr);
        }
    });
    return deferred.promise;
}

function findUserByPhone(phone) {
    let deferred = Q.defer();
    let db = create_db('gijusers');
    db.view(__design_view, 'findByPhone', {
        key: phone + ''
    }, function (err, res) {
        if (err) deferred.reject(err);
        else {
            if (res.rows.length) {
                //console.log(res);
                deferred.resolve(res.rows[0].value);
            } else
            deferred.resolve('');
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
    // console.log(js);
    reset_password(js).then(function (res) {
        //console.log('forgot pass');
        js.client.data.message = res;
        deferred.resolve(js);
    }).catch(function (err) {
        js.client.data.message = err;
        deferred.reject(js);
    });
    return deferred.promise;
}

function check_forgot_ws(js) {
    let deferred = Q.defer();
    findUserByPhone(js.client.data.user.phonenumber).then(function (res) {
        if(res){
            r_client.get(_current_system + '_forgot_' + js.client.gui, function (err, res) {
                if (err) deferred.reject(err);
                else {
                    if (res) {
                        res = JSON.parse(res);
                        if (res.forgot===js.client.data.forgot) {
                            console.log('check forgot OK');
                            js.client.data.message = 'OK check forgot';
                            deferred.resolve(js);
                        } else
                            js.client.data.message = (new Error('ERROR wrong keys'));
                        deferred.reject(js);
                    } else {
                        js.client.data.message = (new Error('ERROR empty keys'));
                        deferred.reject(js);
                    }
    
                }
            });
        }else{
            deferred.reject(new Error('ERROR phone number not found'));
        }
    }).catch(function (err) {
        deferred.reject(err);
    });

    return deferred.promise;
}

function reset_password(js) {
    let deferred = Q.defer();
    r_client.get(_current_system + '_forgot_' + js.client.gui, function (err, res) {
        if (err) deferred.reject(err);
        else {
            if (res) {
                res = JSON.parse(res);
                if (res.forgot===js.client.data.forgot) {
                    findUserByPhone(js.client.data.user.phonenumber).then(function (res) {
                        if(res){
                            res.password = "123456";
                            updateUser(res).then(function (res) {
                            r_client.del(_current_system + '_forgot_' + js.client.gui);
                            deferred.resolve('OK 123456');
                        });
                        }else{
                            deferred.reject(new Error('ERROR phone number not found'));
                        }                        
                    }).catch(function (err) {
                        deferred.reject(err);
                    });
                } else
                    deferred.reject(new Error('ERROR wrong keys'));
            } else
                deferred.reject(new Error('ERROR empty keys'));
        }
    });

    return deferred.promise;
}
function searchUserByUsername(username){
    try {
        let deferred = Q.defer();
        let db = create_db('gijusers');
        db.view(__design_view, 'searchByUsername', {
            startkey: username + '',
            endkey:username +'\ufff0"',
            limit:30,
            descending:true,
        }, function (err, res) {
            if (err) deferred.reject(err);
            else {
                //console.log(res);
                let arr=[];
                for (let index = 0; index < res.rows.length; index++) {
                    const element = res.rows[index].value;
                    arr.push(element);
                }
                deferred.resolve(arr);
            }
        });    
    } catch (error) {
       deferred.reject(error); 
    }
    
    return deferred.promise;
}
function findUserByUsername(username) {
    let deferred = Q.defer();
    let db = create_db('gijusers');
    db.view(__design_view, 'findByUsername', {
        key: username + ''
    }, function (err, res) {
        if (err) deferred.reject(err);
        else {
            //console.log(res);
            if (res.rows.length) {
                console.log('here ' + res.rows[0].value);
                deferred.resolve(res.rows[0].value);
            } else {
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
    change_password(js, js.client.data.user.phonenumber, js.client.data.user.oldpassword, js.client.data.user.newpassword).then(function (res) {
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
        r_client.get(_current_system + '_usergui_' + js.client.logintoken, function (err, gui) {
            if (err) {
                js.client.data.message = err;
                deferred.reject(js);
            } else {
                if (gui) {
                    let c = JSON.parse(gui);
                    gui = c.gui;
                    findUserByGUI(gui).then(function (res) {
                        change_password(js, js.client.data.user.phonenumber, js.client.data.user.oldpassword, js.client.data.user.newpassword).then(function (res) {
                            js.client.data.message = 'OK changed password';
                            deferred.resolve(js);
                        }).catch(function (err) {
                            js.client.data.message = err;
                            deferred.reject(js);
                        });
                    });
                } else {
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
    // let id = ((userinfo.gui !== userinfo._id) userinfo._id : userinfo.gui);
    db.insert(userinfo, userinfo._id, function (err, res) {
        if (err) deferred.reject(err);
        else {
            deferred.resolve('OK ' + JSON.stringify(res));
        }
    });
    return deferred.promise;
}

function change_password(js, phone, oldpass, newpass) {
    let deferred = Q.defer();
    let db = create_db('gijusers');
    let username=js.client.username;
    let gui=js.client.gui;
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
                    content = 'your password has been changed';
                    SMSToPhone(js, content, phone);
                    deferred.resolve('OK');
                }).catch(err => {
                    deferred.reject(err);
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
        key: [username + '', phone + '']
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
                            db.insert(design, "_design/objectList", function (err, res) {
                                if (err) console.log('err insert new design ' + dbname + err);
                                else {
                                    //console.log('insert design completed ' + dbname);
                                }
                            });
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
//initDB();


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