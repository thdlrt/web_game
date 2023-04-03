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
    @property
    speed : number = 200;
    //生命值
    @property
    heart : number = 1;
    //分值
    @property
    score : number = 1;
    //种类使用Tag属性
    private canvas : cc.Node = null;
    onLoad () {}
    start () {}
    //初始化
    onEnable(){
        this.canvas = cc.find('Canvas');
    }
    update (dt) {
        let step = this.speed *dt;
        this.node.x -= step;
        if(this.node.x < - this.canvas.width/2 - this.node.width )
        {
            this.dismiss();
        }
    }
    dismiss(){
        Game.inst.destroyFactor( this.node );

    }
    //碰撞检测
    onCollisionEnter (other : cc.Collider, self : cc.Collider) {
        this.dismiss();
        cc.audioEngine.play(this.audio, false, 1);
    }
}
