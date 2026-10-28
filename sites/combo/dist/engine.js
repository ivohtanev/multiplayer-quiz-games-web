import {questions} from './questions.js';
import {tiles,score,auction} from './combo.js';
export class GameSession {
 constructor(){this.reset();}
 reset(){this.state={round:1,phase:'ready',players:[{name:'Играч 1',score:0,credits:3,tiles:[]},{name:'NOVA',score:0,credits:3,tiles:[]}],events:[],answers:[],market:[]};}
 dispatch(action){const s=this.state;
 if(action.type==='enter'&&s.phase==='ready'&&s.round===1){s.players[0].name=String(action.name||'').trim().slice(0,24)||'Играч 1';}
 else if(action.type==='start'&&s.phase==='ready'){s.phase='quiz';s.convert=!!action.convert;}
 else if(action.type==='answer'&&s.phase==='quiz'){const q=questions[s.round-1];const bot=Math.random()<.65?q.correct:(q.correct+1)%4;s.answers=[action.answer,bot];const before=s.players.map(p=>({score:p.score,credits:p.credits}));s.activated=[[],[]];s.events=s.players.map((p,i)=>score(p,s.answers[i]===q.correct,q.topic,s.round,i===0?s.convert:true,s.activated[i]));s.rewards=s.players.map((p,i)=>({points:p.score-before[i].score,credits:p.credits-before[i].credits}));s.phase='result';}
 else if(action.type==='continue'&&s.phase==='result'){if(s.round>6)this.advance();else{s.market=[0,1,2].map(i=>tiles[((s.round-1)*3+i)%tiles.length]);s.phase='market';}}
 else if(action.type==='bid'&&s.phase==='market'){const bot=s.players[1];const available=s.market.map((t,i)=>({t,i})).filter(({t})=>!bot.tiles.some(x=>x.id===t.id));const choice=available[Math.floor(Math.random()*available.length)];const bid=choice&&bot.credits?{tile:choice.i,amount:Math.min(bot.credits,1+Math.floor(Math.random()*4)),slot:Math.floor(Math.random()*3),topic:questions[s.round%8].topic}:{};s.bids=[action,bid];const balances=s.players.map(p=>p.credits);s.events=auction(s.players,s.bids,s.market);s.purchased=s.players.map((p,i)=>p.credits<balances[i]);s.phase='reveal';}
 else if(action.type==='continue'&&s.phase==='reveal')this.advance();
 return structuredClone(s);}
 advance(){if(this.state.round===8)this.state.phase='finished';else{this.state.round++;this.state.phase='ready';}}
}
