// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    @property
    speed:number = 200;
    @property
    attack:number = 1;

    canvas : cc.Node = null;
    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.node.zIndex = 1;
        this.canvas = cc.find('Canvas');
    }

    start () {
        
    }

    update (dt) {
        this.node.x += this.speed*dt;
        if(this.node.x > this.canvas.width/2){
            this.dismiss();
        }
    }
    dismiss(){
        // TODO: 销毁子弹
        // this.node.destroy();
        //Game.inst.destroyBullet( this.node );
    }
    onCollisionEnter (other : cc.Collider, self : cc.Collider) {
        this.dismiss();
    }
}
