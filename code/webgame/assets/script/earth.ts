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
    //在players中的编号
    id:number;
    //获取游戏主控
    game:cc.Node = null;
    game_script:cc.Component = null;
    //导弹发射间隔(用于计数)
    dis:number=0;
    start () {}
    onLoad(){
        //window["onfire"].on("onupdate", this.onupdate.bind(this));
        this.game = cc.find("gamecontrol");
        this.game_script= this.game.getComponent("game");
        //发射子弹
        this.schedule(this.onshoot, this.game_script.players[this.id].speed, cc.macro.REPEAT_FOREVER, 0.01);
    }
    
    onCollisionEnter (other : cc.Collider, self : cc.Collider) {
        //获取种类
        let type = other.node.getComponent(cc.CircleCollider).tag;
        switch (type) {
            //收集装备
        case 1:
            this.game_script.players[this.id].score += 1;
            break;
            //和敌机发生碰撞
        case 2:case 3:
            this.game_script.players[this.id].heart -= 3;
            //闪烁动画
            this.getComponent(cc.Animation).play('道具消失');
            this.scheduleOnce(()=> {
                this.getComponent(cc.Animation).stop('道具消失');
                this.node.opacity = 255;
            }, 2);
            break;    
        case 9:
            //和boss碰撞，立刻死亡
            this.game_script.players[this.id].heart = 0;
            break;
        //道具收集
        case 21:
            //回血
            this.game_script.players[this.id].heart += 2;
            break;
        case 22:
            //发射3个跟踪导弹
            let num:number = 3;
            this.shootbomb(num);
            break;
        case 23:
            //球形闪电（定住敌人一段时间）
            let bullet = Game.inst.createBullet();
            bullet.getComponent("bullet").attack = 0;
            bullet.getComponent("bullet").type=3;
            bullet.setPosition(this.node.x+this.node.width/2,this.node.y);
            //不同子弹设置
            bullet.getComponent(cc.CircleCollider).tag=13;
            let bullets=cc.find("Canvas/bullets");
            bullets.addChild(bullet);
            break;
        //受到攻击
        case 31:
            this.game_script.players[this.id].heart -= other.node.getComponent("f_bullet").attack;
            this.getComponent(cc.Animation).play('道具消失');
            this.scheduleOnce(()=> {
                this.getComponent(cc.Animation).stop('道具消失');
                this.node.opacity = 255;
            }, 2);
            break;
        default:
            cc.log("为未知碰撞")
            break;
        }
   }
   onshoot(){
        if(this.game_script.gameState > 1)
        {
            switch(this.game_script.players[this.id].level)
            {
                case 1:
                    this.shootnormal(1);
                    break;
                case 2:
                    this.shootnormal(3);
                    break;
                case 3:
                    this.dis++;
                    if(this.dis%12==0)
                    {
                        this.dis=0;
                        this.shootbomb(1);
                    }
                    this.shootnormal(3);
                    break;
                case 4:
                    this.dis++;
                    if(this.dis%6==0)
                    {
                        this.dis=0;
                        this.shootbomb(1);
                    }
                    this.shootnormal(3,3);
                    break;
            }
        }
   }
   //发射子弹
   shootnormal(num:number,state:number=0){//state特殊属性0:普通 3:贯穿
        //计算发射的纵坐标
        let places:number[] = [];
        for(let i = this.node.height/(num+1);i<this.node.height;i+=this.node.height/(num+1))
        {
            places.push(i);
        }
        for(let i = 0;i<num;i++)
        {
            let bullet = Game.inst.createBullet();
            bullet.getComponent("bullet").attack = this.game_script.players[this.id].attack;
            bullet.setPosition(this.node.x+this.node.width/2,this.node.y-this.node.height/2+places[i]);
            //不同子弹设置
            bullet.getComponent("bullet").type=state+1;
            bullet.getComponent(cc.CircleCollider).tag=state+11;
            let bullets=cc.find("Canvas/bullets");
            bullets.addChild(bullet);
        }
   }
   //发射导弹
   shootbomb(num:number){
        let targets:cc.Node[] = [];
        //boss战阶段只打击boss
        if(this.game_script.gameState==3)
        {
            //targets中填入num个boss
            let boss = cc.find("Canvas/boss");
            for(let i = 0;i<=num;i++)
            {
                targets.push(boss);
            }
        }
        else
        {
            let factors = cc.find("Canvas/factors");
            //获取打击对象
            let size:number = factors.childrenCount;
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
        }
        //选择目标
        let i=0;
        this.schedule(()=>
        {
            let bullet = Game.inst.createBullet();
            bullet.getComponent("bullet").attack = 20;
            bullet.getComponent("bullet").type=2;
            bullet.getComponent("bullet").dir==cc.v2(1,0);
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
   }

}
