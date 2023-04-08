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

    onEnable () {
        //属性初始化
        this.node.angle = 0;
        this.dir=cc.v2(1,0);
        if(this.type==1)
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
        cc.audioEngine.play(this.audio, false, 0.1);
        this.node.zIndex = 1;
        this.canvas = cc.find('Canvas');
    }

    start () {
        
    }

    update (dt) {
        if(this.type==1)
        {
            this.node.x += this.speed*dt;           
            if(this.node.x > this.canvas.width/2){
                this.dismiss();
            }
        }
        //跟踪导弹
        else if(this.type==2)
        {   
            if(this.target!=null)
            {
                this.dir.x=this.target.x-this.node.x;
                this.dir.y=this.target.y-this.node.y;
                this.dir.normalizeSelf();
            }
            else
            {
                this.dir.x=1;
                this.dir.y=0;
            }
            this.node.rotation=cc.misc.radiansToDegrees(Math.atan2(this.dir.x, this.dir.y))-90;
            this.node.x += this.dir.x*800*dt;
            this.node.y += this.dir.y*800*dt;
            if(this.node.x > this.canvas.width/2||this.node.x < -this.canvas.width/2||this.node.y > this.canvas.height/2||this.node.y < -this.canvas.height/2){
                this.dismiss();
            }
        }
    }
    dismiss(){

        Game.inst.destroyBullet( this.node );
    }
    onCollisionEnter (other : cc.Collider, self : cc.Collider) {
        if(other.node.getComponent(cc.CircleCollider).tag != 1)
            this.dismiss();
    }
}
