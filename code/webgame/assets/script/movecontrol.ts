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

    private canvas : cc.Node = null;
    isLeft:boolean = false;
    isRight:boolean = false;
    isUp:boolean = false;
    isDown:boolean = false;
    // LIFE-CYCLE CALLBACKS:
    //移动
    onLoad () {
        this.canvas = cc.find('Canvas');
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN,this.keyDownEvent,this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP,this.keyUpEvent,this);
    }


    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {

    }

    // update (dt) {}
    //移动系统
   update(dt)
   {
       let w:number = this.canvas.width/2 - this.node.width/2;
       let h:number = this.canvas.height/2 - this.node.height/2;
       if (this.isLeft)
       {
           this.node.x-=this.speed*dt;
           if(this.node.x<=-w)
           {
               this.node.x=-w;
           }
       }
        if(this.isRight)
       {
           this.node.x+=this.speed*dt;
           if(this.node.x>=w)
           {
               this.node.x=w;
           }
       }
        if(this.isUp)
       {
           this.node.y+=this.speed*dt;
           if (this.node.y>h)
           {
               this.node.y=h;
           }
       }
        if(this.isDown)
       {
           this.node.y-=this.speed*dt;
           if(this.node.y<-h)
           {
               this.node.y=-h;
           }
       }
   }

  keyDownEvent(event)
   {
       switch(event.keyCode)
       {
           case cc.macro.KEY.a:
                this.isLeft=true;
           break;
           case cc.macro.KEY.d:
                this.isRight=true;
           break;
           case cc.macro.KEY.w:
                this.isUp=true;
           break;
           case cc.macro.KEY.s:
                this.isDown=true;
           break;

       }
   }

   keyUpEvent(event)
   {
       switch(event.keyCode)
       {
           case cc.macro.KEY.a:
                this.isLeft=false;
           break;
           case cc.macro.KEY.d:
                this.isRight=false;
           break;
           case cc.macro.KEY.w:
                this.isUp=false;
           break;
           case cc.macro.KEY.s:
                this.isDown=false;
           break;
       }
   }

}
