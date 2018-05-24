import * as moment from 'moment-timezone';
import * as express from "express";
import * as crypto from 'crypto';
import * as request from 'request';
import * as Nano from 'nano';
import * as async from 'async';
import * as uuidV4 from 'uuid';
import * as cors from 'cors';
import * as fs from 'fs';
import * as http from 'http';
import * as redis from 'redis';
import * as __browser from 'detect-browser';
import * as path from 'path'
import * as passwordValidator from 'password-validator';
import * as util from 'util';
import * as Q from 'q';
import * as bodyParser from 'body-parser';
import * as methodOverride from 'method-override';
import * as WebSocket from 'ws';
import { RequestHandlerParams } from 'express-serve-static-core';
import { Request, NextFunction, ErrorRequestHandler, Response } from "express";
import { NextHandleFunction } from 'connect';
import { POINT_CONVERSION_COMPRESSED } from 'constants';
// import { Module } from 'module';//
declare global {
    interface Array<T> {
        match(arr2: Array<T>): Array<T>;
    }
}
export interface client {
    gui: '',
    username: '',
    logintoken: '',
    logintime: '',
    loginip: '',
    data: any,
    auth: any
};

export interface gijuser {
    username: string;
    password: string;
    confirmpassword: string;
    phonenumber: string;
    gui: string;
    createddate: Date;
    lastupdate: Date;
    isactive: boolean;
    parents: Array<string>;
    roles: Array<string>;
    logintoken: string;
    expirelogintoken: string;
    description: string;
    photo: Array<photoObj>;
    note: string;
    system: Array<string>;
    gijvalue: number;
    totalgij: number;
    totalgijspent: number;
    oldphone: Array<string> | undefined;
}
export interface phoneObj {
    command: string;
    secret: string;
}
export interface loginObj {
    command: string;
    client: any;
}
export interface guiObj {
    command: string;
    gui: string;
}
export interface onlineObj {
    command: string;
    client: {
        username: string;
        onlinetime: Date;
        system: string;
        login: Array<any>;
    }
}
export interface photoObj {
    name: string;
    arraybuffer: string;
    type: string;
    url: string;
}
export interface targetObj {
    "_deleted": boolean,
    "_id": string,
    "_rev": string,
    "gui": string,
    "targetid": string,
    "usergui": string,
    username: string,
    "memberusername": Array<string>,
    "membergui": Array<string>,
    "exmember": Array<string>,
    "pendingmemberapproval": Array<string>,
    "deniedapprovlalist": Array<string>,
    "pendinginvited": Array<string>,
    "refusedinvited": Array<string>,
    "blacklist": Array<string>,
    "createddate": Date,
    "msg": Array<msgObj>
}
export interface receivedObj {
    "username": string,
    "received": Date
}
export interface readObj {
    "username": string,
    "read": Date
}
export interface msgObj {
    "gui": string,
    "sender": string,
    "content": string,
    "msgtype": string,
    "attached": Array<any>,
    "sent": Date,
    "received": Array<receivedObj>,
    "read": Array<readObj>
}










class App {

    private _current_system = 'user-management';

    private _client_prefix = ['ice-maker', 'gij', 'web-post', 'user-management', 'default'];
    private _system_prefix = ['ice-maker', 'gij', 'web-post', 'user-management'];
    private ws_client: WebSocket;
    private wsoption: WebSocket.ServerOptions;
    private wss: WebSocket.Server;
    public server: http.Server;
    private _usermanager_host: string;
    private _usermanager_ws: string;
    private app: express.Application = express();
    private nano: any;
    private r_client: redis.RedisClient;
    private passValidator: any;
    private userValidator: any;
    private phoneValidator: any;
    // private _current_system: string;
    // private __design_view: string = "objectList";
    initWebsocket(): any {
        let parent = this;
        // this.ws_client = new WebSocket(this._usermanager_ws); // user-management

        this.wss.on('connection', (ws, req) => {
            const ip = req.connection.remoteAddress;
            console.log('connection from ' + ip);
            //const ip = req.headers['x-forwarded-for'];
            ws['isAlive'] = true;
            ws.binaryType = 'arraybuffer';
            ws['client'] = {};
            ws['client'].auth = {};
            ws['gui'] = '';
            ws['lastupdate']
            ws.on('pong', () => {
                ws['isAlive'] = true;
                // if (!ws['lastupdate'] && !ws['gui']) {
                //     ws['isAlive'] = false;
                // }
                // let startDate = moment(ws['lastupdate'])
                // let endDate = moment(parent.this.convertTZ(new Date()));
                // const timeout = endDate.diff(startDate, 'seconds');
                // if (timeout > 60 * 3)
                //     ws['isAlive'] = false;
                // else
                //     ws['isAlive'] = true;

                // console.log('HEART BEAT:' + ws['gui'] + " is alive:" + ws['isAlive'] + " " + ws['lastupdate'] + " timeout" + timeout);
                // //this.send(this.client);
            });
            ws.on('error', (err) => {
                //js.client.data.message=JSON.stringify(err);
                var l = {
                    log: err,
                    logdate: parent.convertTZ(new Date()),
                    type: "error",
                    gui: uuidV4()
                };
                parent.errorLogging(l);
            })
            ws.on('message', (data) => {
                let js = {};
                try {
                    let b = parent.ab2str(data);                    
                    let s = Buffer.from(b, 'base64').toString();                    
                    js['client'] = JSON.parse(s);
                    //console.log(js.client)                    
                    js['ws'] = ws;
                    ws['lastupdate'] = parent.convertTZ(new Date());
                    ws['isAlive'] = true;
                    ws['gui'] = js['client'].gui;
                    js['client'].auth = {};
                    ws['client'] = js['client'];
                    //console.log(ws['client']);
                    parent.commandReader(js).then(res => {
                        js = res;
                        ws['gui'] = js['client'].gui;
                        ws['client'] = js['client'];
                        ws['lastupdate'] = parent.convertTZ(new Date());

                        if (res['client'].data.command === 'logout') {
                            ws['gui'] = '';
                            ws['client'] = '';
                            ws['lastupdate'] = '';
                        }
                        if (parent._system_prefix.indexOf(js['client'].prefix) < 0) {
                            console.log('clear auth')
                            delete js['client'].auth;
                            //parent.filterObject(js['client'].data);
                        }
                        console.log('sending');
                        //console.log(js['client']);
                        let b = Buffer.from(JSON.stringify(js['client'])).toString('base64');
                        //console.log(b);
                        //let a = Buffer.from(b);
                        //console.log(a);
                        ws.send(JSON.stringify(b), {
                            binary: true
                        });
                    }).catch(err => {
                        js = err;
                        var l = {
                            log: js['client'].data.message,
                            logdate: parent.convertTZ(new Date()),
                            type: "error",
                            gui: uuidV4()
                        };
                        //console.log(err);
                        parent.errorLogging(l);
                        console.log('ws sending');
                        ws['client'] = js['client'];
                        ws['lastupdate'] = parent.convertTZ(new Date());
                        js['client'].data.message = js['client'].data.message.message;
                        parent.filterObject(js['client'].auth);
                        let b = Buffer.from(JSON.stringify(js['client'])).toString('base64');
                        //console.log(b);
                        let a = Buffer.from(b);
                        //console.log(a);
                        ws.send(JSON.stringify(b), {
                            binary: true
                        });
                    });
                } catch (error) {
                    console.log(error);
                    js['client'].data.message = error.message;
                    ws['client'] = js['client'];
                    ws['lastupdate'] = parent.convertTZ(new Date());
                    parent.filterObject(js['client'].auth);
                    let b = Buffer.from(JSON.stringify(js['client'])).toString('base64');
                    //console.log(b);
                    let a = Buffer.from(b);
                    //console.log(a);
                    ws.send(JSON.stringify(b), {
                        binary: true
                    });
                }

            });

        });
        const interval = setInterval(() => {
            this.wss.clients.forEach((ws) => {
                try {
                    if (ws['isAlive'] === false) {
                        console.log(ws['gui'] + 'ws terminated')
                        return ws.terminate();
                    }
                    console.log('TIME INTERVAL');
                    ws['isAlive'] = false;
                    ws.ping(() => { });
                } catch (error) {
                    console.log(error);
                }
            });
        }, 60000); // set 60 seconds 

    }

    convertTZ(fromTZ) {
        return moment.tz(fromTZ, "Asia/Vientiane").toDate();
    }


    monitor_redis(time, args, raw_reply) {
        //console.log(time + ": " + args); // 1458910076.446514:['set', 'foo', 'bar']
        //console.log(time);
        try {
            args = args.toString();
            if (args.indexOf('set') != 0) //capture the set command only
                return;
            //args=args.replace('/','');

            let arr = args.split(',');
            //console.log(arr);
            let command = arr[0];
            let key = arr[1];
            // console.log(_current_system);
            // console.log(key+'-----......'+key.indexOf(_current_system));
            if (key.indexOf(this._current_system) < 0) {
                //console.log('wrong system');
                return;
            }
            let js;
            try {
                js = JSON.parse(args.substring(args.indexOf('{'), args.lastIndexOf('}') + 1));
                //console.log(time + ": " + args); 
            } catch (error) {
                console.log(time + ": " + args);
                console.log(error);

                return;
            }


            let mode = '';
            let timeout = 0;
            if (arr[arr.length - 1].indexOf('}') < 0) {
                mode = arr[arr.length - 2];
                timeout = arr[arr.length - 1]
            }
            //let clients = this.wss.clients;
            if (command === "set") {
                //console.log(this.wss.clients.size);
                this.wss.clients.forEach((ws) => {
                    const element = ws;
                    //console.log(element);
                    if (element.readyState !== element.OPEN) {
                        console.error('Client state is ' + element.readyState);
                        return;
                    }
                    if (this._current_system + "_client_" + element['gui'] === key) {
                        console.log('client-changed');
                        //console.log(time);
                        //console.log(`key: ${key} \n gui: ${element['gui']} \nsystem:${this._current_system}`);
                        let b = Buffer.from(JSON.stringify(element['client'])).toString('base64');
                        element.send(JSON.stringify(b), {
                            binary: true
                        });
                        //return;
                    }
                    if (this._current_system + "_error_" + element['gui'] === key) {
                        console.log('error-changed');
                        let b = Buffer.from(JSON.stringify(element['client'])).toString('base64');
                        element.send(JSON.stringify(b), {
                            binary: true
                        });

                        var l = {
                            log: JSON.stringify(js),
                            logdate: this.convertTZ(new Date()),
                            type: "error",
                            gui: uuidV4()
                        };
                        this.errorLogging(l);
                    }
                    if (element['client'] !== undefined) {
                        if (this._current_system + "_login_" + element['client'].logintoken === key) {
                            console.log('login-changed');
                            let b = Buffer.from(JSON.stringify(element['client'])).toString('base64');
                            element.send((JSON.stringify(b)), {
                                binary: true
                            });

                        } else if (this._current_system + "_usergui_" + element['client'].logintoken === key) {
                            // console.log('usergui-changed');
                            // if (_system_prefix.indexOf(element['client'].prefix) > -1)                        
                            //     element.send(Buffer.from(JSON.stringify(js.gui)), {
                            //         binary: true
                            //     });

                        } else if (this._current_system + "_forgot_" + element['client'].gui === key) {

                            console.log('forgot-changed');
                            //if (_system_prefix.indexOf(element['client'].prefix) > -1)
                            let b = Buffer.from(JSON.stringify(element['client'])).toString('base64');
                            element.send((JSON.stringify(b)), {
                                binary: true
                            });

                        } else if (this._current_system + "_phone_" + element['client'].logintoken === key) {

                            console.log('phone-changed');
                            //if (_system_prefix.indexOf(element['client'].prefix) > -1)
                            let b = Buffer.from(JSON.stringify(element['client'])).toString('base64');
                            element.send((JSON.stringify(b)), {
                                binary: true
                            });

                        } else if (this._current_system + "_secret_" + element['client'].gui === key) {

                            console.log('secret-changed');
                            //if (_system_prefix.indexOf(element['client'].prefix) > -1)
                            let b = Buffer.from(JSON.stringify(element['client'])).toString('base64');
                            element.send((JSON.stringify(b)), {
                                binary: true
                            });

                        } else if (this._current_system + "_message_" + element['client'].logintoken === key) {
                            console.log('message-changed');
                            //if (_system_prefix.indexOf(element['client'].prefix) > -1)
                            let b = Buffer.from(JSON.stringify(element['client'])).toString('base64');
                            element.send((JSON.stringify(b)), {
                                binary: true
                            });

                        } else if (this._current_system + "_online_" + element['client'].username === key) {
                            console.log('online-changed');
                            // broad cast to all or goup ;
                            // console.log(js);
                            // console.log(time + ": " + args);
                            let b = Buffer.from(JSON.stringify(element['client'])).toString('base64');
                            element.send((JSON.stringify(b)), {
                                binary: true
                            });

                        } else if (this._current_system + "_notification_" + element['client'].gui === key) {
                            console.log('notification-changed');
                            //console.log(js);
                            //if (_system_prefix.indexOf(element['client'].prefix) > -1)
                            let b = Buffer.from(JSON.stringify(element['client'])).toString('base64');
                            element.send((JSON.stringify(b)), {
                                binary: true
                            });

                        }
                        // this.r_client.get(this._current_system + '_online_' + element['client'].username, (err, res)=> {
                        //     if(err)throw err;
                        //     else if (res) {
                        //         let client = JSON.parse(client);
                        if (this._current_system + '_msg_' + element['client'].username === key) {
                            // this.r_client.get(this._current_system + '_msg_' + element['client'].username, (err, res)=> {
                            //     if(err)throw err;
                            //     else if(res){
                            console.log('msg-changed');
                            let b = Buffer.from(JSON.stringify(element['client'])).toString('base64');
                            element.send((JSON.stringify(b)), {
                                binary: true
                            });
                            //     }
                            // });


                        }
                        //     }
                        // });
                    }
                });
            }
        } catch (error) {
            var l = {
                log: error,
                logdate: this.convertTZ(new Date()),
                type: "error",
                gui: uuidV4()
            };
            this.errorLogging(l);
            console.log(time + ": " + args);
            console.log(l);

        }


    }


