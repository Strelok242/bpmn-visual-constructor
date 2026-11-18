/** Pure BPMN project model. No framework or external dependencies. */
export const TYPES = Object.freeze(['startEvent', 'task', 'exclusiveGateway', 'endEvent']);
export const LABELS = Object.freeze({
  startEvent: 'Начало', task: 'Задача', exclusiveGateway: 'Условие', endEvent: 'Завершение'
});
const PREFIX = {startEvent: 'Start', task: 'Task', exclusiveGateway: 'Gateway', endEvent: 'End'};
export const EMPTY = () => ({version: 1, title: 'Новый бизнес-процесс', nodes: [], flows: []});
export const uid = (prefix = 'id') => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
export const dimensions = type => type === 'task' ? {w: 152, h: 76} : type === 'exclusiveGateway' ? {w: 66, h: 66} : {w: 56, h: 56};
export function createNode(type, x, y, name = LABELS[type]) {
  if (!TYPES.includes(type)) throw new Error('Недопустимый тип BPMN');
  return {id: uid(PREFIX[type]), type, x: Number(x), y: Number(y), name: String(name)};
}
export function createFlow(sourceId, targetId, model) {
  if (sourceId === targetId) throw new Error('Нельзя соединить элемент с самим собой');
  const source = model.nodes.find(x => x.id === sourceId);
  const target = model.nodes.find(x => x.id === targetId);
  if (!source || !target) throw new Error('Элемент не найден');
  if (source.type === 'endEvent') throw new Error('Событие завершения не может иметь исходящий поток');
  if (target.type === 'startEvent') throw new Error('Стартовое событие не может иметь входящий поток');
  if (model.flows.some(x => x.source === sourceId && x.target === targetId)) throw new Error('Связь уже существует');
  return {id: uid('Flow'), source: sourceId, target: targetId};
}
export function getBounds(node) { const {w, h} = dimensions(node.type); return {x: node.x - w/2, y: node.y - h/2, width: w, height: h}; }
export function getWaypoints(from, to) {
  const dx=to.x-from.x, dy=to.y-from.y;
  const edge = n => {
    const {w,h}=dimensions(n.type);
    if (n.type !== 'task') {
      const rr = n.type === 'exclusiveGateway' ? 33/(Math.abs(dx)/Math.hypot(dx,dy)+Math.abs(dy)/Math.hypot(dx,dy) || 1) : 28;
      return rr;
    }
    return 0;
  };
  const dist = Math.hypot(dx,dy) || 1;
  function point(n,sign) {
    const vx=dx/dist*sign, vy=dy/dist*sign;
    const {w,h}=dimensions(n.type);
    let t;
    if (n.type === 'task') t=Math.min(Math.abs(vx)>1e-6 ? (w/2)/Math.abs(vx) : 1e9, Math.abs(vy)>1e-6 ? (h/2)/Math.abs(vy) : 1e9);
    else if(n.type === 'exclusiveGateway') t=(w/2)/(Math.abs(vx)+Math.abs(vy) || 1);
    else t=w/2;
    return {x:Math.round((n.x+vx*t)*10)/10,y:Math.round((n.y+vy*t)*10)/10};
  }
  return [point(from,1),point(to,-1)];
}
export function validateModel(data) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.nodes) || !Array.isArray(data.flows)) throw new Error('Некорректный файл проекта');
  if (data.nodes.length > 200 || data.flows.length > 500) throw new Error('Превышен учебный лимит модели');
  const ids=new Set();
  for (const n of data.nodes) {
    if (!n || !TYPES.includes(n.type) || typeof n.id!=='string' || !/^[A-Za-z][\w-]{0,80}$/.test(n.id) || ids.has(n.id) || !Number.isFinite(n.x) || !Number.isFinite(n.y) || Math.abs(n.x)>100000 || Math.abs(n.y)>100000 || typeof n.name!=='string' || n.name.length>160) throw new Error('Недопустимый элемент диаграммы');
    ids.add(n.id);
  }
  const pairs=new Set();
  for(const f of data.flows) {
    if(!f || !/^[A-Za-z][\w-]{0,80}$/.test(f.id ?? '') || ids.has(f.id) || !ids.has(f.source) || !ids.has(f.target) || f.source===f.target) throw new Error('Некорректный поток управления');
    const src=data.nodes.find(n=>n.id===f.source), dst=data.nodes.find(n=>n.id===f.target);
    if(src.type==='endEvent' || dst.type==='startEvent') throw new Error('Поток нарушает ограничения событий');
    const p=`${f.source}:${f.target}`;
    if(pairs.has(p)) throw new Error('Дублирование потока');
    pairs.add(p); ids.add(f.id);
  }
  return {version:1,title:String(data.title || 'Бизнес-процесс').slice(0,100),nodes:data.nodes.map(x=>({...x})),flows:data.flows.map(x=>({...x}))};
}
export function createDemo() {
  const p=EMPTY();p.title='Обработка заявки клиента';
  p.nodes=[
    {id:'Start_1',type:'startEvent',x:100,y:245,name:'Запрос'},
    {id:'Task_1',type:'task',x:300,y:245,name:'Получить заявку'},
    {id:'Gateway_1',type:'exclusiveGateway',x:510,y:245,name:'Данные полные?'},
    {id:'Task_2',type:'task',x:735,y:130,name:'Подготовить предложение'},
    {id:'Task_3',type:'task',x:735,y:355,name:'Запросить уточнения'},
    {id:'End_1',type:'endEvent',x:965,y:130,name:'Завершено'},
    {id:'End_2',type:'endEvent',x:965,y:355,name:'Ожидание'}
  ];
  p.flows=[['Start_1','Task_1'],['Task_1','Gateway_1'],['Gateway_1','Task_2'],['Gateway_1','Task_3'],['Task_2','End_1'],['Task_3','End_2']].map(([source,target],i)=>({id:`Flow_${i+1}`,source,target}));
  return p;
}
