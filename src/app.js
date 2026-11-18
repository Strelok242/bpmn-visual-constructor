import {TYPES, LABELS, EMPTY, createNode, createFlow, createDemo, validateModel, getBounds, getWaypoints} from './model.js';
import {exportBpmnXML} from './bpmn-export.js';
const S='http://www.w3.org/2000/svg', $=id=>document.getElementById(id);
let model=EMPTY(), tool='select', selection=null, firstNode=null, dragging=null;
let undoStack=[],redoStack=[],zoom=1,toastTimer=null;
const STORAGE_KEY='flowcraft.bpmn.v1';
try {const saved=localStorage.getItem(STORAGE_KEY);if(saved) model=validateModel(JSON.parse(saved));}catch(e){console.warn('Сохранение не загружено',e);}
function svgEl(tag,attrs={},text=null){const e=document.createElementNS(S,tag);for(const [k,v] of Object.entries(attrs)) e.setAttribute(k,String(v));if(text!==null)e.textContent=text;return e;}
function snapshot(){undoStack.push(JSON.stringify(model));if(undoStack.length>60) undoStack.shift();redoStack=[];}
function updateStorage(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(model));$('saveStatus').textContent='● Локально сохранено';}catch(e){$('saveStatus').textContent='● Не удалось сохранить';}}
function toast(text){const el=$('toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2500);}
function render(){
 $('processTitle').value=model.title;
 $('nodeCount').textContent=model.nodes.length;$('flowCount').textContent=model.flows.length;
 $('emptyState').style.display=model.nodes.length?'none':'block';
 const nodes=$('nodes'),edges=$('edges');nodes.replaceChildren();edges.replaceChildren();
 for(const f of model.flows){const a=model.nodes.find(n=>n.id===f.source),b=model.nodes.find(n=>n.id===f.target);if(!a||!b)continue;
   const [p,q]=getWaypoints(a,b);
   const path=svgEl('path',{d:`M${p.x},${p.y} L${q.x},${q.y}`,fill:'none',stroke:'#4b627d','stroke-width':selection?.kind==='flow'&&selection.id===f.id?3:2.2,'marker-end':'url(#arrowhead)',class:`edge ${selection?.kind==='flow'&&selection.id===f.id?'selected':''}`,'data-flow-id':f.id});
   const hit=svgEl('path',{d:`M${p.x},${p.y} L${q.x},${q.y}`,fill:'none',stroke:'transparent','stroke-width':15,'data-flow-id':f.id,style:'cursor:pointer'});
   edges.append(path,hit);
 }
 for(const n of model.nodes){const {x,y,width,height}=getBounds(n);
   const g=svgEl('g',{class:`node ${selection?.kind==='node'&&selection.id===n.id?'selected':''}`,'data-node-id':n.id});
   if(n.type==='task')g.append(svgEl('rect',{x,y,width,height,rx:11,ry:11,fill:'#fff',stroke:'#3c8dff','stroke-width':2,class:'element-shape'}));
   if(n.type==='startEvent')g.append(svgEl('circle',{cx:n.x,cy:n.y,r:27,fill:'#e6faf2',stroke:'#2aa679','stroke-width':3,class:'element-shape'}));
   if(n.type==='endEvent')g.append(svgEl('circle',{cx:n.x,cy:n.y,r:26,fill:'#fff0f0',stroke:'#e27075','stroke-width':5,class:'element-shape'}));
   if(n.type==='exclusiveGateway'){
     g.append(svgEl('polygon',{points:`${n.x},${y} ${x+width},${n.y} ${n.x},${y+height} ${x},${n.y}`,fill:'#fff9e8',stroke:'#d39c29','stroke-width':2,class:'element-shape'}));
     g.append(svgEl('path',{d:`M${n.x-10},${n.y-10}L${n.x+10},${n.y+10}M${n.x+10},${n.y-10}L${n.x-10},${n.y+10}`,stroke:'#a87517','stroke-width':3,'stroke-linecap':'round'}));
   }
   if(n.type==='task'){
     const chunks=splitText(n.name,15,3);const t=svgEl('text',{'text-anchor':'middle'});const top=n.y-(chunks.length-1)*8;
     for(const [i,line]of chunks.entries())t.append(svgEl('tspan',{x:n.x,y:top+i*18},line));g.append(t);
   }else{
     const t=svgEl('text',{'text-anchor':'middle',x:n.x,y:y+height+20,'font-size':12},n.name.length>22?n.name.slice(0,20)+'…':n.name);g.append(t);
   }
   nodes.append(g);
 }
 updateProperties();updateStorage();
}
function splitText(text,max=18,limit=3){const words=String(text).split(/\s+/),lines=[];let cur='';for(const word of words){if(cur && (cur+' '+word).length>max){lines.push(cur);cur=word;}else cur=(cur?cur+' ':'')+word;}if(cur)lines.push(cur);if(!lines.length)return [''];if(lines.length>limit){lines.splice(limit-1,lines.length-limit+1,lines.slice(limit-1).join(' ').slice(0,max-1)+'…');}return lines;}
function updateProperties(){const selected=selection?.kind==='node'?model.nodes.find(n=>n.id===selection.id):null;$('properties').hidden=!selected;$('noSelection').hidden=!!selected;if(selected){$('selectedType').textContent=LABELS[selected.type];$('nodeName').value=selected.name;$('nodeId').textContent=selected.id;$('nodePosition').textContent=`x: ${Math.round(selected.x)} · y: ${Math.round(selected.y)}`;}}
function setTool(t){tool=t;firstNode=null;document.querySelectorAll('.palette').forEach(x=>x.classList.toggle('active',x.dataset.tool===t));const desc={select:'Выделение: щёлкните по элементу или перетащите его.',connect:'Связь: последовательно выберите исходный и целевой элементы.',startEvent:'Щёлкните по схеме, чтобы добавить начальное событие.',task:'Щёлкните по схеме, чтобы добавить задачу.',exclusiveGateway:'Щёлкните по схеме, чтобы добавить шлюз XOR.',endEvent:'Щёлкните по схеме, чтобы добавить конечное событие.'};$('hint').textContent=desc[t];}
function select(kind,id){selection=id?{kind,id}:null;render();}
function svgPos(event){const svg=$('diagram');const p=svg.createSVGPoint();p.x=event.clientX;p.y=event.clientY;return p.matrixTransform(svg.getScreenCTM().inverse());}
function deleteSelected(){if(!selection){toast('Сначала выделите элемент');return;}snapshot();if(selection.kind==='node'){model.nodes=model.nodes.filter(n=>n.id!==selection.id);model.flows=model.flows.filter(f=>f.source!==selection.id&&f.target!==selection.id);}else model.flows=model.flows.filter(f=>f.id!==selection.id);selection=null;render();}
function loadDemo(){snapshot();model=createDemo();selection=null;setTool('select');render();toast('Загружен пример бизнес-процесса');}
function undo(){if(!undoStack.length)return;redoStack.push(JSON.stringify(model));model=JSON.parse(undoStack.pop());selection=null;render();}
function redo(){if(!redoStack.length)return;undoStack.push(JSON.stringify(model));model=JSON.parse(redoStack.pop());selection=null;render();}
function download(name,data,mime){const a=document.createElement('a');const u=URL.createObjectURL(new Blob([data],{type:mime}));a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);}
function setZoom(next){zoom=Math.max(.65,Math.min(1.8,next));const svg=$('diagram');const w=1120/zoom,h=620/zoom,x=(1120-w)/2,y=(620-h)/2;svg.setAttribute('viewBox',`${x} ${y} ${w} ${h}`);$('zoomValue').textContent=`${Math.round(zoom*100)}%`;}
$('diagram').addEventListener('pointerdown',e=>{
 if(e.button!==0)return;
 const nodeEl=e.target.closest('[data-node-id]'), flowEl=e.target.closest('[data-flow-id]');
 if(nodeEl){const id=nodeEl.getAttribute('data-node-id');
   if(tool==='connect'){
     if(!firstNode){firstNode=id;toast('Теперь выберите целевой элемент');}else{try{snapshot();model.flows.push(createFlow(firstNode,id,model));render();toast('Поток управления создан');}catch(error){undoStack.pop();toast(error.message);}firstNode=null;}return;
   }
   if(tool==='select'){select('node',id);const n=model.nodes.find(x=>x.id===id);const p=svgPos(e);dragging={id,startX:n.x,startY:n.y,offsetX:n.x-p.x,offsetY:n.y-p.y,moved:false};$('diagram').setPointerCapture(e.pointerId);return;}
 }
 if(flowEl&&tool==='select'){select('flow',flowEl.getAttribute('data-flow-id'));return;}
 if(TYPES.includes(tool)){
   const p=svgPos(e);snapshot();const n=createNode(tool,Math.max(40,Math.min(1080,Math.round(p.x))),Math.max(40,Math.min(580,Math.round(p.y))));model.nodes.push(n);selection={kind:'node',id:n.id};render();setTool('select');return;
 }
 if(!nodeEl&&!flowEl&&tool==='select')select(null,null);
});
$('diagram').addEventListener('pointermove',e=>{
 if(!dragging)return;
 const n=model.nodes.find(x=>x.id===dragging.id);if(!n)return;const p=svgPos(e),x=Math.max(35,Math.min(1085,Math.round((p.x+dragging.offsetX)/10)*10)),y=Math.max(35,Math.min(585,Math.round((p.y+dragging.offsetY)/10)*10));
 if(Math.abs(n.x-x)+Math.abs(n.y-y)<1)return;
 if(!dragging.moved){snapshot();dragging.moved=true;}n.x=x;n.y=y;render();
});
$('diagram').addEventListener('pointerup',e=>{dragging=null;try{$('diagram').releasePointerCapture(e.pointerId);}catch{}});
$('diagram').addEventListener('pointercancel',()=>dragging=null);
for(const btn of document.querySelectorAll('.palette'))btn.addEventListener('click',()=>setTool(btn.dataset.tool));
$('processTitle').addEventListener('change',e=>{snapshot();model.title=e.target.value.trim()||'Бизнес-процесс';render();});
$('nodeName').addEventListener('change',e=>{const n=model.nodes.find(n=>n.id===selection?.id);if(!n)return;snapshot();n.name=e.target.value.trim()||LABELS[n.type];render();});
$('demoBtn').addEventListener('click',loadDemo);$('emptyDemoBtn').addEventListener('click',loadDemo);
$('clearBtn').addEventListener('click',()=>{if(model.nodes.length&&!confirm('Очистить диаграмму?'))return;snapshot();model=EMPTY();selection=null;setTool('select');render();});
$('deleteBtn').addEventListener('click',deleteSelected);$('undoBtn').addEventListener('click',undo);$('redoBtn').addEventListener('click',redo);
$('zoomIn').addEventListener('click',()=>setZoom(zoom+.1));$('zoomOut').addEventListener('click',()=>setZoom(zoom-.1));$('zoomFit').addEventListener('click',()=>setZoom(1));
$('saveJsonBtn').addEventListener('click',()=>download('bpmn-process.json',JSON.stringify(model,null,2),'application/json'));
$('saveXmlBtn').addEventListener('click',()=>{try{download('bpmn-process.bpmn',exportBpmnXML(model),'application/xml');toast('BPMN XML экспортирован');}catch(e){toast(e.message);}});
$('openBtn').addEventListener('click',()=>$('fileInput').click());
$('fileInput').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{const raw=JSON.parse(await file.text());const clean=validateModel(raw);snapshot();model=clean;selection=null;setTool('select');render();toast('Проект импортирован из JSON');}catch(error){toast(`Ошибка импорта: ${error.message}`);}e.target.value='';});
document.addEventListener('keydown',e=>{
 if(['INPUT','TEXTAREA'].includes(document.activeElement?.tagName))return;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();undo();return;}
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();redo();return;}
 if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();if(selection)deleteSelected();return;}
 const keys={'v':'select','c':'connect','1':'startEvent','2':'task','3':'exclusiveGateway','4':'endEvent'};const t=keys[e.key.toLowerCase()];if(t)setTool(t);
});
setZoom(1);render();
