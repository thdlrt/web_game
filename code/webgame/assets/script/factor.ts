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
    private canvas : cc.Node = null;
    onLoad () {}
    start () {}
    //初始化
    onEnable(){
        this.canvas = cc.find('Canvas');
        //对基础单位提速
        if(Game.inst.gameState == 2&&this.speed==200)
        {
           this.speed = 300;
        }
        //特殊单位的属性
        if(this.getComponent(cc.CircleCollider).tag==3)
        {
            //射击功能
            this.schedule(this.onshoot, 1.5, cc.macro.REPEAT_FOREVER, 0.01);
        }
    }
    update (dt) {
        if(this.state==1)return;
        let step = this.speed *dt;
        this.node.x -= step;
        if(this.node.x < - this.canvas.width/2 - 100 )
        {
            this.dismiss();
        }
    }
    dismiss(){
        //不是超出边界就消失，则播放音效
        //关闭所有计时器
        this.unscheduleAllCallbacks();
        if(Game.inst.gameState > 1 &&this.node.x > - this.canvas.width/2)
        {
            //获得分数
            cc.find("gamecontrol").getComponent("game").mask+=this.score;

            if(this.node.getComponent(cc.CircleCollider).tag != 1)
                this.createitem();
        }
        Game.inst.destroyFactor( this.node );
    }
    //碰撞检测
    onCollisionEnter (other : cc.Collider, self : cc.Collider) {
        if(other.tag == 0)//和地球碰撞
        {
            cc.audioEngine.play(this.audio, false, 0.4);
            this.dismiss();
        }
        else if(other.tag>=10&&other.tag<20&&self.tag!=1)//和子弹碰撞
        {
            //球形闪电
            if(other.tag==13)
            {
                //定住5s,不移动、不射击
                //瘫痪动画>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
                this.state = 1;
                this.scheduleOnce(()=> {
                    this.state=0;
                },5);
                return;
            }
            this.heart-=other.node.getComponent("bullet").attack;
            if(this.heart<=0)
            {
                cc.audioEngine.play(this.audio, false, 0.4);
                this.dismiss();
            }
        }
    }
    createitem()
    {
        //三种道具（回血0、导弹1、炸弹2），升级用的moss仍然随机出现，只是更少
        //1/3生成一个单位（暂时100）
        //》》》》》》》》》》》》》》》》》
        let generate = Math.floor(Math.random()*3);
        if(generate != 0)return;
        //基本信息初始化
        let generatenode = Game.inst.createItem();
        generatenode.parent = cc.find("Canvas/items");
        let type = Math.floor(Math.random()*3);
        generatenode.zIndex = 4;
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
        bullet.getComponent(cc.CircleCollider).tag=31;
        let bullets=cc.find("Canvas/bullets");
        bullets.addChild(bullet);
    }
}
