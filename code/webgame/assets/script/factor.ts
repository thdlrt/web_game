// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html
import Game from "./game";
const {ccclass, property} = cc._decorator;

@ccclass
export default class factor extends cc.Component {
    //音效
    @property(cc.AudioClip)
    audio : cc.AudioClip = null;
    //速度
    speed : number = 200;
    //生命值
    heart : number = 20;
    //分值
    score : number = 1;
    //种类使用Tag属性
    attack:number = 1;
    //特殊状态
    state:number = 0;//0正常，1定住
    //effect
    lightning:cc.Node = null;
    //是否绑定事件
    isBind:boolean = false;
    private canvas : cc.Node = null;
    onLoad () {}
    start () {}
    //初始化
    onEnable(){
        this.unscheduleAllCallbacks();
        this.node.scale = 1;
        //大小初始化
        switch(this.getComponent(cc.CircleCollider).tag){
            case 1:
                this.node.width = 39;
                this.node.height = 66;
                break;
            case 2:
                this.node.width = 70;
                this.node.height = 70;
                break;
            case 3:
                this.node.width = 95;
                this.node.height = 60;
                break;
        }
        //开启碰撞检测
        this.getComponent(cc.CircleCollider).enabled = true;
        this.node.opacity = 255;
        if(!this.isBind){
            window["onfire"].on("onupdate", this.onupdate.bind(this));
            this.isBind = true;
        }
        this.canvas = cc.find('Canvas');
        //对基础单位提速
        if(Game.inst.gameState == 2&&this.speed==200)
        {
           this.speed = 300;
        }
        //特殊单位的属性
        if(this.getComponent(cc.CircleCollider).tag==2)
            this.speed *= 1.5;
        if(this.getComponent(cc.CircleCollider).tag==3)
        {
            //射击功能
            this.schedule(this.onshoot, 1.5, cc.macro.REPEAT_FOREVER, 0.01);
        }
    }
    onupdate (dt) {
        if(this.state==1)return;
        let step = this.speed *dt;
        this.node.x -= step;
        if(this.node.x < - this.canvas.width/2 - 100 )
        {
            this.dismiss();
        }
    }
    dismiss(){
        this.unscheduleAllCallbacks();
        //不是超出边界就消失，则播放音效
        //关闭所有计时器
        this.unscheduleAllCallbacks();
        if(this.node.getComponent(cc.CircleCollider).tag == 1){
            Game.inst.destroyFactor( this.node );
            return;
        }

        if(this.node.x > - this.canvas.width/2)
        {
            //获得分数
            cc.find("gamecontrol").getComponent("game").mask+=this.score;
            console.log(this.node.getComponent(cc.CircleCollider).tag)
            if(this.node.getComponent(cc.CircleCollider).tag != 1){
                this.speed = 0;
                if(this.getComponent(cc.CircleCollider).tag == 2)
                    this.node.getComponent(cc.Animation).play("bomb2")
                else
                    this.node.getComponent(cc.Animation).play("bomb3")
                if(Game.inst.gameState > 1){
                    console.log("createitem")
                    this.createitem();
                }
            }
        }
        //等待动画播放完毕
        this.scheduleOnce(()=> {
            Game.inst.destroyFactor( this.node );
        },0.8);
    }
    //碰撞检测
    onCollisionEnter (other : cc.Collider, self : cc.Collider) {
        if(other.tag == 0)//和地球碰撞
        {
            cc.audioEngine.play(this.audio, false, 0.4);
            this.getComponent(cc.CircleCollider).enabled = false;
            this.dismiss();
        }
        else if(other.tag>=10&&other.tag<20&&self.tag!=1)//和子弹碰撞
        {
            //球形闪电
            if(other.tag==13)
            {
                //瘫痪动画
                this.lightning = cc.instantiate(cc.find('effect/lightning'));
                this.lightning.parent = cc.find('effect');
                this.lightning.x = this.node.x;
                this.lightning.y = this.node.y;
                this.lightning.active = true;
                //定住5s,不移动、不射击
                this.state = 1;
                this.scheduleOnce(()=> {
                    this.state=0;
                    this.lightning = null;
                },5);
                return;
            }
            this.heart-=other.node.getComponent("bullet").attack;
            if(this.heart<=0)
            {
                cc.audioEngine.play(this.audio, false, 0.2);
                this.getComponent(cc.CircleCollider).enabled = false;
                this.dismiss();
            }
        }
    }
    createitem()
    {
        //三种道具（回血0、导弹1、炸弹2），升级用的moss仍然随机出现，只是更少
        //1/3生成一个单位（暂时100）
        //》》》》》》》》》》》》》》》》》
        let generate = Math.floor(window["random"].seededRandom()*6);
        if(generate != 0)return;
        //基本信息初始化
        let generatenode = Game.inst.createItem();
        generatenode.parent = cc.find("Canvas/items");
        let type = Math.floor(window["random"].seededRandom()*3);
        generatenode.zIndex = 3;
        let col = generatenode.getComponent(cc.CircleCollider);

        if(type==0)
            type=1;
        else if(type==1)
            type=2;
        else if(type==2)
            type=3;
        //元素种类配置
        col.tag = type+20;
        cc.resources.load("picture/item_"+type, cc.SpriteFrame, (err, spriteFrame) => {
            if(err)cc.log(err);
            generatenode.getComponent(cc.Sprite).spriteFrame = <cc.SpriteFrame>spriteFrame;
        });
        generatenode.setPosition(this.node.getPosition());
    }
    onshoot()
    {
        if(this.state==1)return;
        let bullet = Game.inst.createf_Bullet();
        bullet.getComponent("f_bullet").attack = this.attack;
        bullet.getComponent("f_bullet").type=1;
        bullet.getComponent("f_bullet").speed=500;
        bullet.setPosition(this.node.x-60,this.node.y);
        bullet.getComponent("f_bullet").dir=cc.v2(-1,0);
        bullet.getComponent(cc.CircleCollider).tag=31;
        let bullets=cc.find("Canvas/bullets");
        bullets.addChild(bullet);
    }
}
