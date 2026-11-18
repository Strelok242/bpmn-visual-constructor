import { getBounds, getWaypoints, validateModel } from './model.js';
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
export function exportBpmnXML(raw) {
  const m = validateModel(raw);
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="https://example.org/bpmn-studio">',
    `  <bpmn:process id="Process_1" name="${esc(m.title)}" isExecutable="false">`
  ];
  for(const n of m.nodes){
    const incoming=m.flows.filter(f=>f.target===n.id).map(f=>`      <bpmn:incoming>${esc(f.id)}</bpmn:incoming>`);
    const outgoing=m.flows.filter(f=>f.source===n.id).map(f=>`      <bpmn:outgoing>${esc(f.id)}</bpmn:outgoing>`);
    lines.push(`    <bpmn:${n.type} id="${esc(n.id)}" name="${esc(n.name)}">`,...incoming,...outgoing,`    </bpmn:${n.type}>`);
  }
  for(const f of m.flows) lines.push(`    <bpmn:sequenceFlow id="${esc(f.id)}" sourceRef="${esc(f.source)}" targetRef="${esc(f.target)}" />`);
  lines.push('  </bpmn:process>', '  <bpmndi:BPMNDiagram id="BPMNDiagram_1">', '    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">');
  for(const n of m.nodes){
    const b=getBounds(n);
    lines.push(`      <bpmndi:BPMNShape id="${esc(n.id)}_di" bpmnElement="${esc(n.id)}">`);
    lines.push(`        <dc:Bounds x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" />`);
    lines.push('      </bpmndi:BPMNShape>');
  }
  for(const f of m.flows){
    const from=m.nodes.find(n=>n.id===f.source),to=m.nodes.find(n=>n.id===f.target);
    lines.push(`      <bpmndi:BPMNEdge id="${esc(f.id)}_di" bpmnElement="${esc(f.id)}">`);
    for (const pt of getWaypoints(from,to)) lines.push(`        <di:waypoint x="${pt.x}" y="${pt.y}" />`);
    lines.push('      </bpmndi:BPMNEdge>');
  }
  lines.push('    </bpmndi:BPMNPlane>', '  </bpmndi:BPMNDiagram>', '</bpmn:definitions>');
  return lines.join('\n');
}
