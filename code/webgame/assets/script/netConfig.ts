import onfire from 'onfire.js';
//事件类型
class Event {
    code;// 操作标识符(可以用于标识操作种类/该操作应该由哪一个模块来进行处理)(只有这部分是像服务器发送的)
    playerId: number;// 操作玩家ID
    data;// 其他数据
    special: boolean;//是否是下面定义的特殊信号(特殊信息会由后端拦截处理)
}

//帧信息格式
interface Message {
    frameNo: number;
    ops: Event[];
}
//随机数生成器
class Random {
    seed: number;
    constructor(seed: number) {
        this.seed = seed;
    }
    seededRandom = function () {
        let max = 1;
        let min = 0;
        this.seed = (this.seed * 9301 + 49297) % 233280;
        var rnd = this.seed / 233280.0;
        return min + rnd * (max - min);
    }
}
const { ccclass, property } = cc._decorator;
@ccclass
export default class net extends cc.Component {

    //服务器ip
    server_ip: string = '106.54.61.151';
    roomId: string = "";
    playerId: string = "";
    //游戏状态
    pause: boolean = false;
    //帧速率
    fps: number = 30;
    seed: number;
    //事件板
    informboard: cc.Node = null;
    //游戏开始
    game_start: boolean = false;
    //websocket定义
    websocket = {
        _sock: {},  //当前的webSocket的对象
        host: "",
        connect: function () {
            if (this._sock.readyState !== 1) {
                this._sock = new WebSocket(this.host);
                this._sock.onopen = this._onOpen.bind(this);
                this._sock.onclose = this._onClose.bind(this);
                this._sock.onmessage = this._onMessage.bind(this);
                this._sock.onerror = this._onError.bind(this);
            }
            return this;
        },
        //绑定的触发函数
        _onOpen: function () {
            console.log("连接成功！" + this.host);
        },

        _onClose: function (err) {
            window["onfire"].fire("onclose", err);
            console.log(this.host + "执行的是onClose函数!" + err);
        },

        _onMessage: function (res) {
            //转为message对象
            var Data = JSON.parse(res.data);
            console.log("收到信息" + JSON.stringify(Data.ops[0]));
            window["onfire"].fire("onmessage", Data);
        },

        _onError: function (err) {
            console.log(this.host + "执行的是onError函数" + err);
        },

        send: function (msg) {
            //console.log("发送信息" + JSON.stringify(msg));
            var _this = this;
            setTimeout(() => {
                if (_this._sock.readyState == 1) {
                    //转译json
                    _this._sock.send(JSON.stringify(msg));
                }
            }, 0)
        },

        close: function () {
            this._sock.close();
        }
    };

    //游戏结束
    onclose(err) {

    }

    //信息的处理
    onmessage(res) {
        //如果开始则更新游戏帧
        if (this.game_start) {
            this.gameupdate(res);
        }
        let ops = res.ops;
        //检查是否存在特殊的消息
        for (let i = 0; i < ops.length; i++) {
            if (ops[i].special) {
                //特殊信息处理
                switch (ops[i].code) {
                    case "START":
                        //游戏开始
                        this.game_start = true;
                        window["onfire"].fire("onstart");
                        break;
                    case "DISCONNECT":
                        //玩家断开连接
                        this.inform_open("等待另一位玩家响应...");
                        break;
                    case "CONNECT":
                        //玩家恢复连接
                        this.inform_close();
                        break;
                    default:
                        console.log("未知的特殊信息");
                        break;
                }
            }
        }
    }
    //获取房间id
    getroomid() {
        const url = new URL(window.location.href);
        const params = new URLSearchParams(url.search);
        return params.get('roomId');
    }

    //获取玩家id
    getplayerid() {
        let res = cc.sys.localStorage.getItem('playerId');
        return res;
        // const url = new URL(window.location.href);
        // const params = new URLSearchParams(url.search);
        // return params.get('playerId');
    }
    //获取游戏模式
    getmode() {
        const url = new URL(window.location.href);
        const params = new URLSearchParams(url.search);
        return params.get('mode');
    }
    //处理帧
    gameupdate(message) {
        // 处理消息
        let ops = message.ops;
        for (let j = 0; j < ops.length; j++) {
            let event = ops[j];
            if (event.special) continue;
            // 事件分发
            event.code = JSON.parse(event.code);
            window["onfire"].fire(event.code.name, event);
        }
        // 执行游戏引擎的下一帧更新
        if(!this.pause)
            window["onfire"].fire("onupdate",1/this.fps);
    }

    //向服务器发送消息（以事件为单位）
    sendEvent(name: string, data = null) {
        let code = {
            name: name,
            data: data,
        }
        this.websocket.send(code);
    }
    //http-api
    //上传游戏记录
    //代理地址/gameapi
    uploadGameRecord(score: number, tiemCost: number, complete: boolean) {
        let xhr = new XMLHttpRequest();
        let url = `http://${this.server_ip}:10000/uploadGameRecord`;
        let params = {
            playerId: window['playerId'],
            score: score,
            timeCost: tiemCost,
            complete: complete,
        }; // 参数对象
        xhr.open('POST', url, true);
        xhr.setRequestHeader("Content-Type", "application/json;charset=utf-8");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                var responseJson = JSON.parse(xhr.responseText);
                if (xhr.status === 200) {
                    console.log('上传成功');
                } else {
                    console.error('上传失败:', responseJson.msg);
                }
            }
        };
        xhr.send(JSON.stringify(params));
    }
    generateSeed() {
        const timestamp = Date.now();
        const random = Math.random() * 1000000;
        return `${timestamp}${random}`;
    }
    //信息板控制
    inform_open(str: string) {
        this.informboard.active = true;
        this.informboard.children[0].getComponent(cc.Label).string = str;
    }
    inform_close() {
        this.informboard.active = false;
    }
    //页面重定向
    jmp_gameover() {
        window.location.href = `http://${this.server_ip}/front/game_mode.html`
    }
    onLoad() {
        this.informboard = cc.find("Canvas/informboard");
        //全局使用事件监听
        window["onfire"] = new onfire();
        //获取id
        this.roomId = this.getroomid();
        this.playerId = this.getplayerid();
        window["mode"] = parseInt(this.getmode());
        this.seed = parseInt(this.generateSeed(), 10);
        window["onfire"].on("pause", () => {this.pause = !this.pause;});
        console.log("房间号：" + this.roomId, "玩家号：" + this.playerId, "模式：" + window["mode"]);
        //多人模式服服务器连接
        if (window["mode"] != 0) {
            //启动服务器监听，绑定
            this.websocket.host = `ws://${this.server_ip}:10000/websocket/${this.roomId}/${this.playerId}`;
            this.websocket.connect();
            window["onfire"].on("onclose", this.onclose.bind(this));
            window["onfire"].on("onmessage", this.onmessage.bind(this));
            //同步随机种子(房间号)
            this.seed = parseInt(this.roomId);
        }
        else{//帧速率控制器 (定时器每秒60帧)
            this.fps=60;
            this.schedule(function () {
                window["onfire"].fire("onupdate",1/this.fps);
            }, 1 / this.fps);
        }
        window["random"] = new Random(this.seed);
        //标识id
        window["playerId"] = parseInt(this.playerId);
    }

}
