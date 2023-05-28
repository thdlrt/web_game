// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;

    @property
    text: string = 'hello';
    onLoad () {
        let label = cc.find("Canvas/title").getComponent(cc.Label);
        if(window["complete"]){
            label.string = "游戏胜利";
            cc.find("Canvas/title").color = cc.color(255,255,0);
        }
        else{
            label.string = "游戏失败";
            cc.find("Canvas/title").color = cc.color(255,0,0);
        }
        cc.find("Canvas/board/mask").getComponent(cc.Label).string = String(window["mask"]);
        let totalSeconds = window['time_sum']/1000;
        let minutes = totalSeconds / 60; // 计算分钟数
        let seconds = totalSeconds % 60; // 计算剩余的秒数  
        cc.find("Canvas/board/time").getComponent(cc.Label).string = String(minutes.toFixed(0))+":"+String(seconds.toFixed(0));
        cc.find("Canvas/board/playerId").getComponent(cc.Label).string = String(window["playerId"]);
    }
    exit(){

    }
}
