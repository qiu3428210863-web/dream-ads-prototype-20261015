import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
function boot(native=true){
 let centered=0,appended=0;const frames=[];
 const cards=Array.from({length:5},(_,id)=>({id,style:{setProperty(){}},getBoundingClientRect(){return{left:id*222,top:0,width:210,height:118};}}));
 const rail={children:[...cards],classList:{add(){},remove(){}},offsetWidth:844,append(fragment){appended++;this.children=[...fragment.children];}};
 const doc={createDocumentFragment:()=>({children:[],append(card){this.children.push(card);}}),documentElement:{classList:{contains:()=>false}}};
 const context={heroCardGrid:rail,nativeFeatured:{matches:native},applyFeaturedDepth(){},centerFeaturedCard(){centered++;},document:doc,requestAnimationFrame:fn=>frames.push(fn),performance:{now:()=>0}};
 const code=app.slice(app.indexOf('const rotateFeaturedCardToCenter='),app.indexOf('const updateFeaturedProgress='));
 vm.runInNewContext(code+';this.rotate=rotateFeaturedCardToCenter;',context);
 return {cards,rail,frames,context,get centered(){return centered;},get appended(){return appended;}};
}
test('mobile playback changes never reorder cards or overwrite a user scroll position',()=>{const h=boot();h.context.rotate(h.cards[0]);h.context.rotate(h.cards[3]);h.context.rotate(h.cards[1]);assert.deepEqual(h.rail.children.map(c=>c.id),[0,1,2,3,4]);assert.equal(h.appended,0);assert.equal(h.centered,0);assert.equal(h.frames.length,0);});
test('desktop retains its centered cyclic carousel',()=>{const h=boot(false);h.context.rotate(h.cards[0]);assert.equal(h.rail.children[2],h.cards[0]);assert.equal(h.centered,1);assert.equal(h.appended,1);});