    constructor() {
        if (!Array.prototype.match) {
            Array.prototype.match = function <T>(arr2: any[]): any[] {
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
        }
        this._usermanager_host = 'http://nonav.net:6688';
        // this._usermanager_ws = 'ws://nonav.net:6688';
        this._usermanager_ws = 'ws://localhost:6688';

        this.nano = Nano('http://admin:admin@localhost:5984');

        this.r_client = redis.createClient();
        const checkPrefix = (req, res, next) => {
            let js = {};
            //js.client.ip=req.ip;
            js['client'] = req.body;
            console.log('using path' + req.path);
            if (req.path === '/get_client')
                next();
            else if (this._client_prefix.indexOf(js['client'].prefix) > -1) {
                next();
            } else next();
            //TESTING
            //else res.send(new Error('ERROR NOT ALLOW'));
        }

        this.config();

        this.initWebsocket();
        this.r_client.monitor((err: any, res: any): any => {
            console.log("Entering monitoring mode.");
        })
        this.r_client.on('monitor', this.monitor_redis.bind(this));

        this.passValidator = new passwordValidator();
        this.passValidator.is().min(6) // Minimum length 8 
            .is().max(100) // Maximum length 100 
            //.has().uppercase()                              // Must have uppercase letters 
            ///.has().lowercase() // Must have lowercase letters 
            //.has().digits() // Must have digits 
            .has().not().spaces()


        this.userValidator = new passwordValidator();
        this.userValidator.is().min(3)
            .is().max(12)
            //.has().digits()
            .has().lowercase()
            .has().not().spaces();
        this.phoneValidator = new passwordValidator();
        this.phoneValidator.is().min(9)
            .has().digits()
            .has().not().spaces();
        // this.storage= multer.diskStorage({
        //     destination: (req, file, callback) =>{
        //         callback(null, __dirname + '/temp');
        //     },
        //     filename: (req, file, callback) =>{
        //         console.log(file)
        //         callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
        //     }
        // });


        this.initDB();
        // this.deleteAllWorkingDoc().then(res => {
        //     this.restoreWorkingBackupFile();
        // });
        // this.deleteAllParkingDoc().then(res=>{
        //     console.log(res);
        //     this.restoreParkingBackupFile();
        // }).catch(err=>{
        //     console.log(err);
        // });
    }
    private config(): void {
        this.app.set('trust proxy', true);
        this.app.use(methodOverride());
        this.app.use(cors());
        this.app.use(bodyParser.json());
        // this.app.use(bodyParser.urlencoded({ extended: false }));
        this.server = http.createServer(this.app);
        this.routes();


        /// WEBSOCKET
        this.wsoption = {};
        this.wsoption.server = this.server;
        this.wsoption.perMessageDeflate = false;
        this.wss = new WebSocket.Server(this.wsoption);

    }
    private routes(): void {
        const router = express.Router();
        this.app.use('/public', express.static(__dirname + '../../../public'));
        this.app.use(this.errorHandler);
        router.all('/', (req: Request, res: Response) => {
            //this.clog('OK Test');
            res.sendFile(path.join(__dirname + '../../../index.html'));
        });

        this.app.use('/', router);

        // this.app.all('/', (req: Request, res: Response) => {
        //     this.clog('OK Test');
        //     res.sendFile(path.join(__dirname + '../../../index.html'));
        // });
    }
    checkAuthorize(js) {
        let deferred = Q.defer();
        //deferred.resolve(js); // JUST BY PASS THIS TEMPORARY
        //if (0)
        try {
            let except = ['ping', 'login', 'shake-hands', 'heart-beat', 'register',
                'check-secret', 'get-secret', 'submit-forgot', 'check-forgot', 'reset-forgot',
                'check-username', 'check-password', 'check-phone'
            ];
            if (except.indexOf(js.client.data.command) > -1) {
                js.client.data.message = 'OK';
                deferred.resolve(js);
            } else {
                this.r_client.get(this._current_system + '_login_' + js.client.logintoken, (err, r) => {
                    if (err) {
                        js.client.data.message = err;
                        deferred.reject(js);
                    } else {
                        if (r) {
                            let res = JSON.parse(r) as loginObj;
                            if (res.client.logintoken !== undefined) {
                                js.client.data.message = 'OK';
                                this.r_client.get(this._current_system + '_usergui_' + js.client.logintoken, (err, r) => {
                                    if (err) {
                                        js.client.data.message = err;
                                        deferred.reject(js);
                                    } else {
                                        let res = JSON.parse(r) as guiObj;
                                        if (res.gui) {
                                            js.client.data.message = 'OK authorized'
                                            js.client.auth = {};
                                            js.client.auth.gui = res.gui;
                                            deferred.resolve(js);
                                        } else {
                                            js.client.data.message = new Error('ERROR empty login');
                                            deferred.resolve(js);
                                        }
                                    }
                                });
                            } else {
                                js.client.data.message = new Error('ERROR empty login');
                                deferred.resolve(js);
                            }
                        }
                        else {
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

    commandReader(js) {
        const deferred = Q.defer();
        // const isValid=validateTopup(js.client);
        // if(!isValid.length)
        try {
            console.log('command : ' + js.client.data.command);
            this.checkAuthorize(js).then(res => {
                switch (js.client.data.command) {
                    case 'ping':
                        console.log('ping test');
                        js.client.data.message = 'PONG test';
                        deferred.resolve(js);
                        break;
                    case 'get-upload':
                        try {
                            let fpath = __dirname + '/public/profiles/' + js.client.data.user.photo[0].name;
                            //console.log(fpath);
                            let buff = fs.readFileSync(fpath, 'binary');
                            console.log(buff);
                            js.client.data.user.photo[0].arraybuffer = '/public/profiles/' + js.client.data.user.photo[0].name;
                            //console.log(js.client.data.user.photo);
                            js.client.data.message = 'OK get upload'

                        } catch (error) {
                            console.log(error);
                        }
                        deferred.resolve(js);
                        break;
                    case 'upload':
                        const photo = {
                            arraybuffer: '',
                            url: '',
                            name: '',
                            lastmodifieddate: '',
                            size: '',
                            type: '',
                        };
                        let ps = js.client.data.user.photo;
                        for (let index = 0; index < ps.length; index++) {
                            const element = ps[index];
                            console.log('writing');
                            //console.log(element.arraybuffer);
                            // console.log(__dirname+'/'+element.name);
                            let buff = element.arraybuffer.replace(/^data:image\/\w+;base64,/, '');
                            // let buff=new Buffer(element.arraybuffer);
                            //console.log(buff);
                            fs.writeFile(__dirname + '/public/profiles/' + element.name, buff, {
                                encoding: 'base64'
                            }, (err) => {
                                if (err) {
                                    js.client.data.message = err;
                                    console.log(err);
                                    deferred.reject(js);
                                } else {
                                    console.log('OK');
                                    console.log(__dirname + '/' + element.name);
                                    js.client.data.message = 'OK upload'
                                    deferred.resolve(js);
                                }
                            });
                            js.client.data.message = 'OK upload'
                            deferred.resolve(js);
                        }
                        break;
                    case 'register-conversation':
                        this.register_online_chat(js, js.client.auth.gui).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'update-blacklist':
                        this.black_list_online_chat(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'invite':
                        this.invite_online_chat(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'accept-invitation':
                        this.accpet_invite_online_chat(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'arpprove-member':
                        this.approve_member_online_chat(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'leave-conversation':
                        this.leave_online_chat(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'ubscribe-conversation':
                        this.subscribe_online_chat(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'send-message':
                        this.send_message(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'shake-hands':                        
                        this.get_client_ws(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;

                    case 'login':
                        this.login_ws(js).then(res => {
                            deferred.resolve(res);
                            //console.log(res);
                            js.ws.lastupdate = this.convertTZ(new Date());
                        }).catch(err => {
                            //console.log(err);
                            deferred.reject(err);
                        });
                        break;
                    case 'logout':
                        this.logout_ws(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'register':
                        console.log('regiseter here');
                        this.register_ws(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'add-sub-user':
                        console.log('SUB USER>>>>>>>>>>>>>>>>>');
                        console.log(js.client);
                        this.addNewUserManual_WS(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'check-forgot':
                        this.check_forgot_ws(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'reset-forgot':
                        this.forgot_password_ws(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'submit-forgot':
                        this.submit_forgot_keys_ws(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;

                    case 'change-password':
                        // console.log(js.client);
                        this.change_password_ws(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'send-confirm-phone-sms':
                        this.send_confirm_phone_sms_ws(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'check-confirm-phone-sms':
                        this.check_confirm_phone_ws(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'update-confirm-phone-sms':
                        this.update_phone_ws(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'edit-profile':
                        this.update_user_ws(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'get-profile':
                        this.get_user_details_ws(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'get-user-list':
                        this.show_user_list_ws(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;

                    case 'get-client':
                        this.get_client_ws(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'get-user-gui':
                        this.get_user_gui_ws(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'heart-beat':
                        this.heartbeat_ws(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'check-username':
                        this.check_username_ws(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'find-by-username':
                        this.find_username_ws(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'find-by-many-usernames':
                        this.find_many_username_ws(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'check-password':
                        this.check_password_ws(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'check-phonenumber':
                        this.check_phonenumber_ws(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;

                    case 'get-secret':
                        this.get_secret_ws(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'get-transaction':
                        this.get_transaction_id_ws(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'check-transaction':
                        this.check_transaction_id_ws(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'check-secret':
                        this.check_secret_ws(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'validate-phonenumber':
                        this.validate_phonenumber_ws(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'search-username':
                        this.search_username_ws(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'find-user':
                        this.get_user_ws(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'get-user-info':
                        this.get_user_info_ws(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'reset-password-sub-user':
                        this.reset_sub_user_password_ws(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'update-sub-userinfo':
                        this.update_sub_userinfo_ws(js).then(res => {
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
                console.log(err);
                throw new Error('ERROR no authorize');
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

    readBinaryStringFromArrayBuffer(arrayBuffer, onSuccess, onFail) {
        var reader = new FileReader();
        reader.onload = (event) => {
            onSuccess(event.target.result);
        };
        reader.onerror = (event) => {
            onFail(event.target.error);
        };
        reader.readAsBinaryString(new Blob([arrayBuffer], {
            type: 'application/octet-stream'
        }));
    }

    ab2str(arrayBuffer): string {
        let
            binaryString = '';
        const
            bytes = new Uint8Array(arrayBuffer),
            length = bytes.length;
        for (let i = 0; i < length; i++) {
            binaryString += String.fromCharCode(bytes[i]);
        }
        return binaryString;
    }

    str2ab(str) {
        var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
        var bufView = new Uint8Array(buf);
        for (var i = 0, strLen = str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return buf;
    }


    noop() {

    }

    // > ws._socket.address()
    //   { port: 8081,
    //     family: 2,
    //     address: '127.0.0.1' }

    // > ws._socket.remoteAddress
    //   '74.125.224.194'

    // > ws._socket.remotePort
    //   41435
    check_secret_ws(js) {
        let deferred = Q.defer();
        this.r_client.get(this._current_system + '_secret_' + js.client.gui, (err, res) => {
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

    get_transaction_id_ws(js) {
        let deferred = Q.defer();
        let t: any = {};
        t.transactionid = uuidV4();
        t.transactiontime = this.convertTZ(new Date());
        js.client.data.transaction = t;
        this.r_client.set(this._current_system + '_transaction_' + js.client.gui + js.client.data.transactionid, JSON.stringify({
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

    check_transaction_id_ws(js) {
        let deferred = Q.defer();
        this.r_client.get(this._current_system + '_transaction_' + js.client.gui + js.client.data.transactionid, (err, res) => {
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

    get_secret_ws(js) {
        let deferred = Q.defer();
        let secret = this.randomSecret(6, '1234567890');
        let content = "secret is: " + secret;
        this.r_client.get(this._current_system + '_secret_' + js.client.gui, (err, res) => {
            if (err) {
                js.client.data.message = err;
                deferred.reject(js);
            } else {
                if (res) {
                    js.client.data.message = new Error('ERROR could not send out need 3 minutes');
                    deferred.reject(js);
                } else {
                    this.r_client.set(this._current_system + '_secret_' + js.client.gui, JSON.stringify({
                        command: 'secret-changed',
                        secret: secret
                    }), 'EX', 60 * 3, (err, res) => {
                        if (err) {
                            js.client.data.message = err;
                            this.setErrorStatus(js.client);
                            deferred.reject(js);
                        } else {
                            js.client.data.message = 'OK';
                            this.SMSToPhone(js, content, js.client.data.user.phonenumber);
                            deferred.resolve(js);
                        }
                    });
                }
            }
        });
        return deferred.promise;
    }

    check_password_ws(js) {
        let deferred = Q.defer();
        let passValidate = this.validatePassword(js.client.data.username.password);
        if (passValidate.length) {
            js.client.data.message = new Error('ERROR validating ' + (passValidate.toString()));
            deferred.reject(js);
        } else {
            js.client.data.message = 'OK';
            deferred.resolve(js);
        }

        return deferred.promise;
    }

    check_username_ws(js) {
        let deferred = Q.defer();
        this.findUserByUsername(js.client.data.user.username).then((r) => {
            let res = r as Array<gijuser>;
            if (res.length) {
                js.client.data.message = new Error('ERROR username exist');
                deferred.reject(js);
            } else {
                js.client.data.message = 'OK';
                deferred.resolve(js);
            }
        }).catch((err) => {
            js.client.data.message = err;
            deferred.reject(js);
        });
        return deferred.promise;
    }

    check_phonenumber_ws(js) {
        let deferred = Q.defer();
        this.checkUserByPhone(js.client.data.user.phonenumber).then((r) => {
            let res = r as Array<gijuser>
            if (res.length) {
                js.client.data.message = new Error('ERROR this phonenumber exist');
                deferred.reject(js);
            } else {
                js.client.data.message = 'OK';
                deferred.resolve(js);
            }
        }).catch((err) => {
            js.client.data.message = err;
            deferred.reject(js);
        });
        return deferred.promise;
    }

    get_user_gui_ws(js) {
        let deferred = Q.defer();
        console.log(this._system_prefix.indexOf(js.client['prefix']));
        if (this._system_prefix.indexOf(js.client['prefix']) > -1) {
            console.log('prefix exist');
            this.r_client.get(this._current_system + '_usergui_' + js.client.logintoken, (err, res) => {
                if (err) {
                    js.client.data.message = err;
                    deferred.reject(js);
                } else {
                    if (res) {
                        let gui = JSON.parse(res);
                        //js.client.data.user = {};
                        js.client.data.message = 'OK get GUI';
                        js.client.auth.gui = gui.gui;
                        //console.log(js.client.auth);
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

    heartbeat_ws(js) {
        let deferred = Q.defer();
        js.client.lastupdate = this.convertTZ(new Date());
        js.client.clientip = js.ws._socket.remoteAddress;
        js.client.data.message = 'heart beat';
        this.r_client.get(this._current_system + '_login_' + js.client.logintoken, (err, res) => {
            if (err) {
                js.client.data.message = err;
                this.setErrorStatus(js.client);
                deferred.reject(js);

            } else if (res) {
                js.client.data.message = 'heart beat with login';
                this.r_client.get(this._current_system + '_usergui_' + js.client.logintoken, (err, r) => {
                    if (err) {
                        js.client.data.message = err;
                        deferred.reject(js);
                    } else {
                        let res: guiObj = JSON.parse(r) as guiObj;
                        if (res.gui) {
                            this.setUserGUIStatus(js.client, res.gui);
                            js.client.data.message = 'OK heart beat'
                            deferred.resolve(js);
                        } else {
                            js.client.data.message = new Error('ERROR gui not found');
                            deferred.reject(js);
                        }
                    }
                    this.setLoginStatus(js.client);
                    this.setClientStatus(js.client);
                    this.setOnlineStatus(js.client);
                    deferred.resolve(js);
                });

            } else {
                js.client.data.message = 'heart beat no login';
                this.setClientStatus(js.client);
                deferred.resolve(js);
            };
        });
        return deferred.promise;
    }

    heartbeat() {
        this['isAlive'] = true;
        // if (!this.lastupdate && !this.gui) {
        //     console.log('HEART BEAT:' + this.gui + " is alive:" + this.isAlive + " " + this.lastupdate + " logout");
        //     this.isAlive = false;
        // }
        // let startDate = moment(this.lastupdate)
        // let endDate = moment(this.convertTZ(new Date()));

        // const timeout = endDate.diff(startDate, 'seconds');
        // // if(this.gui!=this.gui){
        // //     this.isAlive=false;
        // //     console.log('HEART BEAT:'+this.gui+" is alive:"+this.isAlive+" "+this.lastupdate+" timeout"+timeout);
        // //     return;
        // // }
        // if (timeout > 60 * 10)
        //     this.isAlive = false;
        // else
        //     this.isAlive = true;

        // console.log('HEART BEAT:' + this.gui + " is alive:" + this.isAlive + " " + this.lastupdate + " timeout" + timeout);
        // //this.send(this.client);
    }



    private _client = {
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
    private _user = {
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
    private defaultUser: gijuser = {
        username: '@d31n',
        password: '123456',
        confirmpassword: '',
        phonenumber: '2054445447',
        gui: uuidV4(),
        createddate: this.convertTZ(new Date()),
        lastupdate: this.convertTZ(new Date()),
        isactive: true,
        parents: ["default"],
        roles: ['admin', 'user'],
        logintoken: '',
        expirelogintoken: '',
        description: '',
        photo: [],
        note: '',
        system: ['gij', 'web-post', 'user-management', 'ice-maker', 'gps'],
        gijvalue: 0,
        totalgij: 0,
        totalgijspent: 0,
        oldphone: []
    }
    private sDefaultUsers: Array<gijuser> = [{
        username: 'webpost-admin',
        password: '123456',
        confirmpassword: '',
        phonenumber: '2055516321',
        gui: uuidV4(),
        createddate: this.convertTZ(new Date()),
        lastupdate: this.convertTZ(new Date()),
        isactive: true,
        parents: ["default"],
        roles: ['admin', 'user'],
        logintoken: '',
        expirelogintoken: '',
        description: '',
        photo: [],
        note: '',
        system: ['web-post', 'gij'],
        gijvalue: 0,
        totalgij: 0,
        totalgijspent: 0,
        oldphone: [],
    },
    {
        username: 'gij-admin',
        password: '123456',
        confirmpassword: '',
        phonenumber: '2055516321',
        gui: uuidV4(),
        createddate: this.convertTZ(new Date()),
        lastupdate: this.convertTZ(new Date()),
        isactive: true,
        parents: ["default"],
        roles: ['admin', 'user'],
        logintoken: '',
        expirelogintoken: '',
        description: '',
        photo: [],
        note: '',
        system: ['gij'],
        gijvalue: 0,
        totalgij: 0,
        totalgijspent: 0,
        oldphone: []
    },
    {
        username: 'gps-admin',
        password: '123456',
        confirmpassword: '',
        phonenumber: '2055516321',
        gui: uuidV4(),
        createddate: this.convertTZ(new Date()),
        lastupdate: this.convertTZ(new Date()),
        isactive: true,
        parents: ["default"],
        roles: ['admin', 'user'],
        logintoken: '',
        expirelogintoken: '',
        description: '',
        photo: [],
        note: '',
        system: ['gps', 'gij'],
        gijvalue: 0,
        totalgij: 0,
        totalgijspent: 0,
        oldphone: []
    },
    {
        username: 'ice-maker-admin',
        password: '123456',
        confirmpassword: '',
        phonenumber: '2055516321',
        gui: uuidV4(),
        createddate: this.convertTZ(new Date()),
        lastupdate: this.convertTZ(new Date()),
        isactive: true,
        parents: ["default"],
        roles: ['admin', 'user'],
        logintoken: '',
        expirelogintoken: '',
        description: '',
        photo: [],
        note: '',
        system: ['ice-maker', 'gij'],
        gijvalue: 0,
        totalgij: 0,
        totalgijspent: 0,
        oldphone: []
    },
    ];


    copyObject(o1, o2) {
        for (const key in o1) {
            o2[key] = o1[key];
        }
    }

    loadAdmin(js) {
        let db = this.create_db('gijusers');
        db.view(this.__design_view, 'findAdmin', {
            key: 'user-management'
        }, (err, res) => {
            if (err) {
                js.client.data.message = err;
                js.resp.send(js.client);
            } else {
                if (res.rows.length) {
                    this.defaultUser = res.rows[0];
                    js.client.data.message = 'OK';
                    js.resp.send(js.client);
                } else {
                    js.client.data = {};
                    db.insert(this.defaultUser, this.defaultUser.gui, (err, res) => {
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

    init_default_user(js) {
        //let db = create_db('gijusers');
        //console.log('default user:'+defaultUser.username);
        // findUserByUsername(defaultUser.username).then((res) {
        //     if (res) {
        this.nano.db.destroy('gijusers', (err, body) => {
            js.client.data = {};
            js.client.data.message = 'destroy OK';
            this.nano.db.create('gijusers', (err, body) => {
                // specify the database we are going to use    
                if (!err) {
                    console.log('database  created!');
                } else {
                    console.log("gijusers could not be created!");
                }
                let db = this.nano.use('gijusers');
                db.insert(this.__design_users, "_design/objectList", (err, res) => {
                    if (err) console.log('err insert new design ' + err);
                    else {
                        //setTimeout(() => {
                        this.sDefaultUsers.push(this.defaultUser);
                        db.bulk({
                            docs: this.sDefaultUsers
                        }, (err, res) => {
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
        //         db.insert(defaultUser, defaultUser.gui, (err, res)=> {
        //             if (err) {
        //                 js.client.data.message = err;
        //                 js.resp.send(js.client);
        //             } else {
        //                 db.bulk({
        //                     docs: sDefaultUsers
        //                 }, (err, res)=> {
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
        // }).catch((err) {
        //     js.client.data = {};
        //     js.client.data.message = err;
        //     js.resp.send(js.client);
        // });
    }
    data = {
        gui: uuidV4(),
        // target: 0, // 0= @user:.... , 1=@group:.... , 2= @chanel:.... ,3= @room:..... // default is 0
        targetid: '',
        username: '',
        usergui: '',
        memberusername: [''],
        membergui: [''],
        exmember: [],
        pendingmemberapproval: [],
        deniedapprovlalist: [],
        pendinginvited: [],
        refusedinvited: [],
        createdata: this.convertTZ(new Date()),
        msg: [] /// 1ms earlier
    }

    private __design_targetmsg = {
        "_id": "_design/objectList",
        "views": {
            "findByUserGui": {
                "map": "function(doc) {\r\n    if(doc.usergui) {\r\n        emit(doc.usergui,doc);\r\n    }\r\n}"
            },
            "findByTargetId": {
                "map": "function(doc) {\r\n    if(doc.targetid) {\r\n        emit(doc.targetid,doc);\r\n    }\r\n}"
            }
        },
        "language": "javascript"
    }
    private __design_pendingrequest = {
        "_id": "_design/objectList",
        "views": {
            "findByUserGui": {
                "map": "function(doc) {\r\n    if(doc.usergui) {\r\n        emit(doc.usergui,doc);\r\n    }\r\n}"
            }
        },
        "language": "javascript"
    }


    private __design_users = {
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
            "searchByUsername": {
                "map": `function (doc) {
                if(doc.username)
                emit(doc.username, doc);
                //startkey="abc"&endkey="abc\ufff0"
                }`
            },
            "findByUserGui": {
                "map": "function(doc) {\r\n    if(doc.gui) {\r\n        emit(doc.gui,doc);\r\n    }\r\n}"
            },
            "findExist": {
                "map": "function(doc) {\n if(doc.username.toLowerCase()) \n emit(doc.username.toLowerCase(), doc);\n}"
            },
            "changePassword": {
                "map": "function(doc) {\n    emit([doc.username.toLowerCase(),doc.password,doc.phonenumber], doc);\n}"
            },
            "findByRole": {
                "map": "function(doc) {\n   for(var i=0;i<doc.roles.length;i++) emit([doc.roles[i]], doc);\n}"
            },
            "countByRole": {
                "reduce": "_count",
                "map": "function(doc) {\n   for(var i=0;i<doc.roles.length;i++) emit([doc.roles[i]], doc);\n}"
            },
            "findByParent": {
                "map": "function(doc) {\n   for(var i=0;i<doc.parents.length;i++) emit([doc.parents[i]], doc);\n}"
            },
            "searchByParent": {
                "map": "function(doc) {\n   for(var i=0;i<doc.parents.length;i++) if(doc.username)emit([doc.parents[i],doc.username], doc);\n}"
            },
            "countByParent": {
                "reduce": "_count",
                "map": "function(doc) {\n   for(var i=0;i<doc.parents.length;i++) emit([doc.parents[i]], doc);\n}"
            },
            "findAdmin": {
                "map": "function(doc) {\n   for(var i=0;i<doc.system.length;i++) emit([doc.system[i]], doc);\n}"
            },
            "countAdmin": {
                "reduce": "_count",
                "map": "function(doc) {\n   for(var i=0;i<doc.system.length;i++) emit([doc.system[i]], doc);\n}"
            }

        },
        "language": "javascript"
    };

    //var _authen_arr = ["/profile", "/this.change_password"] // could get from redis;
    private _author_path = [{
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
    // var checkAuthen = (req, res, next) {
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

    findUserRoles(gui) {
        let deferred = Q.defer();
        let db = this.create_db('gijusers');
        db.view(this.__design_view, 'findByUserGui', {
            keys: [gui]
        }, (err, res) => {
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

    checkUserRoles(gui) {
        let deferred = Q.defer();
        this.findUserRoles(gui).then((res) => {
            deferred.resolve(res);
        }).catch((err) => {
            deferred.reject(err);
        });
    }
    //var _arrUsers = [];

    clearPrefix() {
        for (let index = 0; index < this._client_prefix.length; index++) {
            let element = this._client_prefix[index];
            if (element.indexOf('GUEST') > -1) {
                element = '';
            }
        }
    }

    get_system_prefix() {
        return this._system_prefix;
    }

    init_client(client) {
        if (client === undefined || null) client = this._client;
        if (client.data === undefined || null) client = this._client;
    }


    checkTest() {
        let deferred = Q.defer();
        deferred.resolve('OK');
        return deferred.promise;
    }

    checkCurrentClient(client) {
        let js = {};
        let deferred = Q.defer();
        try {
            this.r_client.get(this._current_system + '_client_' + client.gui, (err, res) => {
                if (err) deferred.reject(err);
                else {
                    if (res) {
                        deferred.resolve('1');
                    } else {
                        deferred.resolve('');
                    }
                }
            });
        } catch (error) {
            js['client'].data.message = error;
            deferred.reject(js);
        }
        return deferred.promise;
    }

    findTagetByTargetId(targetid) {
        let deferred = Q.defer();
        let js: any = {};
        try {
            let db = this.create_db('targetmsg');
            db.view(this.__design_view, 'findByTargetId', {
                key: targetid
            }, (err, res) => {
                if (err) throw err;
                else {
                    let arr = [];
                    for (let index = 0; index < res.rows.length; index++) {
                        const element = res.rows[index].value;
                        arr.push(element);
                    }
                    deferred.resolve(arr);
                }
            });
        } catch (error) {
            js.client.data.message = error;
            deferred.reject(js);
        }
        return deferred.promise;
    }

    findTagetByUserGui(usergui) {
        let deferred = Q.defer();
        let js: any = {};
        try {
            let db = this.create_db('targetmsg');
            db.view(this.__design_view, 'findByUserGui', {
                key: usergui
            }, (err, res) => {
                if (err) throw err;
                else {
                    let arr = [];
                    for (let index = 0; index < res.rows.length; index++) {
                        const element = res.rows[index].value;
                        arr.push(element);
                    }
                    deferred.resolve(arr);
                }
            });
        } catch (error) {
            js.client.data.message = error;
            deferred.reject(js);
        }
        return deferred.promise;
    }

    updateTarget(t) {
        let deferred = Q.defer();
        try {
            if (t._rev === undefined) {
                t.gui = uuidV4();
            }
            let db = this.create_db('targetmsg');
            db.insert(t, t.gui, (err, res) => {
                if (err) throw err;
                else {
                    deferred.resolve('OK added targetmsg');
                }
            });
        } catch (error) {
            deferred.reject(error);
        }
        return deferred.promise;
    }

    find_targetid_ws(js) {
        let deferred = Q.defer();
        this.getTargetId(js).then(r => {
            let re = r as Array<targetObj>;
            if (re.length) {
                let res = re[0];
                if (js.client.auth.gui === res.usergui) {
                    js.client.data.targetid = res;
                    js.clinet.data.message = 'OK get targetid ';
                    deferred.resolve(js);
                } else if (res.membergui.indexOf(js.client.auth.gui) > -1) {
                    js.client.data.targetid = [{
                        gui: res.gui,
                        memberusername: res.memberusername,
                        username: res.username,
                        createddate: res.createddate
                    }];
                    js.clinet.data.message = 'OK get targetid ';
                    deferred.resolve(js);
                } else {
                    js.client.data.targetid = [];
                    js.clinet.data.message = new Error('ERROR not a member');
                    deferred.reject(js);
                }

            } else {
                js.client.data.targetid = [];
                js.clinet.data.message = new Error('ERROR found targetid');
                deferred.reject(js);
            }


        }).catch(err => {
            js.client.data.message = err;
            deferred.reject(js);
        });
        return deferred.promise;
    }

    getTargetId(js) {
        let deferred = Q.defer();
        let db = this.create_db('targetmsg');
        db.view(this.__design_view, 'findByUserGui', {
            key: js.client.auth.gui + ''
        }, (err, res) => {
            if (err) deferred.reject(err);
            else {
                let arr = [];
                for (let index = 0; index < res.rows.length; index++) {
                    const element = res.rows[index].value;
                    arr.push(arr);
                }
                deferred.resolve(arr);
            }
        });
        return deferred.promise;
    }

    find_pending_reques_ws(js) {
        let deferred = Q.defer();
        this.getPendingRequestByUserGui(js).then(res => {
            js.client.data.message = 'OK find pending request';
            deferred.resolve(js);
        }).catch(err => {
            js.client.data.message = err;
            deferred.reject(js);
        });
        return deferred.promise;
    }

    getPendingRequestByUserGui(js) {
        let deferred = Q.defer();
        let db = this.create_db('pendingrequest');
        db.view(this.__design_view, 'findByUserGui', {
            key: js.client.auth.gui + ''
        }, (err, res) => {
            if (err) deferred.reject(err);
            else {
                let arr = [];
                for (let index = 0; index < res.rows.length; index++) {
                    const element = res.rows[index].value;
                    arr.push(arr);
                }
                deferred.resolve(arr);
            }
        });
        return deferred.promise;
    }
    private pendingrequest = {
        gui: '',
        usergui: '',
        createdtime: '',
        requesttype: '',
        requestto: '',
        isdone: '',
        result: ''

    }

    update_pending_request_ws(js) {
        let deferred = Q.defer();
        js.client.data.pendingrequest.usergui = js.client.auth.gui;
        this.updatePendingRequest(js.client.data.pendingrequest).then(res => {
            js.client.data.message = 'OK update request';
            deferred.resolve(js);
        }).catch(err => {
            js.client.data.message = err;
            deferred.reject(js);
        });
        return deferred.promise;
    }

    updatePendingRequest(p) {
        let deferred = Q.defer();
        let db = this.create_db('pendingrequest');
        if (!p._rev) {
            p._id = uuidV4();
            p.gui = p._id;
        }
        db.insert(p, p._id, (err, res) => {
            if (err) deferred.reject(err);
            else {
                let arr = [];
                for (let index = 0; index < res.rows.length; index++) {
                    const element = res.rows[index].value;
                    arr.push(arr);
                }
                deferred.resolve(arr);
            }
        });
        return deferred.promise;
    }

    // subscribe to a conversation
    subscribe_online_chat(js) {
        let deferred = Q.defer();
        try {

            let msg = js.client.data.msg;
            this.findTagetByTargetId(msg.targetid).then(r => {
                let res: Array<targetObj> = r as Array<targetObj>;
                if (res.length) {
                    let target = res[0];
                    if (target.pendingmemberapproval === undefined)
                        target.pendingmemberapproval = [];
                    if (target.blacklist.indexOf(js.client.auth.gui) > -1) {
                        throw new Error('ERROR you have no permission');
                    } else {
                        target.pendingmemberapproval.push(js.client.auth.gui);
                        this.updateTarget(target).then(r => {
                            js.client.data.message = 'OK subscribe!';
                            let pendingrequest = {
                                gui: uuidV4(),
                                usergui: target.usergui,
                                createdtime: this.convertTZ(new Date()),
                                requesttype: 'subscribe',
                                requestto: target.targetid,
                                isdone: false,
                                result: 'requesting subscribe',
                            };
                            this.updatePendingRequest(pendingrequest).then(res => {
                                deferred.resolve(js);
                            });
                        });
                    }

                } else {
                    throw new Error('ERROR targetid now found');
                }
            });
        } catch (error) {
            js.client.data.message = error;
            deferred.reject(js);
        }
        return deferred.promise;
    }
    // leave conversation
    leave_online_chat(js) {
        let deferred = Q.defer();
        let msg = js.client.data.msg;
        try {
            this.findTagetByTargetId(msg.targetid).then(r => {
                let res: Array<targetObj> = r as Array<targetObj>;
                if (res.length) {
                    let target = res[0];
                    if (target.usergui === js.client.auth.gui)
                        target._deleted = true;
                    if (target.membergui === undefined && !target._deleted) {
                        target.membergui.splice(target.membergui.indexOf(js.client.auth.gui), 1);
                        target.memberusername.splice(target.memberusername.indexOf(js.client.username), 1);
                        target.exmember.push(js.client.data.user.username);
                        target.pendingmemberapproval.splice(target.pendingmemberapproval.indexOf(js.client.username), 1);
                        target.deniedapprovlalist.splice(target.deniedapprovlalist.indexOf(js.client.username), 1);
                        target.pendinginvited.splice(target.pendinginvited.indexOf(js.client.username), 1);
                        target.refusedinvited.splice(target.refusedinvited.indexOf(js.client.username), 1);
                    }
                    this.updateTarget(target).then(res => {
                        js.client.data.message = 'OK subscribe!';
                        deferred.resolve(js);
                    });

                } else {
                    throw new Error('ERROR targetid now found');
                }
            });
        } catch (error) {
            js.client.data.message = error;
            deferred.reject(js);
        }
        return deferred.promise;
    }
    // invite to conversation
    invite_online_chat(js) {
        let deferred = Q.defer();
        let msg = js.client.data.msg;
        try {
            this.findTagetByTargetId(msg.targetid).then(r => {
                let res = r as Array<targetObj>;
                if (res.length) {
                    let s_target = res[0];
                    this.findUserByUsername(js.client.data.user.username).then(r => {
                        let res = r as Array<gijuser>;
                        if (res.length) {
                            let u = res[0];
                            if (s_target.membergui.indexOf(u.gui) > -1) {
                                throw new Error('ERROR exist member');
                            }
                            if (s_target.pendinginvited.indexOf(u.username) > -1) {
                                throw new Error('ERROR exist invited');
                            }
                            if (s_target.blacklist.indexOf(u.username) > -1) {
                                throw new Error('ERROR blacklist');
                            }
                            if (js.client.auth.gui !== s_target.usergui)
                                throw new Error('ERROR you have no permissiont to add blacklist');
                            s_target.pendinginvited.push(u.username);
                            if (s_target.usergui === js.client.auth.gui) {
                                this.updateTarget(s_target).then(res => {
                                    js.client.data.message = 'OK update invited!';
                                    let pendingrequest = {
                                        gui: uuidV4(),
                                        usergui: s_target.usergui,
                                        createdtime: this.convertTZ(new Date()),
                                        requesttype: 'invite',
                                        requestto: s_target.targetid,
                                        isdone: false,
                                        result: 'requesting invite',
                                    };
                                    this.updatePendingRequest(pendingrequest).then(res => {
                                        deferred.resolve(js);
                                    });

                                });
                            } else {
                                throw new Error('ERROR you have no right to invite!');
                            }
                        } else {
                            throw new Error('ERROR not found invited user');
                        }
                    });
                } else {
                    throw new Error('ERROR targetid now found');
                }
            });
        } catch (error) {
            js.client.data.message = error;
            deferred.reject(js);
        }
        return deferred.promise;
    }
    // approve subscribed to a conversation
    approve_member_online_chat(js) {
        let deferred = Q.defer();
        let msg = js.client.data.msg;
        try {
            this.findTagetByTargetId(msg.targetid).then(r => {
                let res = r as Array<targetObj>;
                if (res.length) {
                    let s_target = res[0];
                    this.findUserByUsername(js.client.data.user.username).then(r => {
                        let res = r as Array<gijuser>
                        if (res.length) {
                            let u = res[0];
                            if (s_target.membergui.indexOf(u.gui) > -1) {
                                throw new Error('ERROR exist member');
                            }
                            if (js.client.auth.gui !== s_target.usergui)
                                throw new Error('ERROR you have no permission to add this user');
                            if (s_target.pendingmemberapproval.indexOf(u.username) > -1) {
                                s_target.membergui.push(u.gui);
                                s_target.memberusername.push(u.username);
                                this.updateTarget(s_target).then(res => {
                                    js.client.data.message = 'OK update approved member joining request!';
                                    // getPendingRequestByUserGui(js).then(res=>{
                                    //     if(res)
                                    // })
                                    this.updatePendingRequest(js).then(res => {
                                        deferred.resolve(js);
                                    });
                                });
                            } else if (s_target.deniedapprovlalist.indexOf(u.username) > -1) {
                                this.updateTarget(s_target).then(res => {
                                    js.client.data.message = 'OK update deny member joining request!';
                                    let pendingrequest = {
                                        gui: uuidV4(),
                                        usergui: s_target.usergui,
                                        createdtime: this.convertTZ(new Date()),
                                        requesttype: 'arppove',
                                        requestto: u.username,
                                        isdone: true,
                                        result: 'deny member joining',
                                    };
                                    js.client.data.pendingrequest = pendingrequest;
                                    this.updatePendingRequest(js).then(res => {
                                        deferred.resolve(js);
                                    });
                                });
                            } else {
                                throw new Error('ERROR please subscribe first');
                            }
                        } else {
                            throw new Error('ERROR not found invited user');
                        }
                    });
                } else {
                    throw new Error('ERROR targetid now found');
                }
            });
        } catch (error) {
            js.client.data.message = error;
            deferred.reject(js);
        }
        return deferred.promise;
    }
    // accept invited
    accpet_invite_online_chat(js) {
        let deferred = Q.defer();
        let msg = js.client.data.msg;
        try {
            this.findTagetByTargetId(msg.targetid).then(r => {
                let res = r as Array<targetObj>;
                if (res.length) {
                    let s_target = res[0];
                    this.findUserByUsername(js.client.username).then(r => {
                        let res = r as Array<gijuser>
                        if (res.length) {
                            let u = res[0];

                            if (s_target.membergui.indexOf(u.gui) > -1) {
                                throw new Error('ERROR exist member');
                            }
                            if (s_target.pendinginvited.indexOf(u.username) > -1) {
                                s_target.membergui.push(u.gui);
                                s_target.memberusername.push(u.username);
                                this.updateTarget(s_target).then(res => {
                                    js.client.data.message = 'OK update accept an invitation!';
                                    deferred.resolve(js);
                                });
                            } else if (s_target.refusedinvited.indexOf(u.username) > -1) {
                                this.updateTarget(s_target).then(res => {
                                    js.client.data.message = 'OK update refused an invitation!';
                                    deferred.resolve(js);
                                });
                            } else {
                                throw new Error('ERROR you have not an invitation')
                            }
                        } else {
                            throw new Error('ERROR not found invited user');
                        }
                    });
                } else {
                    throw new Error('ERROR targetid now found');
                }
            });
        } catch (error) {
            js.client.data.message = error;
            deferred.reject(js);
        }
        return deferred.promise;
    }
    // add / remove the black list
    black_list_online_chat(js) {
        let deferred = Q.defer();
        let msg = js.client.data.msg;
        try {
            this.findTagetByTargetId(msg.targetid).then(r => {
                let res = r as Array<targetObj>;
                if (res.length) {
                    let s_target = res[0];
                    this.findUserByUsername(js.client.data.user.username).then(r => {
                        let res = r as Array<targetObj>;
                        if (res.length) {
                            let u = res[0];
                            if (s_target.membergui.indexOf(u.gui) > -1) {
                                s_target.membergui.splice(s_target.membergui.indexOf(u.gui), 1);
                                s_target.memberusername.splice(s_target.memberusername.indexOf(u.username), 1);
                            }
                            if (js.client.auth.gui !== s_target.usergui)
                                throw new Error('ERROR you have no permissiont to add blacklist');
                            if (s_target.blacklist.indexOf(u.username) < 0) {
                                s_target.blacklist.push(u.username);
                                this.updateTarget(s_target).then(res => {
                                    js.client.data.message = 'OK update added to black list!';
                                    deferred.resolve(js);
                                });
                            } else {
                                throw new Error('ERROR exist in black list');
                            }
                        } else {
                            throw new Error('ERROR not found user');
                        }
                    });
                } else {
                    throw new Error('ERROR targetid now found');
                }
            });
        } catch (error) {
            js.client.data.message = error;
            deferred.reject(js);
        }
        return deferred.promise;
    }
    // syncing msg
    sync_msg_online(js) {
        let deferred = Q.defer();
        let msg = js.client.data.msg;
        try {
            // find conversation 
            this.findTagetByTargetId(msg.targetid).then(r => {
                let res = r as Array<targetObj>;
                if (res.length) {
                    let s_target = res[0];
                    // identify current user
                    this.findUserByUsername(js.client.username).then(r => {
                        let res = r as Array<gijuser>;
                        if (res.length) {
                            let u = res[0];
                            if (s_target.blacklist.indexOf(u.username) < 0) {
                                if (s_target.membergui.indexOf(u.gui) > -1) {


                                }
                            } else {
                                throw new Error('ERROR exist in black list');
                            }


                        } else {
                            throw new Error('ERROR not found user');
                        }
                    });
                } else {
                    throw new Error('ERROR targetid now found');
                }
            });
        } catch (error) {
            js.client.data.message = error;
            deferred.reject(js);
        }
        return deferred.promise;
    }

    // create a new conversation 
    register_online_chat(js, gui) {
        let deferred = Q.defer();
        try {
            if (js.client.data.msg === undefined || js.client.data.msg.targetid === undefined) {
                js.client.data.msg = {};
                js.client.data.msg.targetid = js.client.username;
            }
            this.findTagetByTargetId(js.client.data.msg.targetid).then(r => {
                let res = r as Array<targetObj>;
                if (res.length) {
                    let data = res[0];
                    //console.log(data);
                    if (data.usergui === gui) {
                        if (data.membergui.indexOf(gui) < 0) {
                            data.membergui.push(gui);
                            data.memberusername.push(js.client.username);
                        }
                        let msg: msgObj = {
                            gui: uuidV4(),
                            sender: js.client.username,
                            content: '@hello@',
                            msgtype: 'text', // photo , sound, video, text, typing, misc
                            attached: [],
                            sent: this.convertTZ(new Date()),
                            // sent: [{
                            //     username: '',
                            //     sent: this.convertTZ(new Date())
                            // }],
                            received: [{
                                username: '',
                                received: this.convertTZ(new Date())
                            }], //
                            read: [{
                                username: '',
                                read: this.convertTZ(new Date())
                            }] // 
                        }
                        if (data.msg.length > 1) {
                            data.msg.shift();
                        }
                        data.msg.push(msg);
                        let client = JSON.parse(JSON.stringify(js.client));
                        for (let index = 0; index < data.memberusername.length; index++) {
                            const element = data.memberusername[index];
                            client.data.msg = data.msg;
                            this.r_client.set(this._current_system + '_msg_' + element, JSON.stringify({
                                command: 'msg-changed',
                                msg: msg
                            }), 'EX', 60 * 3);
                        }
                        this.updateTarget(data).then(res => {
                            js.client.data.message = 'OK register exist online chat';
                            deferred.resolve(js);
                        });
                    } else {
                        console.log('Registeration for the owner only');
                        deferred.resolve(js);
                    }
                } else {
                    this.findUserByGUI(gui).then(r => {
                        if (r) {
                            let res = r as gijuser;
                            js.client.data.msg.targetid = js.client.username = res.username;
                            let data = {
                                gui: uuidV4(),
                                // target: 0, // 0= @user:.... , 1=@group:.... , 2= @chanel:.... ,3= @room:..... // default is 0
                                targetid: js.client.data.msg.targetid,
                                username: js.client.data.username,
                                usergui: js.client.auth.gui,
                                memberusername: [js.client.username],
                                membergui: [js.client.auth.gui],
                                exmember: [],
                                pendingmemberapproval: [],
                                deniedapprovlalist: [],
                                pendinginvited: [],
                                refusedinvited: [],
                                blacklist: [],
                                createdata: this.convertTZ(new Date()),
                                msg: [] /// 10 ms earlier
                            }
                            let msg = {
                                gui: uuidV4(),
                                targetid: '',
                                // sendergui: js.client.auth.gui,
                                sender: js.client.username,
                                content: '@hello@',
                                msgtype: 'text', // photo , sound, video, text, typing, misc
                                attached: [],
                                sent: this.convertTZ(new Date()),
                                // sent: [{
                                //     username: '',
                                //     sent: this.convertTZ(new Date())
                                // }],
                                received: [{
                                    username: '',
                                    received: this.convertTZ(new Date())
                                }], //
                                read: [{
                                    username: '',
                                    read: this.convertTZ(new Date())
                                }] // 
                            }
                            if (data.msg.length > 1) {
                                data.msg.shift();
                            }
                            data.msg.push(msg);
                            //let client = JSON.parse(JSON.stringify(js.client));
                            for (let index = 0; index < data.memberusername.length; index++) {
                                const element = data.memberusername[index];
                                // client.data.msg = data.msg;
                                this.r_client.set(this._current_system + '_msg_' + element, JSON.stringify({
                                    command: 'msg-changed',
                                    msg: msg
                                }), 'EX', 60 * 3);
                            }

                            this.updateTarget(data).then(res => {
                                js.client.data.message = 'OK register new online chat';
                                deferred.resolve(js);
                            });

                        } else {
                            console.log('ERROR this gui not found ');
                        }
                    })

                }
            }).catch(err => {
                throw err;
            });
        } catch (error) {
            js.client.data.message = error;
            deferred.reject(js);
        }
        return deferred.promise;
    }

    send_message(js) {
        let deferred = Q.defer();
        try {
            this.findTagetByTargetId(js.client.data.msg.targetid).then(r => {
                let res = r as Array<targetObj>;
                if (res.length) {
                    let data = res[0];
                    if (data.membergui.indexOf(js.client.auth.gui) < 0) {
                        throw new Error('ERROR you are not a memember')
                    }
                    let msg = {
                        gui: uuidV4(),
                        // target: 0, // 0= @user:.... , 1=@group:.... , 2= @chanel:.... ,3= @room:.....
                        // sendergui: js.client.auth.gui,
                        targetid: js.client.data.msg.targetid,
                        sender: js.client.username,
                        content: js.client.data.msg.content,
                        msgtype: js.client.data.msg.msgtype, // photo , sound, video, text, typing, misc
                        attached: js.client.data.msg.attached,
                        sent: this.convertTZ(new Date()),
                        received: [{
                            username: '',
                            received: this.convertTZ(new Date())
                        }], //
                        read: [{
                            username: '',
                            read: this.convertTZ(new Date())
                        }] // 
                    }
                    if (data.msg.length > 1) {
                        data.msg.shift();
                    }
                    data.msg.push(msg);
                    //let client = JSON.parse(JSON.stringify(js.client));
                    for (let index = 0; index < data.memberusername.length; index++) {
                        const element = data.memberusername[index];
                        // client.data.msg = data.msg;
                        this.r_client.set(this._current_system + '_msg_' + element, JSON.stringify({
                            command: 'msg-changed',
                            msg: msg
                        }), 'EX', 60 * 3);

                    }
                    this.updateTarget(data).then(res => {
                        js.client.data.message = 'OK updated a msg';

                        deferred.resolve(js);
                    });
                } else {
                    throw new Error('ERROR target not found');
                }
            });

        } catch (error) {
            js.client.data.message = error;
            deferred.reject(js);
        }
        return deferred.promise;
    }

    get_client_ws(js) {
        let deferred = Q.defer();
        console.log('check client');
        this.checkCurrentClient(js.client).then(res => {
            if (res) {
                console.log('got client');
                console.log(res);
                js.client.clientip = js.ws._socket.remoteAddress;
                js.client.lastupdate = this.convertTZ(new Date());
                js.client.timeout = 60 * 60 * 24;
                this.setClientStatus(js.client);
                deferred.resolve(js);
            } else {
                this.init_client(js.client);
                this.getClient(js.client).then((res) => {
                    //js.client=res;
                    //console.log(js.ws._socket.remoteAddress);
                    js.client.clientip = js.ws._socket.remoteAddress;
                    js.client.accessedtime = this.convertTZ(new Date());
                    js.client.lastupdate = this.convertTZ(new Date());
                    js.client.timeout = 60 * 60 * 24;
                    js.client.logintoken = '';
                    js.client.logintime = '';
                    //js.client.gui=uuidV4();        
                    js.client.data.message = 'OK new client';
                    if (!js.client.pre)
                        js.client.prefix = 'GUEST-' + uuidV4();
                    //_client_prefix.push(js.client.prefix);
                    //console.log('before send '+JSON.stringify(js.client));
                    console.log('new client');
                    this.setClientStatus(js.client);
                    deferred.resolve(js);

                }).catch((err) => {
                    //console.log(err);    
                    js.client.data.message = err;
                    deferred.reject(js);
                });
            }
        }).catch(err => {
            js.client.data.message = err;
            deferred.reject(js);
        });

        return deferred.promise;
    }

    getClient(client) {
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


    login_ws(js) {
        let deferred = Q.defer();
        try {
            this.authentication(js.client.data.user).then((res) => {
                let user: gijuser = res as gijuser;
                console.log('authen res');
                //console.log(res);
                this.r_client.get(this._current_system + '_online_' + user.username, (err, res) => {
                    let online = JSON.parse(res);
                    if (err) {
                        js.client.data.message = err;
                        js.client.data.user = {};
                        js.client.accessedtime = this.convertTZ(new Date());
                        //js.resp.send(js.client);
                        deferred.reject(js);
                    } else {
                        if (!online) {

                        } else {
                            /// need to clear other login 
                            // console.log(online);
                            // if (online.client.login) {
                            //     for (let index = 0; index < online.client.login.length; index++) {
                            //          //// TODO: this TO ALLOW 1 LOGIN TOKEN only
                            //         const element = online.login[index];
                            //         this.r_client.del(this._current_system + '_login_' + element.logintoken);
                            //         this.r_client.del(this._current_system + '_usergui_' + element.logintoken);
                            //     }
                            // }
                        }
                        if (!this._client_prefix.match(user.system).length) {
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
                            js.client.logintime = this.convertTZ(new Date());
                            //js.resp.send(js.client);
                            //_arrUsers.push(js.client);
                            js.client.data.user = {};
                            js.client.auth = {};
                            js.client.auth.gui = user.gui;
                            this.register_online_chat(js, user.gui);
                            this.setLoginStatus(js.client);
                            this.setUserGUIStatus(js.client, user.gui);
                            this.setOnlineStatus(js.client);
                            // setTargetMsg(js.client, user.gui);

                            //setTimeout(() => {
                            deferred.resolve(js);
                            //}, 1000 * 3);

                        }

                    }
                });
            }).catch((err) => {
                js.client.data.message = err;
                js.client.data.user = {};
                js.client.accessedtime = this.convertTZ(new Date());
                //js.resp.send(js.client);
                deferred.reject(js);
            });
        } catch (error) {
            js.client.data.message = error;
            js.client.data.user = {};
            js.client.accessedtime = this.convertTZ(new Date());
            //js.resp.send(js.client);
            deferred.reject(js);
        }

        return deferred.promise;
    }

    login(js) {
        this.authentication(js.client.data.user).then((res) => {
            js.client.username = js.client.data.user.username;
            js.client.data.user = {};
            js.client.data.message = 'OK';
            js.client.logintoken = uuidV4();
            js.client.logintime = this.convertTZ(new Date());
            js.resp.send(js.client);
            //_arrUsers.push(js.client);
        }).catch((err) => {
            js.client.data.message = err;
            js.resp.send(js.client);
        });
    }

    authentication(userinfo) {
        let deferred = Q.defer();
        let db = this.create_db('gijusers');
        console.log('check authen');
        try {
            db.view(this.__design_view, 'authentication', {
                key: [userinfo.username + '', userinfo.password + '']
            }, (err, res) => {
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



    register_ws(js) {
        let deferred = Q.defer();
        js.client.data.user.system = [];
        console.log('register ws');
        if (this._client_prefix.indexOf(js.client.prefix) > -1)
            js.client.data.user.system.push(js.client.prefix);
        else {
            js.client.data.user.system.push('default');
            js.client.data.user.system.push('gij');
        }
        this.check_secret_ws(js).then((res) => {
            console.log('check secret confirmed ');
            this.addNewUser(js.client.data.user).then((res) => {
                js.client.data.message = 'OK added a new user ';
                this.r_client.del(this._current_system + '_secret_' + js.client.gui);
                deferred.resolve(js);
            }).catch((err) => {
                console.log('error add new user ');
                console.log(err);
                js.client.data.message = err;
                deferred.reject(js);
            });
        }).catch((err) => {
            console.log('check secret error ' + err);
            js.client.data.message = err;
            deferred.reject(js);
        });
        return deferred.promise;
    }

    register(js) {
        js.client.data.user.system.push('default');
        this.addNewUser(js.client.data.user).then((res) => {
            js.client.data.message = 'OK added a new user';
            js.client.resp.send(js.client);
        }).catch((err) => {
            js.client.data.message = err;
            js.resp.send(js.client);
        });
    }

    cloneObj(from, to) {
        for (let o in to) {
            if (from[o] === undefined) {
                //to[o]=
            } else {
                to[o] = from[o];
            }
        }
        return to;
    }
    addNewUserManual_WS(js) {
        let deferred = Q.defer();
        let u: gijuser = {} as gijuser;
        //u = this.cloneObj(js.client.data.user, u);
        u = js.client.data.user;
        if (js.client.data.user.system === undefined) {
            js.client.data.user.system = [];
        }
        js.client.data.user.system.push('default');
        js.client.data.user.system.push('gij');
        console.log(this._current_system + ' adding sub user');
        this.addSubUser(js.client.data.user).then((res) => {
            console.log(this._current_system + ' added sub user');
            js.client.data.message = 'OK added a new user';
            deferred.resolve(js);
        }).catch((err) => {
            console.log(err);
            js.client.data.message = err;
            deferred.reject(js);
        });
        return deferred.promise;
    }
    addSubUser(userinfo) {
        let deferred = Q.defer();
        let db = this.create_db('gijusers');
        let parents = [];
        if (userinfo.parents === undefined) {
            userinfo.parents = ['default'];
        }
        else parents = userinfo.parents;
        console.log(userinfo.confirmpassword + "  -  " + userinfo.password);
        if (userinfo.confirmpassword != userinfo.password) {
            deferred.reject(new Error('ERROR wrong confirmed password'));
        }
        else {
            console.log('find sub username ');
            console.log(userinfo);
            this.findUserByUsername(userinfo.username).then((res) => {
                let p = res as gijuser[];
                if (p.length) {
                    deferred.reject(new Error('ERROR this user exist'));
                } else {
                    console.log('find exist USER');
                    this.findUserByUsername(parents).then((res) => {
                        console.log('find parent');
                        let p = res as gijuser[];
                        if (!p.length) {
                            userinfo.parents.push(this.defaultUser.username);
                        }
                        userinfo.username = userinfo.username.trim().toLowerCase();
                        let r;
                        if ((r = this.validateUserInfo(userinfo.username)).length) {
                            console.log('validate error username');
                            deferred.reject(r);
                        }
                        else if ((r = this.validatePhoneInfo(userinfo.phonenumber)).length) {
                            console.log('validate error phonenumber');
                            deferred.reject(r);
                        }
                        else if ((r = this.validatePassword(userinfo.password)).length) {
                            console.log('validate error password');
                            deferred.reject(r);
                        }
                        else {
                            userinfo.photo = [];
                            userinfo.description = '';
                            userinfo.note = '';
                            userinfo.gijvalue = 0;
                            userinfo.totalgij = 0;
                            userinfo.totalgijspent = 0;

                            db.insert(userinfo, userinfo.gui, (err, res) => {
                                if (err) deferred.reject(err);
                                else {
                                    console.log('user added');
                                    //console.log(res);
                                    deferred.resolve(res);
                                }
                            });
                        }
                    }).catch((err) => {
                        deferred.reject(err);
                    });
                }
            }).catch((err) => {
                deferred.reject(err);
            });
        }
        return deferred.promise;
    }

    addNewUser(userinfo) {
        let deferred = Q.defer();
        let db = this.create_db('gijusers');
        let parents = [];
        if (userinfo.parents === undefined) {
            userinfo.parents = ['default'];
        }
        parents.push(userinfo.parents[0]);
        //console.log(userinfo.confirmpassword+"  -  "+userinfo.password);
        if (userinfo.confirmpassword != userinfo.password)
            deferred.reject(new Error('ERROR wrong confirmed password'));
        else
            this.checkUserByPhone(userinfo.phonenumber).then((res) => {
                //console.log('phone length');
                //console.log(res);
                let p = res as gijuser[];
                if (p.length) {
                    deferred.reject(new Error('ERROR you could not use this phonenumber'));
                } else {

                    this.findUserByUsername(userinfo.username).then((res) => {
                        let p = res as gijuser[];
                        if (p.length) {
                            deferred.reject(new Error('ERROR this user exist'));
                        } else {
                            this.findUserByUsername(parents[0]).then((res) => {
                                let p = res as gijuser[];
                                if (!p.length) {
                                    userinfo.parents.push(this.defaultUser.username);
                                }
                                userinfo.username = userinfo.username.trim().toLowerCase();
                                let r;
                                if ((r = this.validateUserInfo(userinfo.username)).length)
                                    deferred.reject(r);
                                else if ((r = this.validatePhoneInfo(userinfo.phonenumber)).length)
                                    deferred.reject(r);
                                else if ((r = this.validatePassword(userinfo.password)).length)
                                    deferred.reject(r);
                                else {
                                    userinfo.gui = uuidV4();
                                    userinfo.createddate = this.convertTZ(new Date());
                                    userinfo.lastupdate = this.convertTZ(new Date());
                                    userinfo.isactive = true;
                                    userinfo.roles = ['user'];
                                    userinfo.description = "";
                                    userinfo.photo = "";
                                    userinfo.note = "";
                                    userinfo.gijvalue = 0;
                                    userinfo.totalgij = 0;
                                    userinfo.totalgijspent = 0;
                                    db.insert(userinfo, userinfo.gui, (err, res) => {
                                        if (err) deferred.reject(err);
                                        else {
                                            console.log('user added');
                                            //console.log(res);
                                            deferred.resolve(res);
                                        }
                                    });
                                }
                            }).catch((err) => {
                                deferred.reject(err);
                            });
                        }
                    }).catch((err) => {
                        deferred.reject(err);
                    });
                }
            }).catch((err) => {
                deferred.reject(err);
            });

        return deferred.promise;
    }

    validateUserInfo(u) {
        console.log(u);
        return this.userValidator.validate(u, {
            list: true
        });
    }

    validatePhoneInfo(p) {
        console.log(p);
        return this.phoneValidator.validate(p, {
            list: true
        });
    }

    saveAttachementsToFiles(array) {
        try {
            for (let index = 0; index < array.length; index++) {
                const element = array[index];
                //console.log(element.data)
                fs.writeFileSync(__dirname + '/public/profiles/' + element.name, element.data, 'utf8');
            }
        } catch (error) {
            throw error;
        }

    }

    update_user_ws(js) {
        let deferred = Q.defer();
        try {
            this.r_client.get(this._current_system + '_usergui_' + js.client.logintoken, (err, gui) => {
                if (err) {
                    js.client.data.message = err;
                    deferred.reject(js);
                } else if (gui) {
                    let c = JSON.parse(gui);
                    gui = c.gui;
                    this.findUserByGUI(gui).then((r) => {
                        if (r) {
                            // console.log('TEST');
                            // console.log(res);
                            let res = r as gijuser;
                            res.lastupdate = this.convertTZ(new Date());
                            res.photo = js.client.data.user.photo;
                            res.note = js.client.data.user.note;
                            res.description = js.client.data.user.description;
                            console.log('updating ......');
                            let attach = [];
                            if (res.photo.length > 1) {
                                throw new Error('ERROR too many photo');
                            }
                            for (let index = 0; index < res.photo.length; index++) {
                                const element: photoObj = res.photo[index] as photoObj;
                                attach.push({
                                    name: element.name,
                                    data: element.arraybuffer,
                                    content_type: element.type
                                });
                                element.arraybuffer = '';
                                element.url = '';
                            }
                            //console.log(`update user profile : `+JSON.stringify(res.photo));
                            this.updateUser(res).then((res) => {
                                this.saveAttachementsToFiles(attach);
                                console.log('update ok');
                                js.client.data.message = 'OK updated';
                                deferred.resolve(js);
                            }).catch(err => {
                                console.log(err);
                            });
                        } else {
                            //throw new Error('ERROR user not found');
                            throw new Error('ERROR user not found');
                        }
                    }).catch((err) => {
                        throw err;
                    });
                } else {
                    throw new Error('ERROR key not found');
                }
            });
        } catch (error) {
            js.client.data.message = error;
            deferred.reject(js);
        }



        return deferred.promise;
    }

    validate_phonenumber_ws(js) {
        let deferred = Q.defer();
        let phonesize = js.client.data.user.phonenumber.length;
        let phone = js.client.data.user.phonenumber;
        let LTC = phone.indexOf('205');
        let UNI = phone.indexOf('209');
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

    send_confirm_phone_sms_ws(js) {
        let deferred = Q.defer();
        let p: phoneObj;
        let phone = js.client.data.user.phonenumber;
        try {
            if (phone === js.client.data.user.newphonenumber) {
                js.client.data.message = new Error('ERROR old phone number and new phone number are the same ');
                deferred.reject(js);
            } else {
                this.r_client.get(this._current_system + '_phone_' + js.client.gui, (err, res) => {
                    if (err) {
                        js.client.data.message = err;
                        deferred.resolve(js);
                    } else {
                        if (res) {
                            js.client.data.message = new Error('ERROR could send more message need 3 minutes');
                            deferred.reject(js);
                        } else {
                            p = JSON.parse(res) as phoneObj;
                            this.validate_phonenumber_ws(js).then((res) => {
                                this.findUserByPhone(phone).then((res) => {
                                    if (res) {
                                        this.findUserByPhone(js.client.data.user.newphonenumber).then((res) => {
                                            if (res) {
                                                js.client.data.message = new Error('ERROR can not use this new phone number');;
                                                deferred.reject(js);
                                            } else {
                                                p.secret = this.randomSecret(6, '1234567890');
                                                //p.phonenumber=phone;
                                                this.setPhoneStatus(js.client, p.secret);
                                                this.SMSToPhone(js, 'your secret is :' + p.secret, js.client.data.user.newphonenumber);
                                                js.client.data.message = 'OK';
                                                deferred.resolve(js);
                                            }
                                        }).catch(err => {
                                            js.client.data.message = err;
                                            deferred.reject(js);
                                        });
                                    } else {
                                        js.client.data.message = new Error('ERROR phone or username not found');;
                                        deferred.reject(js);
                                    }
                                }).catch((err) => {
                                    js.client.data.message = err;
                                    deferred.reject(js);
                                });
                            }).catch((err) => {
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

    check_confirm_phone_ws(js) {
        let deferred = Q.defer();
        this.r_client.get(this._current_system + '_phone_' + js.client.gui, (err, r) => {
            if (err) {
                js.client.data.message = err;
                deferred.reject(js);
            } else {
                if (r) {
                    let res: phoneObj = JSON.parse(r) as phoneObj;
                    if (res.secret === js.client.data.secret) {
                        this.findUserByPhone(js.client.data.user.phonenumber).then((res) => {
                            if (res) {
                                js.client.data.message = 'OK secret';
                                deferred.resolve(js);
                            } else {
                                js.client.data.message = new Error('ERROR no phonenumber found');
                                deferred.reject(js);
                            }
                        }).catch((err) => {
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

    update_phone_ws(js) {
        let deferred = Q.defer();
        this.r_client.get(this._current_system + '_phone_' + js.client.gui, (err, r) => {
            if (err) {
                js.client.data.message = err;
                deferred.reject(js);
            } else {
                if (r) {
                    let res = JSON.parse(r) as phoneObj;
                    if (res.secret === js.client.data.secret) {
                        this.findUserByPhone(js.client.data.user.phonenumber).then((r) => {
                            let res: gijuser = r as gijuser;
                            if (res) {
                                //client.data.user.password=res.password;
                                if (res.oldphone === undefined)
                                    res.oldphone = [];
                                res.oldphone.push(res.phonenumber);
                                res.phonenumber = js.client.data.user.newphonenumber;
                                //delete js.client.data.user.newphonenumber;
                                js.client.data.user.phonenumber = res.phonenumber;
                                this.updateUser(res).then((res) => {
                                    this.r_client.del(this._current_system + '_phone_' + js.client.gui);
                                    js.client.data.message = 'OK updated';
                                    deferred.resolve(js);
                                });
                            } else {
                                js.client.data.message = new Error('ERROR user not found');
                                deferred.reject(js);
                            }
                        }).catch((err) => {
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

    show_user_list_ws(js) {
        let deferred = Q.defer();
        try {
            this.findUserByGUI(js.client.auth.gui).then(r => {
                let res: gijuser = r as gijuser;
                let page = (js.client.data.page === undefined) ? 0 : js.client.data.page;
                let maxpage = js.client.data.maxpage === undefined ? 10 : js.client.data.maxpage;
                this.findUserListByParentName(res.username, page, maxpage).then((res) => {
                    js.client.data.userinfo = res;
                    js.client.data.message = 'OK userlist';
                    deferred.resolve(js)
                });
            }).catch(err => {
                throw err;
            });
        } catch (error) {
            js.client.data.message = error;
            deferred.reject(js);
        }

        return deferred.promise;
    }
    showUserList(gui) {
        let deferred = Q.defer();
        this.findUserByGUI(gui).then(r => {
            let res: gijuser = r as gijuser;
            this.findUserListByParentName(res.username).then((res) => {
                deferred.resolve(res)
            });
        }).catch(err => {
            deferred.reject(err);
        });
        return deferred.promise;
    }

    countUserListByParentName(username) {
        let deferred = Q.defer();
        let db = this.create_db('gijusers');
        console.log('count User list by parent: ' + username)
        db.view(this.__design_view, 'countByParent', {
            key: [username + '']
        },
            (err, res) => {
                if (err) deferred.reject(err);
                else {
                    if (res) {
                        console.log(res);
                        if (res.rows.length) {
                            deferred.resolve(res.rows[0].value);
                        } else {
                            deferred.resolve(0);
                        }
                    }
                    else
                        deferred.resolve(0);
                }
            });
        return deferred.promise;
    }

    searchUserByParentName(parent, username, page, maxpage) {
        let deferred = Q.defer();
        let db = this.create_db('gijusers');
        this.countUserListByParentName(username).then(res => {
            let count = res;
            db.view(this.__design_view, 'searchByParent', {
                startkey: [parent + '', username + ''],
                endkey: [parent + '', username + '\ufff0'],
                descending: true,
                limit: maxpage,
                skip: page
            }, (err, res) => {
                if (err) deferred.reject(err);
                else {
                    if (res.rows.length) {
                        let arr = [];
                        for (let index = 0; index < res.rows.length; index++) {
                            const element = res.rows[index].value;
                            let e: any = {};
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
        });

        return deferred.promise;
    }

    findUserListByParentName(username, page = 0, maxpage = 10) {
        let deferred = Q.defer();
        let db = this.create_db('gijusers');
        this.countUserListByParentName(username).then((res) => {
            let count = res;
            console.log('count user list ' + count);
            if (res) {
                db.view(this.__design_view, 'findByParent', {
                    key: [username + ''], limit: maxpage, skip: page
                }, (err, res) => {
                    if (err) deferred.reject(err);
                    else {
                        if (res.rows.length) {
                            let arr = [];
                            for (let index = 0; index < res.rows.length; index++) {
                                const element = res.rows[index].value as gijuser;
                                let e: any = {};
                                e.gui = element.gui;
                                e.username = element.username;
                                e.phonenumber = element.phonenumber;
                                e.isactive = element.isactive;
                                e.lastupdate = element.lastupdate;
                                e._id = element['_id'];
                                e.photo = element.photo;
                                e.description = element.description;
                                e.note = element.note;
                                e.gijvalue = element.gijvalue;
                                e.totalgij = element.totalgij;
                                e.totalgijspent = element.totalgijspent;
                                arr.push(e);
                            }
                            console.log(` arr of usr list :${arr.length}
                            #end this`);
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
        }).catch((err) => {
            deferred.reject(new Error('ERROR not found by this parent'));
        });

        return deferred.promise;
    }
    update_sub_userinfo_ws(js) {
        let deferred = Q.defer();
        try {
            this.findUserByGUI(js.client.auth.gui).then(res => {
                let p = res as gijuser;
                this.findUserByGUI(js.client.data.user.gui).then(res => {
                    let u = res as gijuser;
                    if (u.parents.indexOf(p.username) > -1) {
                        u.description = js.client.data.user.description;
                        u.note = js.client.data.user.note;
                        u.isactive = js.client.data.user.isactive;
                        //u.phonenumber=js.client.data.user.phonenumber;                
                        this.updateUser(u).then(res => {
                            js.client.data.user = u;
                            js.client.data.message = 'OK update subuser info';
                            deferred.resolve(js);
                        });
                    } else {
                        throw new Error('ERROR you have are not their parents');
                    }

                });
            }).catch(err => {
                throw err;
            })

        } catch (error) {
            js.client.data.message = error;
            deferred.reject(js);
        }
        return deferred.promise;
    }
    reset_sub_user_password_ws(js) {
        let deferred = Q.defer();
        try {
            this.findUserByGUI(js.client.auth.gui).then(res => {
                let p = res as gijuser;
                this.findUserByGUI(js.client.data.user.gui).then(res => {
                    let u = res as gijuser;
                    if (u.parents.indexOf(p.username) > -1) {
                        u.password = '123456';
                        this.updateUser(u).then(res => {
                            u.password = '';
                            js.client.data.user = u;
                            js.client.data.message = 'OK reset subuser password to 123456';
                            deferred.resolve(js);
                        });
                    }
                    else {
                        throw new Error('ERROR you have are not their parents');
                        //deferred.reject(js);
                    }

                });
            }).catch(err => {
                throw err;
            });
        } catch (error) {
            js.client.data.message = error;
            deferred.reject(js);
        }
        return deferred.promise;
    }
    search_username_ws(js) {
        let deferred = Q.defer();
        this.searchUserByUsername(js.client.data.user.usename).then((res) => {
            js.client.data.userinfo = res;
            js.client.data.message = 'OK';
            deferred.resolve(js);
        }).catch((err) => {
            js.client.data.message = err;
            deferred.reject(js);
        });
        return deferred.promise;
    }
    get_user_ws(js) {
        let deferred = Q.defer();
        this.findUserByGUI(js.client.data.user.gui).then((res) => {
            js.client.data.user = res;
            js.client.data.message = 'OK';
            deferred.resolve(js);
        }).catch((err) => {
            js.client.data.message = err;
            deferred.reject(js);
        });
        return deferred.promise;
    }
    get_user_info_ws(js) {
        let deferred = Q.defer();
        this.findUserByGUI(js.client.auth.gui).then((res) => {
            js.client.data.user = res;
            js.client.data.message = 'OK';
            deferred.resolve(js);
        }).catch((err) => {
            js.client.data.message = err;
            deferred.reject(js);
        });
        return deferred.promise;
    }


    getAttachements(id) {
        let deferred = Q.defer();
        let db = this.create_db('gijusers');
        try {
            // db.multipart.get(id,(err,res)=>{
            //     if(err)throw err;
            //     else{
            //         deferred.resolve(res);
            //     }
            // });

            deferred.resolve(fs.readFileSync(__dirname + '/public/profiles/' + name, "utf8"));
        } catch (error) {
            deferred.reject(error);
        }
        return deferred.promise;
    }

    get_user_details_ws(js) {
        let deferred = Q.defer();
        this.r_client.get(this._current_system + '_usergui_' + js.client.logintoken, (err, gui) => {
            if (err) {
                js.client.data.message = err;
                deferred.reject(js);
            } else {
                if (gui) {
                    let c = JSON.parse(gui);
                    gui = c.gui;
                    this.displayUserDetails(gui).then((res) => {
                        js.client.data.user = res;
                        //console.log(` user photo `+JSON.stringify(res.photo));
                        if (js.client.data.user.photo === undefined || !js.client.data.user.photo) {
                            js.client.data.user.photo = [];
                        }
                        let currenthost = 'http://nonav.net:6688';
                        for (let index = 0; index < js.client.data.user.photo.length; index++) {
                            const element = js.client.data.user.photo[index];
                            // console.log(`reading file __dirname+'/public/profiles/'+element.name`); 
                            //element.arraybuffer=fs.readFileSync(__dirname+'/public/profiles/'+element.name, "binary");           
                            element.arraybuffer = '/public/profiles/' + element.name;
                        }
                        //console.log(js.client.data.user.photo.length)
                        js.client.data.message = 'OK';
                        deferred.resolve(js);
                    }).catch((err) => {
                        js.client.data.message = err;
                        deferred.reject(js);
                    });
                } else {
                    js.client.data.message = new Error('ERROR gui not found');
                    deferred.reject(js);
                }
            }
        });
        return deferred.promise;
    }

    displayUserDetails(gui) {
        let deferred = Q.defer();
        this.findUserByGUI(gui).then((res) => {
            if (res) {
                //console.log(res);
                this.filterObject(res);
                //console.log(res);
                deferred.resolve(res);
            } else {
                deferred.reject(new Error('ERROR no user profile'));
            }
        }).catch((err) => {
            deferred.reject(err);
        });
        return deferred.promise;
    }

    filterObject(obj) {
        var need = ['gui', '_rev', '_id', 'password', 'oldphone', 'system', 'parents', 'roles', 'isActive'];
        //console.log(key);
        for (let i in obj) {
            //if(i==='password')
            //console.log(obj[i]);
            for (let x = 0; x < need.length; x++) {
                let key = need[x];
                if (!obj.hasOwnProperty(i)) { } else if (Array.isArray(obj[i])) {
                    if (i.toLowerCase().indexOf(key) > -1)
                        obj[i] = [];
                } else if (typeof obj[i] === 'object') {
                    this.filterObject(obj[i]);
                } else if (i.indexOf(key) > -1) {
                    obj[i] = '';
                }
            }
        }
        return obj;
    }

    cleanUserInfo(element) {
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

    findUserByGUI(gui) {
        let deferred = Q.defer();
        let db = this.create_db('gijusers');
        db.view(this.__design_view, 'findByUserGui', {
            key: gui + ''
        }, (err, res) => {
            if (err) deferred.reject(err);
            else {
                let arr = [];
                for (let index = 0; index < res.rows.length; index++) {
                    const element = res.rows[index].value;
                    //cleanUserInfo(element);
                    arr.push(element);
                }
                console.log('FOUND ' + gui);
                console.log('length: ' + arr.length);
                if (arr.length < 2)
                    deferred.resolve(arr[0]);
                else
                    deferred.reject(new Error('ERROR system found more record please contact admin'));
            }
        });
        return deferred.promise;
    }

    private storage;


    // cleanLoginUsers() {
    //     for (let index = 0; index < _arrUsers.length; index++) {
    //         let startDate = moment(_arrUsers[index].logintime)
    //         let endDate = moment(this.convertTZ(new Date()));
    //         const timeout = endDate.diff(startDate, 'seconds');
    //         if (timeout > 60 * 60 * 24 * 3)
    //             delete _arrUsers[index];
    //     }
    // }

    logout_ws(js) {
        let deferred = Q.defer();
        let client = js.client;
        // for (let index = 0; index < _arrUsers.length; index++) {
        //     const element = _arrUsers[index];       
        //     if(element.username==client.data.username&&element.logintoken==client.data.logintoken){
        //this.r_client.del('_client_'+client.gui);    
        this.r_client.del(this._current_system + '_login_' + js.client.logintoken);
        this.r_client.del(this._current_system + '_usergui_' + js.client.logintoken);
        js.client.data = {};
        js.client.data.user = {};
        js.client.data.command = 'logout';
        js.client.accessedtime = this.convertTZ(new Date());
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

    logout(client) {
        // for (let index = 0; index < _arrUsers.length; index++) {
        //     const element = _arrUsers[index];       
        //     if(element.username==client.data.username&&element.logintoken==client.data.logintoken){
        this.r_client.del('_client_' + client.gui);
        this.r_client.del('_login_' + client.logintoken);
        this.r_client.del('_usergui_' + client.logintoken);
        //         delete _arrUsers[index];                
        //     }
        // }
    }

    cleanRedis(k) {
        let deferred = Q.defer();
        var jobs = [];
        this.r_client.keys('*', (err, keys) => {
            if (err) deferred.reject(err);
            else {
                for (let index = 0; index < keys.length; index++) {
                    const element = keys[index];
                    this.r_client.del(k);
                }
            }
        });
        return deferred.promise;
    }


    submit_forgot_keys_ws(js) {
        let deferred = Q.defer();
        this.get_for_got_keys(js).then((res) => {
            let content = '';
            content = 'send code to username:' + js.client.username;
            content += ' with phone number:' + js.client.data.user.phonenumber;
            content += ' please check SMS for keys ' + js.client.data.forgot;
            js.client.data.forgot = '';
            js.client.data.message = 'OK';
            console.log('forgot here');
            this.SMSToPhone(js, content, js.client.data.user.phonenumber);
            deferred.resolve(js)
        }).catch((err) => {
            js.client.data.message = err;
            deferred.reject(js);
        });
        return deferred.promise;
    }

    randomSecret(howMany, chars) {
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
    private phoneSecret = [];

    setPhoneStatus(client, secret) {
        this.r_client.set(this._current_system + '_phone_' + client.gui, JSON.stringify({
            command: 'phone-changed',
            secret: secret
        }), 'EX', 60 * 3);
    }

    setUserGUIStatus(client, gui) {
        this.r_client.set(this._current_system + '_usergui_' + client.logintoken, JSON.stringify({
            command: 'usergui-changed',
            gui: gui
        }), 'EX', 60 * 30);
    }

    setLoginStatus(client) {
        this.r_client.set(this._current_system + '_login_' + client.logintoken, JSON.stringify({
            command: 'login-changed',
            client: client
        }), 'EX', 60 * 5);
    }

    setForgotStatus(client, keys) {
        this.r_client.set(this._current_system + '_forgot_' + client.gui, JSON.stringify({
            command: 'forgot-changed',
            forgot: keys
        }), 'EX', 60 * 3);
    }

    setClientStatus(client) {
        console.log('set client');
        this.r_client.set(this._current_system + '_client_' + client.gui, JSON.stringify({
            command: 'client-changed',
            client: client
        }), 'EX', 60 * 5);
    }



    setOnlineStatus(client) {
        try {
            this.r_client.get(this._current_system + '_online_' + client.username, (err, r) => {
                if (err) {
                    client.data.message = err;
                    this.setErrorStatus(client);
                } else {
                    let arr = [{
                        logintoken: client.logintoken,
                        loginip: client.loginip,
                        clientip: client.clientip,
                        gui: client.gui
                    }];
                    if (r) {
                        let res = JSON.parse(r) as onlineObj;
                        if (res['client'].login !== undefined) {
                            // res.client.login.push(arr[0]);
                            // arr=res.login;
                            let exist = false;
                            for (let index = 0; index < res['client'].login.length; index++) {
                                const element = res.client.login[index];
                                if (element['gui'] === client.gui && element.clientip === client.clientip && element.loginip === client.loginip) {
                                    exist = true;
                                    console.log(' set online exist');
                                    break;
                                }
                            }
                            if (!exist) {
                                arr = res.client.login.concat(arr);
                            }
                        }
                    }
                    this.r_client.set(this._current_system + '_online_' + client.username, JSON.stringify({
                        command: 'online-changed',
                        client: {
                            username: client.username,
                            onlinetime: this.convertTZ(new Date()),
                            system: this._current_system,
                            login: arr,
                        }
                    }), 'EX', 60 * 5);
                }
            });
        } catch (error) {
            console.log(error);
            client.data.message = error;
            this.setErrorStatus(client);
        }

    }

    setErrorStatus(client) {
        this.r_client.set(this._current_system + '_error_' + client.gui, JSON.stringify({
            command: 'error-changed',
            client: client
        }), 'EX', 60 * 5);
    }

    setNotificationStatus(client) {
        this.r_client.set(this._current_system + '_notification_' + client.gui, JSON.stringify({
            command: 'notification-changed',
            client: client
        }), 'EX', 60 * 30); // client side could not see this , the other server as a client can see this .
    }

    LTCserviceSMS(c) {
        try {
            let client = JSON.parse(JSON.stringify(c));
            client.data.command = 'send-sms'
            client.prefix = 'user-management';
            let ws_client = new WebSocket('ws://nonav.net:8081/'); //ltcservice
            ws_client.binaryType = 'arraybuffer';
            let parent = this;
            ws_client.on('open', () => {
                let b = Buffer.from(JSON.stringify(client)).toString('base64');                
                let a = Buffer.from(b);
                ws_client.send(JSON.stringify(b), { binary: true }, (err) => {
                    if (err) {
                        client.data.message = err;
                        client.data.sms.content = '';
                        parent.setErrorStatus(client);
                    }
                    console.log('socket open...');
                    //client.data.sms.content=''; /// FOR TESTING ONLY
                    client.data.message = 'SMS has been sent out';
                    client.prefix = '';
                    parent.setNotificationStatus(client);

                });
            });
            ws_client.on('message', (data) => {
                console.log("received  FROM SMS : ");
                let b = parent.ab2str(data);                    
                let s = Buffer.from(b, 'base64').toString();
                client = JSON.parse(s);
                //console.log(client);
                //client.data.sms.content=''; /// FOR TESTING ONLY
                client.data.message = 'SMS received!';
                client.data.command = 'received-sms';
                client.prefix = '';

                parent.setNotificationStatus(client);
                //setOnlineStatus(client);

            });
            ws_client.on("error", (err) => {
                client.data.message = err;
                parent.setErrorStatus(client);
            });
        } catch (error) {
            c.data.message = error;
            this.setErrorStatus(c);
        }

    }
    //SMSToPhone('TEST','2055516321');
    SMSToPhone(js, content, phone) {
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
            this.validate_phonenumber_ws(js).then((res) => {
                console.log('validate: ' + res);
                if (res) {
                    console.log('SMS to ' + js.client.data.sms.phonenumber);
                    this.LTCserviceSMS(js.client);
                }
            }).catch((err) => {
                throw err;
            });
        } catch (error) {
            throw error;
        }
    }

    //var _arrForgotKeys = [];
    //const crypto = require("crypto");

    //const id = crypto.randomBytes(16).toString("hex");
    generateFogotKeys(username) {
        return crypto.randomBytes(2).toString("base64");
    }

    get_for_got_keys(js) {
        //SMS to phone the forgot key
        let deferred = Q.defer();
        //console.log('forgot here 0'+js.client.data.user.phonenumber);
        //console.log(js);
        this.r_client.get(this._current_system + '_forgot_' + js.client.gui, (err, res) => {
            if (err) {
                deferred.reject(err);
            } else {
                if (res) {
                    deferred.reject(new Error('ERROR could not send next sms need 3 minutes'));
                } else {
                    this.findUserByPhone(js.client.data.user.phonenumber).then((res: gijuser) => {
                        if (res) {
                            let keys = this.randomSecret(6, '1234567890');
                            js.client.username = res.username;
                            js.client.data.forgot = keys;
                            this.setForgotStatus(js.client, keys);


                            //console.log('forgot here 1');
                            //js.client.data.message='OK';
                            deferred.resolve("OK");
                        } else {
                            deferred.reject(new Error('ERROR phone number not found'));
                        }
                    }).catch((err) => {
                        // console.log(err);
                        //js.client.data.message=err;
                        deferred.reject(err);
                    });
                }
            }
        });
        return deferred.promise;
    }

    checkUserByPhone(phone) {
        let deferred = Q.defer();
        let db = this.create_db('gijusers');
        db.view(this.__design_view, 'findByPhone', {
            key: phone + ''
        }, (err, res) => {
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

    findUserByPhone(phone) {
        let deferred = Q.defer();
        let db = this.create_db('gijusers');
        db.view(this.__design_view, 'findByPhone', {
            key: phone + ''
        }, (err, res) => {
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




    forgot_password_ws(js) {
        let deferred = Q.defer();
        // console.log(js);
        this.reset_password(js).then((res) => {
            //console.log('forgot pass');
            js.client.data.message = res;
            deferred.resolve(js);
        }).catch((err) => {
            js.client.data.message = err;
            deferred.reject(js);
        });
        return deferred.promise;
    }

    check_forgot_ws(js) {
        let deferred = Q.defer();
        this.findUserByPhone(js.client.data.user.phonenumber).then((res: gijuser) => {
            if (res) {
                this.r_client.get(this._current_system + '_forgot_' + js.client.gui, (err, res) => {
                    if (err) deferred.reject(err);
                    else {
                        if (res) {
                            res = JSON.parse(res);
                            if (res['forgot'] === js.client.data.forgot) {
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
            } else {
                deferred.reject(new Error('ERROR phone number not found'));
            }
        }).catch((err) => {
            deferred.reject(err);
        });

        return deferred.promise;
    }

    reset_password(js) {
        let deferred = Q.defer();
        this.r_client.get(this._current_system + '_forgot_' + js.client.gui, (err, res) => {
            if (err) deferred.reject(err);
            else {
                if (res) {
                    res = JSON.parse(res);
                    if (res['forgot'] === js.client.data.forgot) {
                        this.findUserByPhone(js.client.data.user.phonenumber).then((res: gijuser) => {
                            if (res) {
                                res.password = "123456";
                                this.updateUser(res).then((res) => {
                                    this.r_client.del(this._current_system + '_forgot_' + js.client.gui);
                                    deferred.resolve('OK 123456');
                                });
                            } else {
                                deferred.reject(new Error('ERROR phone number not found'));
                            }
                        }).catch((err) => {
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

    searchUserByUsername(username) {
        let deferred = Q.defer();
        try {
            let db = this.create_db('gijusers');
            db.view(this.__design_view, 'searchByUsername', {
                startkey: username + '',
                endkey: username + '\ufff0"',
                limit: 30,
                descending: true,
            }, (err, res) => {
                if (err) deferred.reject(err);
                else {
                    //console.log(res);
                    let arr = [];
                    for (let index = 0; index < res.rows.length; index++) {
                        const element = res.rows[index].value;
                        arr.push(element);
                    }
                    deferred.resolve(arr);
                }
            });
        } catch (error) {
            deferred.resolve(error);
        }

        return deferred.promise;
    }

    find_username_ws(js) {
        let deferred = Q.defer();
        //console.log(js.client.data);
        let name = js.client.data.user.username;
        //console.log('FIND BY USERNAME WS ' + name);
        this.findUserByUsername(name).then(res => {
            js.client.data.message = 'OK find  username';
            js.client.data.user = res;
            deferred.resolve(js);
        }).catch(err => {
            js.client.data.message = err;
            deferred.reject(js);
        });
        return deferred.promise;
    }

    find_many_username_ws(js) {
        let deferred = Q.defer();
        let names = js.client.data.usernames;
        this.findUserByUsername(names).then(res => {
            js.client.data.message = 'OK find many usernames';
            js.client.data.user = res;
            deferred.resolve(js);
        }).catch(err => {
            js.client.data.message = err;
            deferred.reject(js);
        });
        return deferred.promise;
    }

    findUserByUsername(username) {
        let deferred = Q.defer();
        let db = this.create_db('gijusers');
        try {
            console.log('find username : ' + username);
            if (username === undefined)
                username = [];
            else if (typeof (username) === 'string') {
                username = [username];
            }
            db.view(this.__design_view, 'findByUsername', {
                keys: username
            }, (err, res) => {
                if (err) deferred.reject(err);
                else {
                    //console.log(res);
                    console.log('find users');
                    // console.log(res.rows[0].value);
                    if (res.rows.length == 1) {
                        deferred.resolve([res.rows[0].value]);
                    } else if (res.rows.length > 1) {
                        let arr = [];
                        for (let index = 0; index < res.rows.length; index++) {
                            const element = res.rows[index].value;
                            arr.push(element);
                        }

                        deferred.resolve(arr);
                    } else {
                        deferred.resolve([]);
                    }
                }
            });
        } catch (error) {
            deferred.reject(error);
        }

        return deferred.promise;
    }

    change_password_ws(js) {
        let deferred = Q.defer();
        if (js.client.data.user.newpassword != js.client.data.user.confirmpassword) {
            js.client.data.message = new Error('ERROR wrong confirm password');
            deferred.reject(js);
        } else
            this.r_client.get(this._current_system + '_usergui_' + js.client.logintoken, (err, gui) => {
                if (err) {
                    js.client.data.message = err;
                    deferred.reject(js);
                } else {
                    if (gui) {
                        let c = JSON.parse(gui);
                        gui = c.gui;
                        this.findUserByGUI(gui).then((res) => {
                            this.change_password(js, js.client.data.user.phonenumber, js.client.data.user.oldpassword, js.client.data.user.newpassword).then((res) => {
                                js.client.data.message = 'OK changed password';
                                deferred.resolve(js);
                            })
                        }).catch(err => {
                            js.client.data.message = err;
                            deferred.reject(js);
                        });
                    } else {
                        js.client.data.message = new Error('ERROR gui not found');
                        deferred.reject(js);
                    }
                }
            });
        return deferred.promise;
    }

    checkUserPermission(username) {
        this.findUserByUsername(username).then((res: gijuser[]) => {
            // console.log(res);
            if (res.length)
                return true;
            return false;
        }).catch((err) => {
            console.log(err);
            return false;
        });
        return false;
    }

    validatePassword(pass) {
        return this.passValidator.validate(pass, {
            list: true
        });

    }

    updateUser(userinfo) {
        let deferred = Q.defer();
        let db = this.create_db('gijusers');
        try {
            if (!userinfo._rev) {
                userinfo.gui = uuidV4();
                userinfo._id = userinfo.gui;
            }
            db.insert(userinfo, userinfo._id, (err, body) => {
                if (err) throw err;
                else {
                    deferred.resolve('OK update');
                }

            });
            // db.insert(userinfo, userinfo._id, (err, res)=> {
            //     if (err) deferred.reject(err);
            //     else {
            //         deferred.resolve('OK ' + JSON.stringify(res));
            //     }
            // });    
        } catch (error) {
            deferred.reject(error);
        }

        return deferred.promise;
    }

    change_password(js, phone, oldpass, newpass) {
        let deferred = Q.defer();
        let db = this.create_db('gijusers');
        let username = js.client.username;
        let gui = js.client.gui;
        console.log("username:" + username);
        console.log("phone:" + phone);
        console.log("oldpass:" + oldpass);
        console.log("newpass:" + newpass);
        this.findUserByUsernameAndPhone(username, phone).then((res: gijuser) => {
            // console.log('found :' + JSON.stringify(res));
            if (res) {
                if (res.password != oldpass)
                    deferred.reject(new Error('ERROR wrong password'));

                let passValidate = this.validatePassword(newpass);
                if (passValidate.length) deferred.reject(new Error('ERROR validating ' + (passValidate.toString())));
                else {
                    res.password = newpass;
                    console.log('updating ' + JSON.stringify(res));
                    this.updateUser(res).then(res => {
                        let content = 'your password has been changed';
                        this.SMSToPhone(js, content, phone);
                        deferred.resolve('OK');
                    }).catch(err => {
                        deferred.reject(err);
                    });
                }
            } else {
                throw new Error('ERROR username and phone not found');
            }
        }).catch((err) => {
            deferred.reject(err);
        });
        return deferred.promise;
    }

    findUserByUsernameAndPhone(username, phone) {
        let deferred = Q.defer();
        let db = this.create_db('gijusers');
        console.log("finding : " + username + " phone:" + phone);
        db.view(this.__design_view, 'findByUsernameAndPhone', {
            key: [username + '', phone + '']
        }, (err, res) => {
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

    initDB() {

        this.init_db('gijusers', this.__design_users);
        this.init_db('targetmsg', this.__design_targetmsg);
        this.init_db('pendingrequest', this.__design_pendingrequest);
    }

    create_db(dbname) {
        let db;
        this.nano.db.create(dbname, (err, body) => {
            // specify the database we are going to use    
            if (!err) {
                console.log('database ' + dbname + ' created!');
            } else
                console.log(dbname + " could not be created!");
        });
        db = this.nano.use(dbname);
        return db;
    };

    init_db(dbname, design) {
        // create a new database
        var db;
        async.eachSeries([
            db = this.create_db(dbname),
            db = this.nano.use(dbname),
            db.insert(design, (err, res) => {
                if (err) {
                    //console.log(design);
                    //console.log(err);
                    db.get('_design/objectList', (err, res) => {
                        if (err) {
                            console.log(dbname);
                            console.log(design);
                            console.log('could not find design ' + err);
                        } else {
                            if (res) {
                                var d = res;
                                //console.log("d:"+JSON.stringify(d));
                                db.destroy('_design/objectList', d._rev, (err, res) => {
                                    if (err) console.log(err);
                                    else {
                                        //console.log(res);
                                        db.insert(design, "_design/objectList", (err, res) => {
                                            if (err) console.log('err insert new design ' + dbname + err);
                                            else {
                                                //console.log('insert design completed ' + dbname);
                                            }
                                        });
                                    }
                                });
                            } else {
                                db.insert(design, "_design/objectList", (err, res) => {
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
        ], (err) => {
            console.log('exist ' + dbname);
        });
        //db = nano.use(dbname);
        //return db;
    }

    init_redis() {
        this.r_client.flushdb((err, succeeded) => {
            console.log(succeeded); // will be true if successfull
        });
    }

    errorHandler(err, req, res, next) {
        console.log(err);
        var l = {
            log: err,
            logdate: this.convertTZ(new Date()),
            type: "error",
            gui: uuidV4()
        };
        this.errorLogging(l);
        if (res.headersSent) {
            return next(err);
        }
        res.status(500);
        res.render('error', {
            error: err
        });
    }

    errorLogging(log) {
        var db = this.create_db("errorlogs");
        console.log(log);
        db.insert(log, log.gui, (err, body) => {
            if (err) console.log(err);
            else {
                console.log("log oK ");
            }
        });
    }

    /****** INIT DB */



}
export default new App().server;