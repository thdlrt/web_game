// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html
import Game from "./game";
const {ccclass, property} = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {


    speed:number = 200;

    attack:number = 5;

    type:number = 1;

    audio:cc.AudioClip = null;

    canvas : cc.Node = null;
    //特殊子弹属性
    //打击目标
    target:cc.Node = null;
    //方向
    dir:cc.Vec2 = cc.v2(1,0);
    //产生时间
    startTime:number = 0;
    onEnable () {
        //属性初始化
        this.getComponent(cc.CircleCollider).radius=18;
        this.startTime = performance.now();
        this.node.angle = 0;
        this.dir=cc.v2(1,0);
        this.node.width = 60;
        this.node.height = 15;
        if(this.type==1||this.type==4)
            this.speed=400;
        //射击音效
        cc.resources.load("music/bullet_"+this.type, cc.AudioClip, (err, audioClip) => {
            //if(err)cc.log(err);
            this.audio = <cc.AudioClip>audioClip;
        });
        //加载贴图
        cc.resources.load("picture/bullet_"+this.type, cc.SpriteFrame, (err, spriteFrame) => {
            if(err)cc.log(err);
            this.getComponent(cc.Sprite).spriteFrame = <cc.SpriteFrame>spriteFrame;
        });
        //太吵了，也许只有特殊子弹配音效比较好
        //cc.audioEngine.play(this.audio, false, 0.1);
        this.node.zIndex = 1;
        this.canvas = cc.find('Canvas');
        //球形闪电，飞到指定位置使得敌人瘫痪
        if(this.type==3)
        {
            this.node.width = 100;
            this.node.height = 100
            this.node.getComponent(cc.CircleCollider).radius=0;
            //移动到指定位置
            cc.tween(this.node).to(0.5,{position:cc.v3(this.canvas.width/2-2*this.node.width,0)},{easing:'sineOut'}).
            call(()=>{
                //瘫痪敌人
                //作用半径
                let r:number = 400;
                cc.tween(this.node).to(0.5,{width:r,height:r},{easing:'sineOut'}).call(this.dismiss).start();
                cc.tween(this.node.getComponent(cc.CircleCollider)).to(0.4,{radius:r},{easing:'sineOut'}).start();
                cc.tween(this.node).to(0.4,{opacity:0},{easing:'sineOut'}).start();
            }).start();
        }
    }

    start () {
        
    }

    update (dt) {
        if(this.type==1||this.type==4)
        {
            this.node.x += this.speed*dt;           
            if(this.node.x > this.canvas.width/2){
                this.dismiss();
            }
        }
        //跟踪导弹
        else if(this.type==2)
        {   
            if(this.target!=null&&cc.isValid(this.target))
            {
                this.dir.x=this.target.x-this.node.x;
                this.dir.y=this.target.y-this.node.y;
                this.dir.normalizeSelf();
            }
            this.node.rotation=cc.misc.radiansToDegrees(Math.atan2(this.dir.x, this.dir.y))-90;
            this.node.x += this.dir.x*800*dt;
            this.node.y += this.dir.y*800*dt;
            if(performance.now()-this.startTime>3000||this.node.x > this.canvas.width/2||this.node.x < -this.canvas.width/2||this.node.y > this.canvas.height/2||this.node.y < -this.canvas.height/2){
                this.dismiss();
            }
        }
    }
    dismiss(){

        Game.inst.destroyBullet( this.node );
    }
    onCollisionEnter (other : cc.Collider, self : cc.Collider) {
        if(other.node.getComponent(cc.CircleCollider).tag != 1)
        {
            if(this.type==3||this.type==4)
            {
                //不需要消失，让factor知道就行
                return;
            }
            else
                this.dismiss();
        }
    }
}
