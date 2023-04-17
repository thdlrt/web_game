// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    //基本属性
    heart_s : number = 1000;//总生命值
    heart : number = this.heart_s;//当前生命值
    //阶段
    stage : number = 1;
    onEnable () {

    }

    update (dt) {

    }
    onCollisionEnter (other : cc.Collider, self : cc.Collider) {
        let p = cc.find("Canvas/ui/progressboard");
        let process = p.children[0].children[0];
        if(other.tag>=10&&other.tag<20)
        {
            this.heart-=other.node.getComponent("bullet").attack;
            //生命值判断（阶段调整)三阶段0.8-1;0.4-0.8;0-0.4
            if(this.heart<=this.heart_s*0.8&&this.stage==1)
            {
                process.color = cc.Color.YELLOW;
                this.stage=2;
            }
            else if(this.heart<=this.heart_s*0.4&&this.stage==2)
            {
                process.color = cc.Color.RED;
                this.stage=3;
            }
            else if(this.heart<=0)
            {
                this.dismiss();
            }
        }
    }
    dismiss() {
        this.node.destroy();
        let game = cc.find("gamecontrol");
        let game_script= game.getComponent("game");
        //加分
        game_script.mask+=100;
        //设置游戏状态
        game_script.gameState=4;
    }
}
