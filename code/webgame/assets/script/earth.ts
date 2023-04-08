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
    //获取游戏主控
    game:cc.Node = null;
    game_script:cc.Component = null;
    start () {}
    onLoad(){
        this.game = cc.find("gamecontrol");
        this.game_script= this.game.getComponent("game");
        //发射子弹
        this.schedule(this.onshoot, this.game_script.speed, cc.macro.REPEAT_FOREVER, 0.01);
    }
    
    onCollisionEnter (other : cc.Collider, self : cc.Collider) {
        //获取种类
        let type = other.node.getComponent(cc.CircleCollider).tag;
        switch (type) {
            //收集装备
        case 1:
            this.game_script.score += 1;
            break;
            //和敌机发生碰撞
        case 2:case 3:
            this.game_script.heart -= 1;
            break;    
        //道具收集
        case 21:
            //回血
            this.game_script.heart += 2;
            break;
        case 22:
            //发射3个跟踪导弹
            //选择打击目标
            let num:number = 3;
            let factors = cc.find("Canvas/factors");
            let size:number = factors.childrenCount;
            let targets:cc.Node[] = [];
            for(let i = 0;i<size;i++)
            {
                if(factors.children[i].getComponent(cc.CircleCollider).tag!=1)
                {
                    targets.push(factors.children[i]);
                }
            }
            //根据距离earth的距离排序
            targets.sort((a,b)=>{
                let a_x = a.x;
                let b_x = b.x;
                let a_y = a.y;
                let b_y = b.y;
                let a_dis = Math.sqrt(Math.pow(a_x-this.node.x,2)+Math.pow(a_y-this.node.y,2));
                let b_dis = Math.sqrt(Math.pow(b_x-this.node.x,2)+Math.pow(b_y-this.node.y,2));
                return a_dis-b_dis;
            });
            //选择目标
            let i=0;
            this.schedule(()=>
            {
                let bullet = Game.inst.createBullet();
                bullet.getComponent("bullet").attack = 20;
                bullet.getComponent("bullet").type=2;
                if(i<targets.length)
                    bullet.getComponent("bullet").target = targets[i];
                else
                    bullet.getComponent("bullet").target =  null;
                bullet.setPosition(this.node.x+this.node.width/2,this.node.y-20);
                //不同子弹设置
                bullet.getComponent(cc.CircleCollider).tag=12;
                //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
                let bullets=cc.find("Canvas/bullets");
                bullets.addChild(bullet);
                i += 1;
            },0.2,num,0.2);
            break;
        case 23:
            //炸弹二向箔
            break;
        //受到攻击
        case 31:
            this.game_script.heart -= other.node.getComponent("f_bullet").attack;
            break;
        default:
            cc.log("为未知碰撞")
            break;
        }
   }
   onshoot(){
        if(this.game_script.gameState == 2)
        {
            let bullet = Game.inst.createBullet();
            bullet.getComponent("bullet").attack = this.game_script.attack;
            bullet.getComponent("bullet").type=1;
            bullet.setPosition(this.node.x+this.node.width/2,this.node.y);
            //不同子弹设置
            bullet.getComponent(cc.CircleCollider).tag=11;
            //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
            let bullets=cc.find("Canvas/bullets");
            bullets.addChild(bullet);
        }
   }

}
