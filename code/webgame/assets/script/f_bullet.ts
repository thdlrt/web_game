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

    speed:number = 350;
    attack:number = 1;
    type:number = 1;
    audio:cc.AudioClip = null;
    canvas : cc.Node = null;
    //方向向量
    dir : cc.Vec2;

    onEnable(){
        //初始化
        //this.dir = cc.v2(-1,0);//默认方向
        // //射击音效
        // cc.resources.load("music/f_bullet_"+this.type, cc.AudioClip, (err, audioClip) => {
        //     if(err)cc.log(err);
        //     this.audio = <cc.AudioClip>audioClip;
        // });
        //加载贴图
        cc.resources.load("picture/f_bullet_"+this.type, cc.SpriteFrame, (err, spriteFrame) => {
            if(err)cc.log(err);
            this.getComponent(cc.Sprite).spriteFrame = <cc.SpriteFrame>spriteFrame;
        });
        //cc.audioEngine.play(this.audio, false, 0.1);
        this.node.zIndex = 1;
        this.canvas = cc.find('Canvas');
    }
    update (dt) {
        if(this.type==1)
        {
            //按照方向移动
            this.node.x += this.dir.x * this.speed * dt;
            this.node.y += this.dir.y * this.speed * dt;          
            if(this.node.x < -this.canvas.width/2||this.node.x > this.canvas.width/2||this.node.y < -this.canvas.height/2||this.node.y > this.canvas.height/2){
                this.dismiss();
            }
        }
    }
    dismiss(){
        Game.inst.destroyf_Bullet( this.node );
    }
    onCollisionEnter (other : cc.Collider, self : cc.Collider) {
        this.dismiss();
    }
}
