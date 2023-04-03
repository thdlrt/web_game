// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html
const {ccclass, property} = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {
    //获取游戏主控
    game:cc.Node = null;
    game_script:cc.Component = null;
    start () {}
    onLoad(){
        this.game = cc.find("gamecontrol");
        this.game_script= this.game.getComponent("game");
    }
    
    onCollisionEnter (other : cc.Collider, self : cc.Collider) {
        //获取种类
        let type = other.node.getComponent(cc.CircleCollider).tag;
        switch (type) {
        case 0:
            this.game_script.score += 1;
            break;
        case 1:
            if(this.game_script.score > 0)
                this.game_script.score -= 1;
            break; 
        default:
            break;   
        }
        cc.log(this.game_script.score);
   }
   

}
