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

    //音效
    @property(cc.AudioClip)
    audio : cc.AudioClip = null;
    //速度
    speed : number = 150;
    //方向
    dir : cc.Vec2;
    //类型
    type:number = 1
    //生命
    time:number = 15;
    private canvas : cc.Node = null;
    //计时器
    schedule1:cc.Scheduler = null;
    schedule2:cc.Scheduler = null;
    onLoad () {}
    start () {}
    update (dt) {
        //随机移动,碰到画面边缘时反弹
        this.node.x += this.dir.x*this.speed*dt;
        this.node.y += this.dir.y*this.speed*dt;
        if(this.node.x > this.canvas.width/2 || this.node.x < -this.canvas.width/2){
            this.dir.x *= -1;
        }
        if(this.node.y > this.canvas.height/2 || this.node.y < -this.canvas.height/2){
            this.dir.y *= -1;
        }

    }
    onEnable(){
        //初始化
        //随机方向
        this.dir = cc.v2(window["random"].seededRandom()*2-1,window["random"].seededRandom()*2-1);
        this.dir.normalizeSelf();
        this.canvas = cc.find('Canvas');
        this.node.active = true;
        //闪烁计时器
        this.scheduleOnce(()=> {
            this.getComponent(cc.Animation).play('道具消失');
        }, this.time-5);
        //销毁计时器
        this.scheduleOnce(()=> {
            this.dismiss();
        }, this.time);
    }
    //碰撞检测
    onCollisionEnter (other : cc.Collider, self : cc.Collider) {
        //收获音效
        cc.resources.load("music/item_"+this.type, cc.AudioClip, (err, audioClip) => {
            if(err)cc.log(err);
            this.audio = <cc.AudioClip>audioClip;
        });
        cc.audioEngine.play(this.audio, false, 0.5);
        this.dismiss();
    }
    dismiss(){
        //关闭所有计时器
        this.unscheduleAllCallbacks();
        Game.inst.destroyItem( this.node );
        //属性复原
        this.getComponent(cc.Animation).stop('道具消失');
        this.node.opacity=200;
    }
}
