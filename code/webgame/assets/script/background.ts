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

    @property
    speed:number = 200;

    bg1 : cc.Node = null;
    bg2 : cc.Node = null;

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.bg1 = cc.find("bg1", this.node);
        this.bg2 = cc.find("bg2", this.node);
        window["onfire"].on("onupdate", this.onupdate.bind(this));
    }

    start () {

    }

    onupdate (dt) {
        if(Game.inst.gameState == 0)return;
        let w:number = Game.inst.canvas.width;
        this.bg1.x -= this.speed*dt;
        this.bg2.x -= this.speed*dt;
        if(this.bg1.x <= -w/2)
        {
            this.bg1.x = 3*w/2;
        }
        if(this.bg2.x <= -w/2)
        {
            this.bg2.x = 3*w/2;
        }
    }
}
