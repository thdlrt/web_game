// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;
import Game from "./game";
@ccclass
export default class NewClass extends cc.Component {

    canvas : cc.Node = null;
    //基本属性
    heart_s : number = 3000;//总生命值
    heart : number = this.heart_s;//当前生命值
    //阶段
    stage : number = 1;
    //射击模式切换（用于计数）
    attack1_num : number = 0;
    //移动方向 0：不移地 1：上 2：下 3：冲撞
    move_dir : number = 0;
    //冲撞等待时间
    move_time : number = 1.5;
    //移动速度
    move_speed : number = 100;
    //射击方向数组
    dir_list=[]
    //子弹攻击力
    attack : number = 1;
    onEnable () {
        //初始化
        this.canvas = cc.find('Canvas');
        this.move_dir = 0;
        this.dir_list.push([cc.v2(-1,0.6),cc.v2(-1,0),cc.v2(-1,-0.6)])
        this.dir_list.push([cc.v2(-1,0.3),cc.v2(-1,-0.3)])
        this.node.rotation = 0;
        //标准化
        for(let i=0;i<this.dir_list.length;i++)
        {
            for(let j=0;j<this.dir_list[i].length;j++)
            {
                this.dir_list[i][j] = this.dir_list[i][j].normalize();
            }
        }
        //开启攻击
        this.startattack();
        window["onfire"].on("onupdate", this.onupdate.bind(this));
    }

    onupdate (dt) {
        if(this.move_dir==1)
        {
            this.node.y += this.move_speed*dt;
            if(this.node.y>=this.canvas.height/2-80)
                this.move_dir = 2;
        }
        else if(this.move_dir==2)
        {
            this.node.y -= this.move_speed*dt;
            if(this.node.y<=-this.canvas.height/2+80)
                this.move_dir = 1;
        }
        else if(this.move_dir==3)
        {
            this.node.x -= 800*dt;
            if(this.node.x<=-this.canvas.width/2-100)//冲撞结束,归位，恢复射击、移动
            {
                this.node.x = this.canvas.width/2+100;
                this.node.y = 0;
                cc.tween(this.node).to(0.8,{position:cc.v3(300,0,0)},{easing:'sineOut'}).call(()=>{
                    this.move_dir = 1;
                    this.stage = 3;
                }).start();
            }
        }
    }
    onCollisionEnter (other : cc.Collider, self : cc.Collider) {
        //特殊攻击
        //球形闪电使得停止3s
        if(other.tag==13&&this.stage!=0)
        {
            //瘫痪动画>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
            let temp1 = this.stage;
            let temp2 = this.move_dir;
            this.stage = 0;
            this.move_dir = 0;
            this.scheduleOnce(()=> {
                this.stage=temp1;
                this.move_dir=temp2;
            },3);
            return;
        }
        //有1%的几率掉落道具
        if(window["random"].seededRandom()<0.01)
        {
            this.lostitem(1);
        }
        //普通攻击、状态更新
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
                this.startattack();
            }
            else if(this.heart<=this.heart_s*0.4&&this.stage==2)
            {
                process.color = cc.Color.RED;
                this.stage=3;
                this.startattack();
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
        //关闭计时器
        this.unscheduleAllCallbacks();
    }
    startattack(){//当boss阶段发生变化时进行调整
        //先关闭攻击
        this.unscheduleAllCallbacks();
        //根据boss阶段选择模式
        switch(this.stage)
        {
            case 1://静止不动，交替方向攻击
                this.schedule(this.attack1, 0.3);
                break;
            case 2://移动攻击
                this.move_dir = 1;
                this.schedule(this.attack1, 0.3);
                this.lostitem(2);
                break;
            case 3://移动攻击+冲撞
                this.attack2();
                this.schedule(this.attack1, 0.25);
                this.schedule(this.attack2, 10);
                this.lostitem(4);
                break;
            default:
                cc.log("boss阶段error");
        }
    }
    attack1(){
        if(this.stage==0)return;//暂时暂停
        this.attack1_num++;
        let state:number=0;//攻击样式
        //模式控制
        if(this.attack1_num<=10)//3
        {
            state=0;
        }
        else if(this.attack1_num<=20)//2
        {
            state=1;
        }
        else
        {
            this.attack1_num=0;
        }
        for(let i=0;i<this.dir_list[state].length;i++)
        {
            let bullet = Game.inst.createf_Bullet();
            bullet.getComponent("f_bullet").attack = this.attack;
            bullet.getComponent("f_bullet").type=1;
            bullet.getComponent("f_bullet").speed=500;
            bullet.getComponent("f_bullet").dir=this.dir_list[state][i];
            bullet.rotation=cc.misc.radiansToDegrees(Math.atan2(this.dir_list[state][i].x, this.dir_list[state][i].y))-90;
            bullet.setPosition(this.node.x-60,this.node.y);
            bullet.getComponent(cc.CircleCollider).tag=31;
            let bullets=cc.find("Canvas/bullets");
            bullets.addChild(bullet);
        }
    }
    attack2(){
        this.stage=0;//暂停发射后冲撞
        this.scheduleOnce(()=> {
            this.move_dir=3;
            this.move_time*=0.8;//前摇缩短
        },this.move_time);
    }
    //道具掉落
    lostitem(num:number){
        for(let i=0;i<num;i++)
        {
            let generatenode = Game.inst.createItem();
            generatenode.parent = cc.find("Canvas/items");
            let type = Math.floor(window["random"].seededRandom()*3);
            generatenode.zIndex = 4;
            let col = generatenode.getComponent(cc.CircleCollider);

            if(type==0)
                type=1;
            else if(type==1)
                type=2;
            else if(type==2)
                type=3;
            //元素种类配置
            col.tag = type+20;
            cc.resources.load("picture/item_"+type, cc.SpriteFrame, (err, spriteFrame) => {
                if(err)cc.log(err);
                generatenode.getComponent(cc.Sprite).spriteFrame = <cc.SpriteFrame>spriteFrame;
            });
            generatenode.setPosition(this.node.getPosition());
        }
    }
}
