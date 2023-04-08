// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class Game extends cc.Component {
    // 元素 Prefab
    @property(cc.Prefab)
    factorPrefab : cc.Prefab = null;
    @property(cc.Prefab)
    bulletPrefab : cc.Prefab = null;
    @property(cc.Prefab)
    itemPrefab : cc.Prefab = null;
    // 元素对象池
    factorPool : cc.NodePool = new cc.NodePool();
    bulletPool : cc.NodePool = new cc.NodePool();
    itemPool : cc.NodePool = new cc.NodePool();
    // Canvas节点
    canvas : cc.Node = null;
    static  inst : Game = null;
    //游戏状态(阶段)
    gameState: number = 0;
    //游戏分数（零件收集数目）
    score: number = 0;
    //第一阶段时间
    @property
    time_1 : number = 30;
    //地球生命值
    @property
    heart : number = 5;

    menustate : boolean = false;
    onLoad () {
        //显示层级控制（背景0，元素1-9，ui10）
        cc.find('Canvas/ui').zIndex = 10;
        cc.find('Canvas/background').zIndex = 0;
        cc.find('Canvas/earth').zIndex = 5;

        Game.inst = this;
        this.canvas = cc.find('Canvas');

        //开启碰撞检测
        let manager = cc.director.getCollisionManager();
        manager.enabled = true;
        //元素生成
        this.schedule(this.onCreating, 2, cc.macro.REPEAT_FOREVER , 1);
        //隐藏菜单
        this.menucontrol();
    }
    update(dt){
        //更新得分板
        let score = cc.find("Canvas/ui/scoreboard");
        let label = score.children[0];
        label.getComponent(cc.Label).string = this.score + '';
        //更新生命值
        let heart = score.children[2];
        heart.getComponent(cc.Label).string = this.heart + '';
        if(this.heart <= 0){
            this.gameOver();
        }
    }
    startGame_1 () {
        this.gameState = 1;
        cc.log("startGame_1");
        //音频会自动播放
        //开启计时器
        this.schedule(function(){
            let timeboard = cc.find("Canvas/ui/timeboard");
            let label = timeboard.children[0];
            label.getComponent(cc.Label).string = this.time_1 + '';
            this.time_1 -= 1;
            if(this.time_1 < 0){
                this.unschedule(this.time_1);
                this.endGame_1();
            }
        }, 1,this.time_1);  
    }
    //游戏失败
    gameOver(){
        this.gameState = 0;
        cc.log("gameOver");
        //停止播放bgm
        let bgm : cc.AudioSource = this.node.getComponent(cc.AudioSource);
        bgm.stop();
        //关闭碰撞检测
        let manager = cc.director.getCollisionManager();
        manager.enabled = false;
        //添加死亡动画（待补充）
        //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
        //切换选择场景
        cc.director.loadScene('gameover');
    }
    endGame_1 () {
        this.gameState = 0;
        cc.log("endGame_1");
        //停止播放bgm
        let bgm : cc.AudioSource = this.node.getComponent(cc.AudioSource);
        bgm.stop();
        //关闭碰撞检测
        let manager = cc.director.getCollisionManager();
        manager.enabled = false;
        //清屏
        this.clearscreen();
        //播放结束动画并切换场景
        this.endGame_1_movie();
    }
    //结束动画
    endGame_1_movie()
    {
        let earth = cc.find("Canvas/earth");
        cc.tween(this.canvas).to(3,{opacity:0},{easing:'sineOut'}).call(()=>{this.startGame_2_movie();}).start();
        cc.tween(earth).to(2,{position:cc.v3(this.canvas.width/2+earth.width,earth.y)},{easing:'sineOut'}).start();
    }
    //元素生成系统
    onCreating(){
        if(this.gameState == 0)return;
        //10个位置，每个位置都可能生成两种单位
        for(let i:number=0;i<10;i++)
        {

            //1/3生成一个单位
            let generate = Math.floor(Math.random()*3);
            //1/4生成零件
            let type = Math.floor(Math.random()*4);
            //type根据概率不同映射到1-9上表示不同的单位
            type = type == 0 ? 1 : 2;
            if(generate != 0)continue;
            let generatenode:cc.Node = this.createFactor();
            let script = generatenode.getComponent("factor");
            //节点基本属性配置
            generatenode.zIndex = 3;
            let col = generatenode.getComponent(cc.CircleCollider);
            generatenode.scale = 0.1;
            //元素种类配置
            col.tag = type;
            //tag=0 表示地球，1-9表示factor，10-19表示bullet，20-29表示item
            cc.resources.load("picture/factor_"+type, cc.SpriteFrame, (err, spriteFrame) => {
                if(err)cc.log(err);
                generatenode.getComponent(cc.Sprite).spriteFrame = <cc.SpriteFrame>spriteFrame;
            });
            cc.resources.load("music/factor_"+type, cc.AudioClip, (err, audioClip) => {
                if(err)cc.log(err);
                script.audio = <cc.AudioClip>audioClip;
            });
            generatenode.parent = cc.find("Canvas/factors");
            let w = this.canvas.width;
            let h = this.canvas.height;
            let unit = h/10;
            generatenode.y = unit * i - h/2 + unit/2;
            generatenode.x = w / 2 + generatenode.width/2;
            //防止连续生成堵死
            i++;
        }
    }
    //对象池系统
    //factor对象池
    createFactor(){
        let node = this.factorPool.get();
        if(node == null)
            node = cc.instantiate(this.factorPrefab);
        return node;
    }
    destroyFactor( node : cc.Node){
        this.factorPool.put( node );
    }
    //item对象池
    createItem(){
        let node = this.itemPool.get();
        if(node == null)
            node = cc.instantiate(this.itemPrefab);
        return node;
    }
    destroyItem( node : cc.Node){
        this.itemPool.put( node );
    }
    //button对象池
    createBullet(){
        let node = this.bulletPool.get();
        if(node == null)
            node = cc.instantiate(this.bulletPrefab);
        return node;
    }
    destroyBullet( node : cc.Node){
        this.bulletPool.put( node );
    }
    //按钮响应
    //菜单
    menucontrol(){
        let menu = cc.find("Canvas/ui/menuboard");
        menu.active = this.menustate;
        let label = cc.find("Canvas/ui/menubutton/Background/Label");
        if(this.menustate){
            cc.director.pause();
            label.getComponent(cc.Label).string = "继续";
        }
        else{
            cc.director.resume();
            label.getComponent(cc.Label).string = "暂停";
        }
        this.menustate = !this.menustate;
    }
    exit(){
        cc.game.end();
    }
    clearscreen(){
        //不知道为什么两次才能全删除
        let factors = cc.find("Canvas/factors");
        let items = cc.find("Canvas/items");
        let bullets = cc.find("Canvas/bullets");
        for(let i:number=0;i<factors.childrenCount;i++){ 
            factors.children[0].removeFromParent();   
            this.destroyFactor(factors.children[0]);
        }
        for(let i:number=0;i<factors.childrenCount;i++){ 
            factors.children[0].removeFromParent();   
            this.destroyFactor(factors.children[0]);
        }
        for(let i:number=0;i<items.childrenCount;i++){
            items.children[0].removeFromParent();
            this.destroyItem(items.children[0]);
        }
        for(let i:number=0;i<items.childrenCount;i++){
            items.children[0].removeFromParent();
            this.destroyItem(items.children[0]);
        }
        for(let i:number=0;i<bullets.childrenCount;i++){
            bullets.children[0].removeFromParent();
            this.destroyBullet(bullets.children[0]);
        }
        for(let i:number=0;i<bullets.childrenCount;i++){
            bullets.children[0].removeFromParent();
            this.destroyBullet(bullets.children[0]);
        }
    }
    //第二阶段游戏
    startGame_2_movie(){
        let earth = cc.find("Canvas/earth");
        cc.tween(this.canvas).to(2,{opacity:255},{easing:'sineOut'}).start();
        earth.x = -this.canvas.width/2-earth.width;
        cc.tween(earth).to(1,{position:cc.v3(-this.canvas.width/2+earth.width,earth.y)},{easing:'sineOut'}).call(()=>{this.startGame_2()}).start();
    }
    startGame_2(){
        //背景加速
        let background = cc.find("Canvas/background");
        background.getComponent("background").speed = 300;
        //地球加速
        let earth = cc.find("Canvas/earth");
        earth.getComponent("movecontrol").speed = 500;
        //展示第一阶段结果
        this.showscore_1();
        this.gameState = 2;
        //播放bgm
        cc.resources.load("music/阿鲲 - 太空电梯", cc.AudioClip, (err, audioClip) => {
            if(err)cc.log(err);
            this.node.getComponent(cc.AudioSource).clip = <cc.AudioClip>audioClip;
            this.node.getComponent(cc.AudioSource).volume = 0.3;
            this.node.getComponent(cc.AudioSource).play();
        });
        //开启碰撞检测
        let manager = cc.director.getCollisionManager();
        manager.enabled = true;
    }
    endGame_2(){
        this.gameState = 0;
    }
    showscore_1(){
        //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    }
}