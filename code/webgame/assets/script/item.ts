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

    //音效
    @property(cc.AudioClip)
    audio : cc.AudioClip = null;
    //速度
    @property
    speed : number = 0;

    private canvas : cc.Node = null;

    onLoad () {}
    start () {}
    update (dt) {

    }
    onEnable(){
        //初始化
        this.canvas = cc.find('Canvas');
        this.node.active = true;
    }
    //碰撞检测
    onCollisionEnter (other : cc.Collider, self : cc.Collider) {
        cc.log("碰撞检测");
        this.dismiss();
    }
    dismiss(){
        Game.inst.destroyItem( this.node );

    }
}
