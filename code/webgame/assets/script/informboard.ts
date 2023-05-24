// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    onLoad() {
        //显示在最前面
        this.node.zIndex = 1000;
    }

    onEnable () {
        this.node.on(cc.Node.EventType.TOUCH_START,this.ontouch,this);
        cc.director.pause();
    }

    onDisable() {
        this.node.off(cc.Node.EventType.TOUCH_START,this.ontouch,this);
        cc.director.resume();
    }
    ontouch(event){
        event.stopPropagation();
    }
}
