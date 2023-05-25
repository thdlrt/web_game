// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

class player {
    //零件收集数目(零件数目分别计算，分数一起计算)
    score: number;
    //地球生命值
    heart: number;
    //地球攻击力
    attack: number;
    //攻击速度
    speed: number;
    //地球等级
    level: number;
    //升级到下一目标需要的零件数目
    up: number;
    //下一目标
    need: number;
    //下标
    index: number;
    //玩家实例
    player: cc.Node;
    constructor(score: number, heart: number, attack: number, speed: number, level: number, up: number, player: cc.Node) {
        this.score = score;
        this.heart = heart;
        this.attack = attack;
        this.speed = speed;
        this.level = level;
        this.up = up;
        this.need = up;
        this.player = player;
    }
}

const { ccclass, property } = cc._decorator;

@ccclass
export default class Game extends cc.Component {
    // 元素 Prefab
    @property(cc.Prefab)
    factorPrefab: cc.Prefab = null;
    @property(cc.Prefab)
    bulletPrefab: cc.Prefab = null;
    @property(cc.Prefab)
    itemPrefab: cc.Prefab = null;
    @property(cc.Prefab)
    f_bulletPrefab: cc.Prefab = null;
    // 元素对象池
    factorPool: cc.NodePool = new cc.NodePool();
    bulletPool: cc.NodePool = new cc.NodePool();
    itemPool: cc.NodePool = new cc.NodePool();
    f_bulletPool: cc.NodePool = new cc.NodePool();
    // Canvas节点
    canvas: cc.Node = null;
    static inst: Game = null;
    //地球移动速度
    movespeed: number = 200;
    //移动方向
    isLeft: boolean = false;
    isRight: boolean = false;
    isUp: boolean = false;
    isDown: boolean = false;
    //游戏状态(阶段)
    gameState: number = 0;
    //游戏得分
    mask: number = 0;
    //第一阶段时间
    time_1: number = 10;
    //最大等级
    maxlevel: number = 4;
    //菜单状态
    menustate: boolean = false;
    //第二阶段目标分数
    target: number = 30;
    //游戏模式：0单机模式；1同屏合作；2分屏竞速
    mode: number = 0;
    //玩家信息
    players: player[] = [];
    //网络脚本
    netScript;
    //事件板
    informboard: cc.Node = null;
    //开始时间
    time_begin: number;
    //总共时间
    time_sum: number = 0;
    onLoad() {
        this.netScript = cc.find('gamecontrol').getComponent('netConfig');
        //ui显示控制
        let scoreboard = cc.find("Canvas/ui/progressboard");
        scoreboard.active = false;
        let warnning = cc.find("Canvas/warnning");
        warnning.active = false;
        let boss = cc.find("Canvas/boss");
        boss.active = false;
        this.informboard = cc.find("Canvas/informboard");
        //键盘事件
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.keyDownEvent, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.keyUpEvent, this);
        //显示层级控制（背景0，元素1-9，ui10）
        cc.find('Canvas/ui').zIndex = 10;
        cc.find('Canvas/background').zIndex = 0;
        cc.find('Canvas/earth').zIndex = 5;
        cc.find('Canvas/warnning').zIndex = 9;
        Game.inst = this;
        this.canvas = cc.find('Canvas');
        //隐藏菜单
        this.menucontrol();
        if (window["mode"] == 0) {
            this.initgame();
        }
        else {
            //延迟开始游戏
            window["onfire"].on("onstart", this.initgame.bind(this));
            //添加等待动画
            this.inform_open("等待其他玩家加入...");
        }
    }
    //游戏初始化
    initgame() {
        //事件绑定
        window["onfire"].on("pause", this.onmenu.bind(this));
        window["onfire"].on("onupdate", this.onupdate.bind(this));
        //开启碰撞检测
        let manager = cc.director.getCollisionManager();
        manager.enabled = true;
        //元素生成
        this.schedule(this.onCreating, 0.5, cc.macro.REPEAT_FOREVER, 0.75);
        //游戏模式
        this.mode = window["mode"];
        console.log("游戏模式：" + this.mode);
        //玩家初始化
        this.players.push(new player(0, 999, 5, 0.3, 1, 1, cc.instantiate(cc.find('Canvas/earth'))));
        this.players[0].player.getComponent('earth').id = 0;
        this.players[0].player.parent = cc.find('Canvas');
        switch (this.mode) {
            case 0:
                break;
            case 1:
                console.log("同屏合作模式！");
                this.players.push(new player(0, 999, 5, 0.3, 1, 1, cc.instantiate(cc.find('Canvas/earth'))));
                this.players[1].player.getComponent('earth').id = 1;
                this.players[1].player.parent = cc.find('Canvas');
                this.players[1].player.children[0].active = false;
                window["onfire"].on("move", this.onMove.bind(this));
                break;
            case 2:
                break;
            default:
                console.log("未知模式！");
                break;
        }
        cc.find('Canvas/earth').active = false;
        this.inform_close();
        //开始计时
        this.time_begin = Date.now();
        this.startGame_1();
    }
    //信息板控制
    inform_open(str: string) {
        this.informboard.active = true;
        this.informboard.children[0].getComponent(cc.Label).string = str;
    }
    inform_close() {
        this.informboard.active = false;
    }
    //ui显示控制
    update_ui() {
        //更新收集数目
        let score = cc.find("Canvas/ui/scoreboard");
        let label = score.children[0];
        //更新得分
        let mask = score.children[4];
        mask.getComponent(cc.Label).string = this.mask + '';
        //跟新游戏进度/BOSS血量
        let progress = cc.find("Canvas/ui/progressboard").children[0].getComponent(cc.ProgressBar);
        if (this.gameState == 2) {
            progress.progress = this.mask / this.target;
        }
        else if (this.gameState == 3) {
            let boss = cc.find("Canvas/boss").getComponent("boss");
            progress.progress = boss.heart / boss.heart_s;
        }
        //显示升级目标(本地玩家的)
        if (this.players[0].score < 4 * this.players[0].up) {
            label.getComponent(cc.Label).string = this.players[0].score + ' / ' + this.players[0].need;
        }
        else {
            label.getComponent(cc.Label).string = "MAX";
        }
        //更新生命值显示
        let heart = score.children[2];
        heart.getComponent(cc.Label).string = this.players[0].heart + '';
    }
    onupdate(dt) {
        this.update_ui();
        //是否还有玩家没有死亡
        let alive = false;
        //开始boss站
        if (this.mask >= this.target && this.gameState == 2) {
            this.gameState = 3;
            this.start_boss();
        }
        //结束boss战
        if (this.gameState == 4) {
            this.gameState = 0;//帮助关闭射击系统等
            this.end_boss();
        }
        //本地玩家移动响应
        this.playerMove(dt);
        //对每个玩家进行更新
        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i];
            //判断玩家是否死亡
            if (this.players[i].heart <= 0) {
                //播放死亡动画
                this.players[i].player.active = false;
            }
            else
                alive = true;
            //升级系统
            //地球（0-5）：单行子弹->地球（5-10）：三行子弹->地球（10-20）：三行子弹加少量导弹->死星（20+）:三行贯穿激光(伤害加倍)加大量导弹
            if (player.score == player.need && player.level < this.maxlevel) {
                ++player.level;
                //最后一级要求高一点
                if (player.level == 3)
                    player.need += player.up;
                player.need += player.up;
                //更换贴图
                //动画>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
                if (player.level == 4) {
                    player.attack *= 2;
                    this.node.rotation = 0;
                    let sprite = player.player.getComponent(cc.Sprite);
                    cc.resources.load("picture/death", cc.SpriteFrame, (err, spriteFrame) => {
                        if (err) cc.log(err);
                        sprite.spriteFrame = <cc.SpriteFrame>spriteFrame;
                    });
                }
            }
        }
        if (!alive) {
            this.gameOver();
        }
    }
    //移动系统(仅多人模式时启用)
    onMove(event) {
        let playerId = Number(event.playerId == window["playerId"]);
        let targetNode = this.players[playerId ^ 1].player;
        let x = targetNode.x + event.code.data.x, y = targetNode.y + event.code.data.y;
        let earth = this.players[0].player;
        let w: number = this.canvas.width / 2 - earth.width / 2;
        let h: number = this.canvas.height / 2 - earth.height / 2;
        if (x < -w) {
            x = -w;
        }
        if (x > w) {
            x = w;
        }
        if (y > h) {
            y = h;
        }
        if (y < -h) {
            y = -h;
        }
        targetNode.x = x;
        targetNode.y = y;
    }
    //游戏流程操控
    startGame_1() {
        this.gameState = 1;
        cc.log("startGame_1");
        //音频会自动播放
        //开启计时器
        this.schedule(function () {
            let timeboard = cc.find("Canvas/ui/timeboard");
            let label = timeboard.children[0];
            label.getComponent(cc.Label).string = this.time_1 + '';
            this.time_1 -= 1;
            if (this.time_1 < 0) {
                this.unschedule(this.time_1);
                this.endGame_1();
            }
        }, 1, this.time_1);
    }
    //游戏失败
    gameOver(complete: boolean = false) {
        this.gameState = 0;
        cc.log("gameOver");
        //停止播放bgm
        let bgm: cc.AudioSource = this.node.getComponent(cc.AudioSource);
        bgm.stop();
        //关闭碰撞检测
        let manager = cc.director.getCollisionManager();
        manager.enabled = false;
        //切换选择场景
        cc.director.loadScene('gameover');
        //上传分数
        //this.netScript.uploadGameRecord(this.mask, this.time_sum, complete);
    }
    endGame_1() {
        this.gameState = 0;
        cc.log("endGame_1");
        //更换播放bgm
        let bgm: cc.AudioSource = this.node.getComponent(cc.AudioSource);
        bgm.stop();
        cc.resources.load("music/阿鲲 - 太空电梯", cc.AudioClip, (err, audioClip) => {
            if (err) cc.log(err);
            this.node.getComponent(cc.AudioSource).clip = <cc.AudioClip>audioClip;
            this.node.getComponent(cc.AudioSource).volume = 0.3;
            this.node.getComponent(cc.AudioSource).play();
            //循环播放
            this.node.getComponent(cc.AudioSource).loop = true;
        });
        //关闭碰撞检测
        let manager = cc.director.getCollisionManager();
        manager.enabled = false;
        //清屏
        this.clearscreen();
        //播放结束动画并切换场景
        this.endGame_1_movie();
    }
    //结束动画
    endGame_1_movie() {
        cc.tween(this.canvas).to(3, { opacity: 0 }, { easing: 'sineOut' }).call(() => { this.startGame_2_movie(); }).start();
        for (let i = 0; i < this.players.length; ++i)
            cc.tween(this.players[i].player).to(2, { position: cc.v3(this.canvas.width / 2 + this.players[i].player.width, this.players[i].player.y) }, { easing: 'sineOut' }).start();
    }
    //第二阶段游戏
    startGame_2_movie() {
        //去掉计时器，改为分数进度条
        let timeboard = cc.find("Canvas/ui/timeboard");
        timeboard.active = false;
        let scoreboard = cc.find("Canvas/ui/progressboard");
        scoreboard.active = true;
        //动画
        cc.tween(this.canvas).to(2, { opacity: 255 }, { easing: 'sineOut' }).start();
        for (let i = 0; i < this.players.length; ++i) {
            this.players[i].player.x = -this.canvas.width / 2 - this.players[i].player.width;
            cc.tween(this.players[i].player).to(1, { position: cc.v3(-this.canvas.width / 2 + this.players[i].player.width, this.players[i].player.y) }, { easing: 'sineOut' }).call(() => { if (i == 0) this.startGame_2(); }).start();
        }
    }
    startGame_2() {
        //背景加速
        let background = cc.find("Canvas/background");
        background.getComponent("background").speed = 300;
        //地球加速
        this.movespeed = 500;
        //展示第一阶段结果
        this.showscore_1();
        this.gameState = 2;

        //开启碰撞检测
        let manager = cc.director.getCollisionManager();
        manager.enabled = true;
    }
    endGame_2() {
        this.gameState = 0;
    }
    start_boss() {
        //停止生成元素
        this.unschedule(this.onCreating);
        //等待3s
        this.scheduleOnce(() => {
            //播放警告动画
            let warnning = cc.find("Canvas/warnning");
            let anima = warnning.getComponent(cc.Animation);
            warnning.active = true;
            anima.play("警告");
            //地球归位
            for (let i = 0; i < this.players.length; ++i)
                cc.tween(this.players[i].player).to(5, { position: cc.v3(-this.canvas.width / 2 + this.players[i].player.width, this.players[i].player.y / 2) }, { easing: 'sineOut' }).start();
            //bgm切换
            let bgm: cc.AudioSource = this.node.getComponent(cc.AudioSource);
            bgm.stop();
            cc.resources.load("music/阿鲲 - 失重打斗", cc.AudioClip, (err, audioClip) => {
                if (err) cc.log(err);
                this.node.getComponent(cc.AudioSource).clip = <cc.AudioClip>audioClip;
                this.node.getComponent(cc.AudioSource).volume = 0.3;
                this.node.getComponent(cc.AudioSource).play();
                //循环播放
                this.node.getComponent(cc.AudioSource).loop = true;
            });
            this.scheduleOnce(() => {
                //关闭警告动画
                anima.stop("警告");
                warnning.active = false;
                //boss入场
                let boss = cc.find("Canvas/boss");
                boss.active = true;
                cc.tween(boss).to(3, { position: cc.v3(300, 0, 0) }, { easing: 'sineOut' }).start();
                //血条动画
                let p = cc.find("Canvas/ui/progressboard");
                let process = p.children[0].children[0];
                process.color = cc.Color.GREEN;
                let bar = p.children[0].getComponent(cc.ProgressBar);
                bar.progress = 0;
                cc.tween(bar).to(1.5, { progress: 1 }, { easing: 'sineOut' }).start();
            }, 6);
        }, 5);
    }
    end_boss() {
        //游戏结束
        cc.log("end_boss");
        //结束动画
        cc.tween(this.canvas).to(5, { opacity: 0 }, { easing: 'sineOut' }).start();
        for (let i = 0; i < this.players.length; ++i)
            cc.tween(this.players[i].player).to(4, { position: cc.v3(this.canvas.width / 2 + this.players[i].player.width, this.players[i].player.y) }, { easing: 'sineOut' }).start();
        this.gameOver(true);
    }
    //元素生成系统
    onCreating() {
        if (this.gameState == 0) return;
        //10个位置，每个位置都可能生成单位
        for (let i: number = 0; i < 10; i++) {

            //1/3生成一个单位
            let generate = Math.floor(window["random"].seededRandom() * 10);
            if (generate != 0) continue;
            let generatenode: cc.Node = this.createFactor();
            let script = generatenode.getComponent("factor");
            //1/4生成零件
            let num = 4;
            if (this.gameState == 2)
                num = 5;//总可能数目
            let type = Math.floor(window["random"].seededRandom() * num);
            //type根据概率不同映射到1-9上表示不同的单位
            switch (type) {
                case 0:
                    type = 1;
                    script.speed = 200;
                    script.score = 5;
                    break;
                case 1: case 2: case 3:
                    type = 2;
                    script.speed = 200;
                    script.attack = 1;
                    script.heart = 20;
                    script.score = 2;
                    break;
                case 4:
                    type = 3;
                    script.speed = 150;
                    script.attack = 1;
                    script.heart = 15;
                    script.score = 3;
                    break;
            }
            //节点基本属性配置
            generatenode.zIndex = 3;
            let col = generatenode.getComponent(cc.CircleCollider);
            generatenode.scale = 0.1;
            //元素种类配置
            col.tag = type;
            //tag=0 表示地球，1-9表示factor，10-19表示bullet，20-29表示item,30-39表示f_bullet
            cc.resources.load("picture/factor_" + type, cc.SpriteFrame, (err, spriteFrame) => {
                if (err) cc.log(err);
                generatenode.getComponent(cc.Sprite).spriteFrame = <cc.SpriteFrame>spriteFrame;
            });
            cc.resources.load("music/factor_" + type, cc.AudioClip, (err, audioClip) => {
                if (err) cc.log(err);
                script.audio = <cc.AudioClip>audioClip;
            });
            generatenode.parent = cc.find("Canvas/factors");
            let w = this.canvas.width;
            let h = this.canvas.height;
            let unit = h / 10;
            generatenode.y = unit * i - h / 2 + unit / 2;
            generatenode.x = w / 2 + 100;
            //防止连续生成堵死
            i++;
        }
    }
    //对象池系统
    //factor对象池
    createFactor() {
        let node = this.factorPool.get();
        if (node == null)
            node = cc.instantiate(this.factorPrefab);
        return node;
    }
    destroyFactor(node: cc.Node) {
        this.factorPool.put(node);
    }
    //item对象池
    createItem() {
        let node = this.itemPool.get();
        if (node == null)
            node = cc.instantiate(this.itemPrefab);
        return node;
    }
    destroyItem(node: cc.Node) {
        this.itemPool.put(node);
    }
    //button对象池
    createBullet() {
        let node = this.bulletPool.get();
        if (node == null)
            node = cc.instantiate(this.bulletPrefab);
        return node;
    }
    destroyBullet(node: cc.Node) {
        this.bulletPool.put(node);
    }
    //f_button对象池
    createf_Bullet() {
        let node = this.f_bulletPool.get();
        if (node == null)
            node = cc.instantiate(this.f_bulletPrefab);
        return node;
    }
    destroyf_Bullet(node: cc.Node) {
        this.f_bulletPool.put(node);
    }
    //按钮响应
    //菜单
    menucontrol() {
        let menu = cc.find("Canvas/ui/menuboard");
        menu.active = this.menustate;
        let label = cc.find("Canvas/ui/menubutton/Background/Label");
        if (this.menustate) {
            //暂存时间
            this.time_sum = Date.now() - this.time_begin;
            label.getComponent(cc.Label).string = "继续";
        }
        else {
            //重新计时
            this.time_begin = Date.now();
            label.getComponent(cc.Label).string = "暂停";
        }
        this.menustate = !this.menustate;
    }
    //菜单联动
    onmenu(event) {
        if (event.playerId == window["playerId"]) {
            this.menucontrol();
        }
        else if (this.menustate) {
            //暂存时间
            this.time_sum = Date.now() - this.time_begin;
            this.inform_open("另一位玩家暂停了游戏");
            this.menustate = false;
        }
        else {
            //重新计时
            this.time_begin = Date.now();
            this.inform_close();
            this.menustate = true;
        }
        if(this.menustate)
            cc.director.resume()
        else
            cc.director.pause()
    }
    //暂停按钮
    onpause() {
        this.netScript.sendEvent("pause");
    }
    exit() {
        cc.game.end();
    }
    clearscreen() {
        //不知道为什么两次才能全删除
        let factors = cc.find("Canvas/factors");
        let items = cc.find("Canvas/items");
        let bullets = cc.find("Canvas/bullets");
        for (let i: number = 0; i < factors.childrenCount; i++) {
            factors.children[0].removeFromParent();
            this.destroyFactor(factors.children[0]);
        }
        for (let i: number = 0; i < factors.childrenCount; i++) {
            factors.children[0].removeFromParent();
            this.destroyFactor(factors.children[0]);
        }
        for (let i: number = 0; i < items.childrenCount; i++) {
            items.children[0].removeFromParent();
            this.destroyItem(items.children[0]);
        }
        for (let i: number = 0; i < items.childrenCount; i++) {
            items.children[0].removeFromParent();
            this.destroyItem(items.children[0]);
        }
        for (let i: number = 0; i < bullets.childrenCount; i++) {
            bullets.children[0].removeFromParent();
            this.destroyBullet(bullets.children[0]);
        }
        for (let i: number = 0; i < bullets.childrenCount; i++) {
            bullets.children[0].removeFromParent();
            this.destroyBullet(bullets.children[0]);
        }
    }
    //键盘响应
    keyDownEvent(event) {
        switch (event.keyCode) {
            case cc.macro.KEY.a:
                this.isLeft = true;
                break;
            case cc.macro.KEY.d:
                this.isRight = true;
                break;
            case cc.macro.KEY.w:
                this.isUp = true;
                break;
            case cc.macro.KEY.s:
                this.isDown = true;
                break;

        }
    }
    keyUpEvent(event) {
        switch (event.keyCode) {
            case cc.macro.KEY.a:
                this.isLeft = false;
                break;
            case cc.macro.KEY.d:
                this.isRight = false;
                break;
            case cc.macro.KEY.w:
                this.isUp = false;
                break;
            case cc.macro.KEY.s:
                this.isDown = false;
                break;
        }
    }
    playerMove(dt: number) {
        let earth = this.players[0].player;
        let x = earth.x, y = earth.y;
        let w: number = this.canvas.width / 2 - earth.width / 2;
        let h: number = this.canvas.height / 2 - earth.height / 2;
        if (this.isLeft) {
            x -= this.movespeed * dt;
        }
        if (this.isRight) {
            x += this.movespeed * dt;
        }
        if (this.isUp) {
            y += this.movespeed * dt;
        }
        if (this.isDown) {
            y -= this.movespeed * dt;
        }
        if (this.mode != 0) {
            if (x != earth.x || y != earth.y) {
                this.netScript.sendEvent("move", { x: x - earth.x, y: y - earth.y });
            }
        }
        else {
            if (x <= -w) {
                x = -w;
            }
            if (x >= w) {
                x = w;
            }
            if (y > h) {
                y = h;
            }
            if (y < -h) {
                y = -h;
            }
            earth.x = x;
            earth.y = y;
        }
    }
    showscore_1() {
        //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    }
}