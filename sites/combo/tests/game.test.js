import test from 'node:test';import assert from 'node:assert/strict';import {score,auction,tiles} from '../dist/combo.js';import {GameSession} from '../dist/engine.js';
import {questions} from '../dist/questions.js';
const player=()=>({name:'Test',credits:3,score:0,tiles:[]});
test('quiz economy, saver uses pre-reward credits',()=>{const p=player();p.tiles=[{id:'saver'}];score(p,true,'Наука',1,false);assert.equal(p.score,1);assert.equal(p.credits,5);score(p,true,'Наука',2,false);assert.equal(p.score,3);});
test('tied bids charge nobody',()=>{const p=[player(),player()];auction(p,[{tile:0,amount:2,slot:0},{tile:0,amount:2,slot:0}],[tiles[0]]);assert.deepEqual(p.map(x=>x.credits),[3,3]);assert.equal(p[0].tiles.length,0);});
test('invalid bids and duplicate tiles cannot purchase',()=>{const p=[player(),player()];p[0].tiles=[{id:'streak'}];auction(p,[{tile:0,amount:1,slot:0},{tile:0,amount:99,slot:0}],[tiles[0]]);assert.equal(p[1].tiles.length,0);assert.equal(p[0].credits,3);});
test('winner pays and replaces exactly one slot',()=>{const p=[player(),player()];p[0].tiles=[{id:'reserve'},{id:'saver'},{id:'focus'}];auction(p,[{tile:0,amount:3,slot:1},{tile:0,amount:2,slot:0}],[tiles[0]]);assert.equal(p[0].credits,0);assert.equal(p[0].tiles[1].id,'streak');assert.equal(p[0].tiles.length,3);assert.equal(p[1].credits,3);});
test('streak resets, converter optional, final bonus',()=>{const p=player();p.tiles=[{id:'streak'},{id:'converter'},{id:'final'}];score(p,true,'Наука',6,false);score(p,true,'Наука',7,true);score(p,true,'Наука',8,false);assert.equal(p.score,7);assert.equal(p.credits,7);});
test('reserve comeback focus switch evaluate once',()=>{const p=player();p.tiles=[{id:'reserve'},{id:'comeback'},{id:'focus',topic:'Наука'}];score(p,false,'Култура',1,false);assert.equal(p.credits,5);score(p,true,'Наука',2,false);assert.equal(p.score,3);p.tiles=[{id:'switch'}];score(p,true,'Наука',3,false);assert.equal(p.score,4);score(p,true,'Култура',4,false);assert.equal(p.score,6);});
test('complete eight rounds, no market in final rounds, duplicate answer ignored',()=>{const game=new GameSession();for(let r=1;r<=8;r++){assert.equal(game.state.round,r);game.dispatch({type:'start'});game.dispatch({type:'answer',answer:null});const credits=game.state.players[0].credits;game.dispatch({type:'answer',answer:0});assert.equal(game.state.players[0].credits,credits);game.dispatch({type:'continue'});if(r<=6){assert.equal(game.state.phase,'market');game.dispatch({type:'bid'});game.dispatch({type:'continue'});}}assert.equal(game.state.phase,'finished');});

test('result rewards include tile bonuses and converter spending for each player',()=>{const game=new GameSession();game.state.players[0].tiles=[{id:'converter'},{id:'focus',topic:questions[0].topic}];game.state.players[1].tiles=[{id:'reserve'}];game.dispatch({type:'start',convert:true});const before=game.state.players.map(p=>({score:p.score,credits:p.credits}));const result=game.dispatch({type:'answer',answer:questions[0].correct});assert.equal(result.phase,'result');assert.deepEqual(result.rewards[0],{points:3,credits:0});result.players.forEach((p,i)=>{assert.deepEqual(result.rewards[i],{points:p.score-before[i].score,credits:p.credits-before[i].credits});});const rewards=structuredClone(result.rewards);game.dispatch({type:'answer',answer:1});assert.deepEqual(game.state.rewards,rewards);});

test('unanswered question has no points and preserves credit reward',()=>{const game=new GameSession();game.dispatch({type:'start'});const result=game.dispatch({type:'answer',answer:null});assert.equal(result.answers[0],null);assert.deepEqual(result.rewards[0],{points:0,credits:1});});

test('player name defaults and activated tiles match awarded bonuses',()=>{
 const game=new GameSession();
 game.dispatch({type:'enter',name:'   '});assert.equal(game.state.players[0].name,'Играч 1');
 game.dispatch({type:'enter',name:'  Иво  '});assert.equal(game.state.players[0].name,'Иво');
 game.state.players[0].tiles=[{id:'converter'},{id:'focus',topic:questions[0].topic},{id:'reserve'}];
 game.dispatch({type:'start',convert:true});
 const result=game.dispatch({type:'answer',answer:questions[0].correct});
 assert.deepEqual(result.activated[0],[{id:'converter',points:1,credits:-2},{id:'focus',points:1,credits:0}]);
});
