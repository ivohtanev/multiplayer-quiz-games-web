export const tiles=[
 {id:'streak',name:'Серия',icon:'↗',desc:'Всеки втори пореден верен отговор: +1 точка.'},
 {id:'comeback',name:'Завръщане',icon:'↶',desc:'Верен отговор след грешен: +1 точка.'},
 {id:'reserve',name:'Резерв',icon:'◈',desc:'Грешен отговор: още +1 кредит.'},
 {id:'saver',name:'Спестовник',icon:'◇',desc:'Верен отговор с 5+ начални кредита: +1 точка.'},
 {id:'focus',name:'Фокус',icon:'◎',desc:'Верен отговор в избраната тема: +1 точка.'},
 {id:'switch',name:'Смяна',icon:'⇄',desc:'Верен отговор в нова тема: +1 точка.'},
 {id:'converter',name:'Конвертор',icon:'⚡',desc:'При верен отговор: 2 кредита → 1 точка, по избор.'},
 {id:'final',name:'Финален ход',icon:'✦',desc:'Верен отговор в рунд 8: още +2 точки.'}
];
export function score(p,correct,topic,round,convert){
 const events=[correct?'+1 точка · +2 кредита':'+1 кредит'];const initial=p.credits;
 p.credits+=correct?2:1;p.score+=correct?1:0;
 for(const t of p.tiles){let bonus=0;
 if(t.id==='streak'){t.count=correct?(t.count||0)+1:0;if(t.count===2){bonus=1;t.count=0;}}
 if(t.id==='comeback'&&correct&&p.previous===false)bonus=1;
 if(t.id==='reserve'&&!correct){p.credits++;events.push('Резерв: +1 кредит');}
 if(t.id==='saver'&&correct&&initial>=5)bonus=1;
 if(t.id==='focus'&&correct&&t.topic===topic)bonus=1;
 if(t.id==='switch'&&correct&&p.topic&&p.topic!==topic)bonus=1;
 if(t.id==='converter'&&correct&&convert&&p.credits>=2){p.credits-=2;bonus=1;events.push('Конвертор: −2 кредита');}
 if(t.id==='final'&&correct&&round===8)bonus=2;
 if(bonus){p.score+=bonus;events.push(`${tiles.find(x=>x.id===t.id).name}: +${bonus} точка`);}}
 p.previous=correct;p.topic=topic;return events;
}
export function auction(players,bids,market){
 const messages=[];
 for(let i=0;i<market.length;i++){const valid=bids.map((b,p)=>({...b,p})).filter(b=>b.tile===i&&Number.isInteger(b.amount)&&b.amount>=1&&b.amount<=players[b.p].credits&&!players[b.p].tiles.some(t=>t.id===market[i].id)&&Number.isInteger(b.slot)&&b.slot>=0&&b.slot<3&&(!(market[i].id==='focus')||typeof b.topic==='string'));
 if(!valid.length)continue;valid.sort((a,b)=>b.amount-a.amount);
 if(valid[1]?.amount===valid[0].amount){messages.push(`${market[i].name}: равенство — никой не плаща.`);continue;}
 const b=valid[0],p=players[b.p];p.credits-=b.amount;const tile={id:market[i].id,topic:b.topic,count:0};if(p.tiles.length<3)p.tiles.push(tile);else p.tiles[b.slot]=tile;messages.push(`${p.name} купи ${market[i].name} за ${b.amount} кредита.`);
 }return messages.length?messages:['Няма покупки в този рунд.'];
}
