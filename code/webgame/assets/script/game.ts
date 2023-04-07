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

    // 元素对象池
    factorPool : cc.NodePool = new cc.NodePool();
    
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
    }
    update(dt){
        //更新得分板
        let score = cc.find("Canvas/ui/scoreboard");
        let label = score.children[0];
        label.getComponent(cc.Label).string = this.score + '';
        //更新生命值
        let heart = score.children[2];
        heart.getComponent(cc.Label).string = this.heart + '';
        if(this.heart == 0){
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
            if(this.time_1 == 0){
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
        //播放结束动画并切换场景
        this.endGame_1_movie();
    }
    //结束动画
    endGame_1_movie()
    {
        let earth = cc.find("Canvas/earth");
        let t=cc.tween(this.canvas).to(3,{opacity:0},{easing:'sineOut'}).call(function(){
            cc.director.loadScene('secondscene_one');
        }).start();
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
            type = type == 0 ? 0 : 1;
            if(generate != 0)continue;
            let generatenode:cc.Node = this.createFactor();
            let script = generatenode.getComponent("factor");
            //节点基本属性配置
            generatenode.zIndex = 3;
            let col = generatenode.getComponent(cc.CircleCollider);
            generatenode.scale = 0.1;
            //元素种类配置
            col.tag = type;
            cc.resources.load("picture/factor_"+type, cc.SpriteFrame, (err, spriteFrame) => {
                if(err)cc.log(err);
                generatenode.getComponent(cc.Sprite).spriteFrame = <cc.SpriteFrame>spriteFrame;
            });
            cc.resources.load("music/factor_"+type, cc.AudioClip, (err, audioClip) => {
                if(err)cc.log(err);
                script.audio = <cc.AudioClip>audioClip;
            });
            generatenode.parent = this.canvas;
            let w = this.canvas.width;
            let h = this.canvas.height;
            let unit = h/10;
            generatenode.y = unit * i - h/2 + unit/2;
            generatenode.x = w / 2 + generatenode.width/2;
        }
    }
    //对象池系统
    createFactor(){
        let node = this.factorPool.get();
        if(node == null)
            node = cc.instantiate(this.factorPrefab);
        return node;
    }
    destroyFactor( node : cc.Node){
        this.factorPool.put( node );
    }

}