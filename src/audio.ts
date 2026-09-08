export class AudioSystem{
  private ctx:AudioContext|null=null; private master=0.18;
  init(){if(!this.ctx)this.ctx=new AudioContext(); if(this.ctx.state==='suspended')void this.ctx.resume();}
  setMaster(v:number){this.master=v;}
  tone(freq=440,duration=.07,type:OscillatorType='sine'){if(!this.ctx)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(.0001,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(this.master,this.ctx.currentTime+.01);g.gain.exponentialRampToValueAtTime(.0001,this.ctx.currentTime+duration);o.connect(g).connect(this.ctx.destination);o.start();o.stop(this.ctx.currentTime+duration+.02);}
  click(){this.tone(520,.045,'square')} success(){this.tone(660,.08);setTimeout(()=>this.tone(880,.1),70)} warning(){this.tone(180,.16,'sawtooth')} emergency(){this.tone(110,.25,'sawtooth');setTimeout(()=>this.tone(90,.25,'sawtooth'),260)}
}
