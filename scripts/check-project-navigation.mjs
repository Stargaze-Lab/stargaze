import assert from 'node:assert/strict';
import {mountProjectNavigation} from '../src/project-navigation.js';
const dialog=new EventTarget(),previous=new EventTarget(),next=new EventTarget();
dialog.open=true;let index=0,calls=0;
const cleanup=mountProjectNavigation({dialog,previous,next,count:7,index:()=>index,open:i=>{index=i;calls++;}});
previous.dispatchEvent(new Event('click'));assert.equal(index,6);
next.dispatchEvent(new Event('click'));assert.equal(index,0);
function key(key,target={},options={}){
  const event=new Event('keydown',{cancelable:true});
  Object.assign(event,{key,...options});event.composedPath=()=>[target,dialog];
  dialog.dispatchEvent(event);return event;
}
assert.ok(key('ArrowLeft').defaultPrevented);assert.equal(index,6);
for(let i=0;i<22;i++)key('ArrowRight');
assert.equal(index,0,'Repeated keys cycle quickly across both ends');
const before=calls;
for(const target of [{isContentEditable:true},{matches:()=>true}]){
  assert.ok(!key('ArrowRight',target).defaultPrevented);
}
key('ArrowRight',{}, {ctrlKey:true});key('ArrowRight',{}, {isComposing:true});key('Escape');
assert.equal(calls,before,'Editing and instrument controls keep their keys');
dialog.open=false;key('ArrowRight');next.dispatchEvent(new Event('click'));assert.equal(calls,before);
dialog.open=true;key('ArrowRight');assert.equal(index,1,'Reopening retains navigation');
cleanup();key('ArrowRight');next.dispatchEvent(new Event('click'));assert.equal(index,1);
console.log('Project navigation passed: buttons, wrapping, repeated arrows, local controls, close/reopen and cleanup.');
