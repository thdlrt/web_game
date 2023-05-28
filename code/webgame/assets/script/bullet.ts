// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html
import Game from "./game";
const { ccclass, property } = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {


    speed: number = 200;

    attack: number = 5;

    type: number = 1;

    audio: cc.AudioClip = null;

    canvas: cc.Node = null;
    //特殊子弹属性
    //打击目标
    target: cc.Node = null;
    //方向
    dir: cc.Vec2 = cc.v2(1, 0);
    //产生时间
    startTime: number = 0;
    //是否已经绑定
    isBind: boolean = false;
    //跟踪导弹目标死亡
    isDead: boolean = false;
    onEnable() {
        this.isDead = false;
        if (!this.isBind) {
            window["onfire"].on("onupdate", this.onupdate.bind(this));
            this.isBind = true;
        }
        //属性初始化
        this.node.opacity = 255;
        this.getComponent(cc.CircleCollider).radius = 18;
        this.startTime = performance.now();
        this.node.angle = 0;
        this.dir = cc.v2(1, 0);
        this.node.width = 60;
        this.node.height = 15;
        this.node.scale = 1;
        if (this.type == 1 || this.type == 4)
            this.speed = 700;
        if (this.type == 2) {
            this.node.width = 120;
            this.node.height = 60;
        }
        //射击音效
        cc.resources.load("music/bullet_" + this.type, cc.AudioClip, (err, audioClip) => {
            //if(err)cc.log(err);
            this.audio = <cc.AudioClip>audioClip;
        });
        //加载贴图
        cc.resources.load("picture/bullet_" + this.type, cc.SpriteFrame, (err, spriteFrame) => {
            if (err) cc.log(err);
            this.getComponent(cc.Sprite).spriteFrame = <cc.SpriteFrame>spriteFrame;
        });
        //太吵了，也许只有特殊子弹配音效比较好
        cc.audioEngine.play(this.audio, false, 0.07);
        this.node.zIndex = 5;
        this.canvas = cc.find('Canvas');
        //球形闪电，飞到指定位置使得敌人瘫痪
        if (this.type == 3) {
            this.node.width = 120;
            this.node.height = 90
            this.node.getComponent(cc.CircleCollider).radius = 0;
            //移动到指定位置
            cc.tween(this.node).to(0.5, { position: cc.v3(this.canvas.width / 2 - 2 * this.node.width, 0) }, { easing: 'sineOut' }).
                call(() => {
                    //瘫痪敌人
                    //作用半径
                    console.log("emp")
                    let r: number = 200;
                    this.node.width = r;
                    this.node.height = r;
                    cc.audioEngine.play(this.audio, false, 0.7);
                    this.node.getComponent(cc.Animation).play("emp");
                    cc.tween(this.node.getComponent(cc.CircleCollider)).to(0.4, { radius: r }, { easing: 'sineOut' }).start();
                    //定时销毁
                    setTimeout(() => {
                        this.dismiss();
                    }, 1000);
                }).start();
        }
    }

    onupdate(dt) {
        if (this.type == 1 || this.type == 4) {
            this.node.x += this.speed * dt;
            if (this.node.x > this.canvas.width / 2) {
                this.dismiss();
            }
        }
        //跟踪导弹
        else if (this.type == 2) {
            if (this.target != null && (Math.abs(this.target.x - this.node.x) + Math.abs(this.target.y - this.node.y)) < 15)
                this.isDead = true;
            if (this.target != null && cc.isValid(this.target) && this.target.getComponent(cc.CircleCollider).tag != 1 && !this.isDead) {
                this.dir.x = this.target.x - this.node.x;
                this.dir.y = this.target.y - this.node.y;
                this.dir.normalizeSelf();
            }
            this.node.rotation = cc.misc.radiansToDegrees(Math.atan2(this.dir.x, this.dir.y)) - 90;
            this.node.x += this.dir.x * 1200 * dt;
            this.node.y += this.dir.y * 1200 * dt;
            if (performance.now() - this.startTime > 3000 || this.node.x > this.canvas.width / 2 || this.node.x < -this.canvas.width / 2 || this.node.y > this.canvas.height / 2 || this.node.y < -this.canvas.height / 2) {
                this.dismiss();
            }
        }
    }
    dismiss() {

        Game.inst.destroyBullet(this.node);
    }
    onCollisionEnter(other: cc.Collider, self: cc.Collider) {

        if (other.node.getComponent(cc.CircleCollider).tag != 1) {
            //打击效果
            let hit = cc.instantiate(cc.find('effect/hit'));
            hit.parent = cc.find('effect');
            hit.position = this.node.position;
            hit.x += 7;
            hit.active = true;
            //计时销毁
            setTimeout(() => {
                hit.destroy();
            }, 100);
            if (this.type == 3 || this.type == 4) {
                //不需要消失，让factor知道就行
                return;
            }
            else
                this.dismiss();
        }
    }
}
