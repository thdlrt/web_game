// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html
import Game from "./game";
const {ccclass, property} = cc._decorator;

@ccclass
export default class factor extends cc.Component {
    //音效
    @property(cc.AudioClip)
    audio : cc.AudioClip = null;
    //速度
    @property
    speed : number = 200;
    //生命值
    @property
    heart : number = 1;
    //分值
    @property
    score : number = 1;
    //种类使用Tag属性
    private canvas : cc.Node = null;
    onLoad () {}
    start () {}
    //初始化
    onEnable(){
        this.canvas = cc.find('Canvas');
        if(Game.inst.gameState == 2)
        {
           this.speed = 300;
        }
    }
    update (dt) {
        let step = this.speed *dt;
        this.node.x -= step;
        if(this.node.x < - this.canvas.width/2 - this.node.width )
        {
            this.dismiss();
        }
    }
    dismiss(){
        if(Game.inst.gameState == 2 &&this.node.x > - this.canvas.width/2+this.node.width/2)
        {
            if(this.node.getComponent(cc.CircleCollider).tag != 0)
                this.createitem();
        }
        Game.inst.destroyFactor( this.node );

    }
    //碰撞检测
    onCollisionEnter (other : cc.Collider, self : cc.Collider) {
        if(other.tag == 0)//和地球碰撞
        {
            cc.audioEngine.play(this.audio, false, 0.2);
            this.dismiss();
        }
        else if(other.tag/10==1)//和子弹碰撞
        {
            //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
        }
    }
    createitem()
    {
        //三种道具（回血13、导弹24、炸弹0），升级用的moss仍然随机出现，只是更少
        //1/4生成一个单位
        let generate = Math.floor(Math.random()*4);
        if(generate != 0)return;
        cc.log("生成道具");
        //基本信息初始化
        let generatenode = Game.inst.createItem();
        generatenode.parent = cc.find("Canvas/items");
        let type = Math.floor(Math.random()*5);
        generatenode.zIndex = 4;
        let col = generatenode.getComponent(cc.CircleCollider);

        if(type%2==1)
            type=1;
        else if(type%2==0&&type!=0)
            type=2;
        else
            type=3;
        //元素种类配置
        //col.tag = type+20;
        cc.resources.load("picture/item_"+type, cc.SpriteFrame, (err, spriteFrame) => {
            if(err)cc.log(err);
            generatenode.getComponent(cc.Sprite).spriteFrame = <cc.SpriteFrame>spriteFrame;
        });
        generatenode.setPosition(this.node.getPosition());
    }
}
