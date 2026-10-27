// UI consumes the same request/snapshot boundary for local and remote sessions.
export class LocalTransport {
 constructor(session){this.session=session;this.listeners=new Set();}
 subscribe(fn){this.listeners.add(fn);fn(structuredClone(this.session.state));return()=>this.listeners.delete(fn);}
 send(command){const state=this.session.dispatch(command);this.listeners.forEach(fn=>fn(state));}
 close(){this.listeners.clear();}
}
// Wire an already negotiated WebRTC data channel. Signaling stays external.
export class PeerTransport {
 constructor(channel){this.channel=channel;this.listeners=new Set();channel.addEventListener('message',event=>{try{const msg=JSON.parse(event.data);if(msg.v===1&&msg.type==='snapshot')this.listeners.forEach(fn=>fn(msg.state));}catch{/* Ignore malformed envelopes. */}});}
 subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);}
 send(command){if(this.channel.readyState!=='open')throw Error('Peer connection is not open');this.channel.send(JSON.stringify({v:1,type:'command',command}));}
 close(){this.listeners.clear();this.channel.close();}
}
