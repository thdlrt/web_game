// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    // LIFE-CYCLE CALLBACKS:
    game:cc.Node = null;
    script = null;
    onLoad () {
        cc.log("begin");
        this.node.zIndex = 100;
        this.game = cc.find("gamecontrol");
        this.script = this.game.getComponent("game");
        this.node.on(cc.Node.EventType.TOUCH_START,this.ontouch,this);
    }

    start () {

    }

    ontouch(){
        this.node.active = false;
        this.script.startGame_1 ();
    }
}
