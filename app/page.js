"use client";
import {useEffect,useState} from "react";
import {createSupabaseClient} from "../lib/supabase";
const supabase=createSupabaseClient();

const formations={
 "4-3-3":["GK","LB","CB","CB","RB","CM","DM","CM","LW","ST","RW"],
 "4-2-3-1":["GK","LB","CB","CB","RB","DM","DM","LW","AM","RW","ST"],
 "4-4-2":["GK","LB","CB","CB","RB","LM","CM","CM","RM","ST","ST"],
 "3-4-3":["GK","CB","CB","CB","LM","CM","CM","RM","LW","ST","RW"]
};

export default function Page(){
 const[session,setSession]=useState(null),[club,setClub]=useState(null),[screen,setScreen]=useState("loading"),[error,setError]=useState("");
 useEffect(()=>{
   supabase.auth.getSession().then(({data})=>{setSession(data.session);setScreen(data.session?"checking":"auth")});
   const {data}=supabase.auth.onAuthStateChange((_event,s)=>{setSession(s);setScreen(s?"checking":"auth")});
   return()=>data.subscription.unsubscribe();
 },[]);
 useEffect(()=>{if(session?.user)loadClub()},[session]);
 async function loadClub(){
   const {data,error}=await supabase.from("clubs").select("*").eq("user_id",session.user.id).maybeSingle();
   if(error){setError(error.message);setScreen("error")} else {setClub(data);setScreen(data?"dashboard":"create")}
 }
 if(screen==="loading"||screen==="checking")return <Shell><div className="loading"><Logo/><h2>MEMUAT ROMGOL88</h2></div></Shell>;
 if(screen==="error")return <Shell><div className="panel center"><Logo/><h2>DATABASE ERROR</h2><p>{error}</p><p className="muted">Pastikan Environment Variables Vercel dan SQL Supabase sudah benar.</p></div></Shell>;
 if(screen==="auth")return <Auth/>;
 if(screen==="create")return <CreateClub user={session.user} done={c=>{setClub(c);setScreen("dashboard")}}/>;
 return <Dashboard club={club} logout={async()=>{await supabase.auth.signOut();setClub(null)}}/>;
}

function Auth(){
 const[email,setEmail]=useState(""),[password,setPassword]=useState(""),[register,setRegister]=useState(false),[msg,setMsg]=useState(""),[busy,setBusy]=useState(false);
 async function submit(e){
   e.preventDefault();setBusy(true);setMsg("");
   const result=register?await supabase.auth.signUp({email,password}):await supabase.auth.signInWithPassword({email,password});
   if(result.error)setMsg(result.error.message);
   else if(register)setMsg("Akun berhasil dibuat. Jika konfirmasi email aktif, cek email kamu.");
   setBusy(false);
 }
 return <Shell><div className="authGrid"><div className="heroBlock"><Logo big/><span className="eyebrow">ONLINE FOOTBALL MANAGER</span><h1>ROMGOL88</h1><p>Bangun klub. Atur skuad. Tentukan taktik.</p></div><form className="panel authCard" onSubmit={submit}><div className="panelHead"><h2>{register?"CREATE ACCOUNT":"WELCOME BACK"}</h2><span>STAGE 05</span></div><label>EMAIL<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>PASSWORD<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength="6" required/></label>{msg&&<div className="message">{msg}</div>}<button className="primary" disabled={busy}>{busy?"PROCESSING...":register?"CREATE ACCOUNT":"LOGIN"}</button><button type="button" className="linkButton" onClick={()=>setRegister(!register)}>{register?"Sudah punya akun? Login":"Belum punya akun? Register"}</button></form></div></Shell>
}

function CreateClub({user,done}){
 const[name,setName]=useState(""),[city,setCity]=useState("Jakarta"),[stadium,setStadium]=useState("ROMGOL88 Arena"),[error,setError]=useState("");
 async function submit(e){
   e.preventDefault();setError("");
   const {data,error}=await supabase.from("clubs").insert({user_id:user.id,name:name.trim(),city,stadium,cash:126500000,coins:2450,rating:70}).select().single();
   if(error)setError(error.message);else done(data);
 }
 return <Shell><div className="narrow"><div className="panel"><div className="panelHead"><h2>CREATE YOUR CLUB</h2></div><p className="muted">Klub baru akan mendapat skuad awal setelah SQL Stage 03 dijalankan.</p><form onSubmit={submit}><label>CLUB NAME<input value={name} onChange={e=>setName(e.target.value)} placeholder="ROMGOL88 FC" required/></label><label>CITY<input value={city} onChange={e=>setCity(e.target.value)} required/></label><label>STADIUM<input value={stadium} onChange={e=>setStadium(e.target.value)} required/></label>{error&&<div className="message">{error}</div>}<button className="primary">CREATE CLUB →</button></form></div></div></Shell>
}

function Dashboard({club,logout}){
 const[tab,setTab]=useState("squad"),[rows,setRows]=useState([]),[selected,setSelected]=useState(null),[formation,setFormation]=useState("4-3-3"),[loading,setLoading]=useState(true),[notice,setNotice]=useState("");
 useEffect(()=>{loadSquad()},[]);
 async function loadSquad(){setLoading(true);const{data,error}=await supabase.from("club_squad").select("id,shirt_number,role,formation_slot,fitness,morale,player:players(*)").eq("club_id",club.id).order("shirt_number");if(error)setNotice(error.message);else setRows(data||[]);setLoading(false)}
 async function changeRole(row,role){const {error}=await supabase.from("club_squad").update({role}).eq("id",row.id);if(error)setNotice(error.message);else await loadSquad()}
 const starters=rows.filter(r=>r.role==="STARTER"),bench=rows.filter(r=>r.role==="BENCH");
 return <Shell><header className="topbar"><div className="brand"><Logo/><div><b>ROMGOL88</b><small>FOOTBALL MANAGER</small></div></div><div className="wallet"><span>🪙 {Number(club.coins).toLocaleString("id-ID")}</span><span>Rp {(Number(club.cash)/1000000).toFixed(1)} M</span><button onClick={logout}>LOGOUT</button></div></header><nav className="nav">{["squad","tactics","training","transfers","fixtures"].map(x=><button key={x} className={tab===x?"active":""} onClick={()=>setTab(x)}>{x.toUpperCase()}</button>)}</nav><section className="clubHero"><div><span className="eyebrow">SEASON 2026/27</span><h1>{club.name}</h1><p>{club.city} • {club.stadium}</p></div><div className="rating"><small>TEAM RATING</small><strong>{club.rating}</strong><span>/100</span></div></section>{notice&&<div className="notice">{notice}</div>}{tab==="squad"&&<Squad rows={rows} starters={starters} bench={bench} loading={loading} selected={selected} setSelected={setSelected} changeRole={changeRole}/>} {tab==="tactics"&&<Tactics rows={starters} formation={formation} setFormation={setFormation}/>} {tab==="transfers"&&<TransferMarket club={club}/>}
{tab==="fixtures"&&<MatchEngine club={club}/>} {tab!=="squad"&&tab!=="tactics"&&tab!=="transfers"&&tab!=="fixtures"&&<Coming title={tab}/>}<footer>ROMGOL88 • STAGE 05 • MATCH ENGINE</footer></Shell>
}

function Squad({starters,bench,loading,selected,setSelected,changeRole}){
 return <section className="grid2"><PlayerList title="STARTING XI" rows={starters} selected={selected} setSelected={setSelected} action={r=>changeRole(r,"BENCH")} actionLabel="BENCH" loading={loading}/><PlayerList title="BENCH" rows={bench} selected={selected} setSelected={setSelected} action={r=>changeRole(r,"STARTER")} actionLabel="START"/><div className="panel details">{selected?<PlayerDetail row={selected}/>:<><h2>PLAYER DETAILS</h2><p className="muted">Klik pemain untuk melihat atribut.</p></>}</div></section>
}
function PlayerList({title,rows,selected,setSelected,action,actionLabel,loading}){
 return <div className="panel"><div className="panelHead"><h2>{title}</h2><span>{rows.length}</span></div>{loading?<p>Loading squad...</p>:rows.length===0?<p className="muted">Belum ada pemain. Jalankan SQL Stage 03.</p>:rows.map(r=><div key={r.id} className={"playerRow "+(selected?.id===r.id?"selected":"")} onClick={()=>setSelected(r)}><span className="shirt">{r.shirt_number||"—"}</span><div><b>{r.player.name}</b><small>{r.player.position} • {r.player.age} tahun</small></div><strong>{r.player.overall}</strong><button onClick={e=>{e.stopPropagation();action(r)}}>{actionLabel}</button></div>)}</div>
}
function PlayerDetail({row}){
 const p=row.player;
 return <><div className="detailHead"><div className="avatar">{p.position}</div><div><h2>{p.name}</h2><p>{p.position} • {p.age} tahun • Nilai Rp {(Number(p.market_value)/1000000).toFixed(1)} M</p></div></div>{[["PACE",p.pace],["SHOOTING",p.shooting],["PASSING",p.passing],["DEFENDING",p.defending],["PHYSICAL",p.physical]].map(([n,v])=><div className="attribute" key={n}><span>{n}</span><b>{v}</b><i><em style={{width:v+"%"}}/></i></div>)}</>
}
function Tactics({rows,formation,setFormation}){
 const slots=formations[formation];
 return <section className="tacticsGrid"><div className="panel"><div className="panelHead"><h2>TACTICAL BOARD</h2><select value={formation} onChange={e=>setFormation(e.target.value)}>{Object.keys(formations).map(f=><option key={f}>{f}</option>)}</select></div><div className="pitch">{slots.map((pos,i)=>{const r=rows.find(x=>x.formation_slot===pos)||rows[i];return <div className="token" key={i}><span>{r?.player.position||"?"}</span><b>{r?.player.name?.split(" ")[0]||pos}</b><small>{r?.player.overall||"—"}</small></div>})}</div></div><div className="panel"><h2>{formation}</h2><p className="muted">Formasi tersedia: 4-3-3, 4-2-3-1, 4-4-2, 3-4-3.</p><p className="muted">Drag & drop posisi manual akan masuk pada tahap berikutnya.</p></div></section>
}

function TransferMarket({club}){
 const[players,setPlayers]=useState([]),[q,setQ]=useState(""),[pos,setPos]=useState("ALL"),[busy,setBusy]=useState(null),[msg,setMsg]=useState("");
 useEffect(()=>{load()},[]);
 async function load(){const{data,error}=await supabase.from("players").select("*").eq("club_status","MARKET").order("overall",{ascending:false});if(error)setMsg(error.message);else setPlayers(data||[])}
 const shown=players.filter(p=>(pos==="ALL"||p.position===pos)&&p.name.toLowerCase().includes(q.toLowerCase()));
 async function buy(p){
  if(busy)return;setBusy(p.id);setMsg("");
  if(Number(club.cash)<Number(p.market_value)){setMsg("Saldo tidak cukup.");setBusy(null);return}
  const{data:squad}=await supabase.from("club_squad").select("id").eq("club_id",club.id);
  if((squad||[]).length>=25){setMsg("Skuad sudah mencapai 25 pemain.");setBusy(null);return}
  const a=await supabase.from("transfers").insert({club_id:club.id,player_id:p.id,fee:p.market_value});
  if(a.error){setMsg(a.error.message);setBusy(null);return}
  const b=await supabase.from("club_squad").insert({club_id:club.id,player_id:p.id,role:"BENCH"});
  if(b.error){setMsg(b.error.message);setBusy(null);return}
  const c=await supabase.from("clubs").update({cash:Number(club.cash)-Number(p.market_value)}).eq("id",club.id);
  if(c.error){setMsg(c.error.message);setBusy(null);return}
  await supabase.from("players").update({club_status:"OWNED"}).eq("id",p.id);
  setMsg(p.name+" berhasil dibeli.");setPlayers(x=>x.filter(y=>y.id!==p.id));setBusy(null);
 }
 const positions=["ALL","GK","LB","CB","RB","DM","CM","AM","LM","RM","LW","RW","ST"];
 return <section className="market"><div className="marketTop"><div><span className="eyebrow">TRANSFER MARKET</span><h2>SCOUT & SIGN</h2><p className="muted">Database pemain ROMGOL88.</p></div><div className="marketCash"><small>BUDGET</small><b>Rp {(Number(club.cash)/1000000).toFixed(1)} M</b></div></div><div className="filters"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search player..."/><select value={pos} onChange={e=>setPos(e.target.value)}>{positions.map(x=><option key={x}>{x}</option>)}</select></div>{msg&&<div className="notice">{msg}</div>}<div className="marketGrid">{shown.map(p=><div className="marketCard" key={p.id}><div className="marketRating">{p.overall}</div><div className="marketInfo"><h3>{p.name}</h3><p>{p.position} • {p.age} years</p><div className="miniStats"><span>PAC <b>{p.pace}</b></span><span>SHO <b>{p.shooting}</b></span><span>PAS <b>{p.passing}</b></span><span>DEF <b>{p.defending}</b></span></div><strong>Rp {(Number(p.market_value)/1000000).toFixed(1)} M</strong></div><button className="primary buy" onClick={()=>buy(p)} disabled={busy===p.id}>{busy===p.id?"BUYING...":"BUY PLAYER"}</button></div>)}</div></section>
}

function MatchEngine({club}){
 const[opponent,setOpponent]=useState(null),[rows,setRows]=useState([]),[history,setHistory]=useState([]),[busy,setBusy]=useState(false),[result,setResult]=useState(null),[msg,setMsg]=useState("");
 const opponents=[
  ["Jakarta United",68],["Bandung Athletic",72],["Surabaya City",75],["Bali Nusantara",77],
  ["Makassar FC",70],["Medan Warriors",66],["Persita Metro",73],["Garuda Selatan",80]
 ];
 useEffect(()=>{load()},[]);
 async function load(){
  const [a,b]=await Promise.all([
   supabase.from("club_squad").select("id,role,fitness,morale,player:players(*)").eq("club_id",club.id).eq("role","STARTER"),
   supabase.from("matches").select("*").eq("club_id",club.id).order("played_at",{ascending:false}).limit(8)
  ]);
  if(a.error)setMsg(a.error.message); else setRows(a.data||[]);
  if(!b.error)setHistory(b.data||[]);
  pickOpponent();
 }
 function pickOpponent(){
  const pool=opponents.filter(x=>x[0]!==club.name);
  const x=pool[Math.floor(Math.random()*pool.length)];
  setOpponent({name:x[0],rating:Math.max(55,Math.min(88,x[1]+Math.floor(Math.random()*7)-3))});
 }
 function simulate(){
  if(busy||!opponent)return;
  if(rows.length<11){setMsg("Starting XI belum lengkap. Atur 11 pemain sebagai STARTER terlebih dahulu.");return}
  setBusy(true);setMsg("");
  const teamPower=rows.reduce((a,r)=>a+Number(r.player.overall||60),0)/rows.length;
  const fitness=rows.reduce((a,r)=>a+Number(r.fitness||100),0)/rows.length;
  const morale=rows.reduce((a,r)=>a+Number(r.morale||75),0)/rows.length;
  const homeAdv=3;
  const strength=teamPower+(fitness-75)*0.08+(morale-70)*0.05+homeAdv;
  const diff=strength-opponent.rating;
  const base=Math.max(0.15,Math.min(0.78,0.42+diff*0.025));
  const roll=Math.random();
  let gf,ga;
  if(roll<base-0.12){gf=2+Math.floor(Math.random()*3);ga=Math.floor(Math.random()*2)}
  else if(roll<base+0.18){gf=1+Math.floor(Math.random()*2);ga=1+Math.floor(Math.random()*2)}
  else {gf=Math.floor(Math.random()*2);ga=1+Math.floor(Math.random()*2)}
  if(diff>10&&Math.random()<.35)gf++;
  if(diff<-10&&Math.random()<.35)ga++;
  const shots=8+Math.floor(Math.random()*11)+Math.max(0,Math.round(diff/3));
  const onTarget=Math.max(gf,Math.min(shots-1,3+Math.floor(Math.random()*6)));
  const possession=Math.max(32,Math.min(68,50+Math.round(diff*0.65)+Math.floor(Math.random()*7)-3));
  const cards=Math.floor(Math.random()*5);
  const status=gf>ga?"WIN":gf===ga?"DRAW":"LOSS";
  const prize=status==="WIN"?3500000:status==="DRAW"?1500000:500000;
  const coinPrize=status==="WIN"?80:status==="DRAW"?40:20;
  const match={club_id:club.id,opponent_name:opponent.name,opponent_rating:opponent.rating,club_score:gf,opponent_score:ga,result:status,shots,shots_on_target:onTarget,possession,cards,reward_cash:prize,reward_coins:coinPrize};
  saveMatch(match,status,prize,coinPrize);
 }
 async function saveMatch(match,status,prize,coinPrize){
  const ins=await supabase.from("matches").insert(match).select().single();
  if(ins.error){setMsg(ins.error.message);setBusy(false);return}
  const newCash=Number(club.cash)+prize, newCoins=Number(club.coins)+coinPrize;
  const up=await supabase.from("clubs").update({cash:newCash,coins:newCoins}).eq("id",club.id);
  if(up.error){setMsg(up.error.message);setBusy(false);return}
  setResult(match);setHistory(h=>[ins.data,...h].slice(0,8));setBusy(false);
  setOpponent(null);setTimeout(pickOpponent,100);
 }
 return <section className="matchPage">
  <div className="matchHero panel"><div><span className="eyebrow">MATCH ENGINE • 90 MINUTES</span><h2>FIXTURE DAY</h2><p className="muted">Simulasi pertandingan berdasarkan rating, fitness, morale, dan home advantage.</p></div>
   <div className="matchReward"><small>WIN REWARD</small><b>Rp 3.5 M + 80 🪙</b></div></div>
  {!result?<div className="matchGrid"><div className="panel matchCardLarge"><div className="matchTeams"><div><span className="clubBadge">R88</span><h2>{club.name}</h2><b>Rating {club.rating}</b></div><div className="vs">VS</div><div><span className="clubBadge opp">AI</span><h2>{opponent?.name||"..."}</h2><b>Rating {opponent?.rating||"—"}</b></div></div><div className="matchInfoLine"><span>HOME</span><strong>90 MIN</strong><span>AI OPPONENT</span></div><button className="primary playButton" disabled={busy||!opponent} onClick={simulate}>{busy?"SIMULATING...":"PLAY MATCH →"}</button>{msg&&<div className="notice">{msg}</div>}</div>
  <div className="panel"><div className="panelHead"><h2>YOUR XI</h2><span>{rows.length}/11</span></div>{rows.map(r=><div className="matchPlayer" key={r.id}><b>{r.player.name}</b><span>{r.player.position}</span><strong>{r.player.overall}</strong></div>)}</div></div>
  :<MatchResult result={result} club={club} onAgain={()=>{setResult(null);setMsg("");pickOpponent()}}/>}
  <div className="panel history"><div className="panelHead"><h2>RECENT RESULTS</h2><span>{history.length}</span></div>{history.length===0?<p className="muted">Belum ada pertandingan.</p>:history.map(m=><div className="historyRow" key={m.id}><span>{new Date(m.played_at).toLocaleDateString("id-ID")}</span><b>{m.result}</b><strong>{m.club_score} - {m.opponent_score}</strong><span>{m.opponent_name}</span><small>{m.shots} shots • {m.possession}% poss.</small></div>)}</div>
 </section>
}
function MatchResult({result,club,onAgain}){
 const tone=result.result==="WIN"?"win":result.result==="LOSS"?"loss":"draw";
 return <div className="resultBox panel"><span className={"resultTag "+tone}>{result.result}</span><h2>{club.name} <strong>{result.club_score} — {result.opponent_score}</strong> {result.opponent_name}</h2><div className="resultStats"><div><small>POSSESSION</small><b>{result.possession}%</b></div><div><small>SHOTS</small><b>{result.shots}</b></div><div><small>ON TARGET</small><b>{result.shots_on_target}</b></div><div><small>CARDS</small><b>{result.cards}</b></div><div><small>REWARD</small><b>Rp {(Number(result.reward_cash)/1000000).toFixed(1)} M</b></div></div><p className="muted">Match engine menyimpan hasil pertandingan ke database dan menambahkan reward ke klub.</p><button className="primary" onClick={onAgain}>PLAY ANOTHER MATCH</button></div>
}

function Training({club}){
 const[players,setPlayers]=useState([]),[history,setHistory]=useState([]),[selected,setSelected]=useState(""),[drill,setDrill]=useState("FINISHING"),[busy,setBusy]=useState(false),[msg,setMsg]=useState("");
 const drills={FINISHING:{label:"Finishing",attr:"shooting",xp:10,energy:10},PASSING:{label:"Passing",attr:"passing",xp:10,energy:10},DEFENDING:{label:"Defending",attr:"defending",xp:10,energy:10},FITNESS:{label:"Fitness",attr:"physical",xp:10,energy:10},GOALKEEPING:{label:"Goalkeeping",attr:"defending",xp:10,energy:10}};
 async function load(){
  const r=await supabase.from("club_squad").select("id,player_id,players(*)").eq("club_id",club.id);
  if(r.error){setMsg(r.error.message);return}
  setPlayers((r.data||[]).map(x=>({...x.players,squad_id:x.id})));
  const h=await supabase.from("training_history").select("*").eq("club_id",club.id).order("created_at",{ascending:false}).limit(10);
  if(!h.error)setHistory(h.data||[]);
 }
 useEffect(()=>{load()},[]);
 async function train(){
  if(!selected||busy)return; const p=players.find(x=>x.id===selected),d=drills[drill]; if(!p)return;
  setBusy(true);setMsg(""); const energy=Number(p.energy??100);
  if(energy<d.energy){setMsg("Energy pemain tidak cukup.");setBusy(false);return}
  const xp=Number(p.training_xp??0)+d.xp, up=xp>=100, nextXp=up?xp-100:xp;
  const updates={energy:Math.max(0,energy-d.energy),training_xp:nextXp,overall:Math.min(99,Number(p.overall)+(up?1:0))};
  updates[d.attr]=Math.min(99,Number(p[d.attr]??0)+(up?1:0));
  const a=await supabase.from("players").update(updates).eq("id",p.id);
  if(a.error){setMsg(a.error.message);setBusy(false);return}
  const b=await supabase.from("training_history").insert({club_id:club.id,player_id:p.id,drill:d.label,xp_gained:d.xp,energy_used:d.energy,attribute:d.attr,attribute_gain:up?1:0});
  if(b.error){setMsg(b.error.message);setBusy(false);return}
  setMsg(`${p.name}: ${d.label} selesai. +${d.xp} XP${up?" • LEVEL UP +1":""}`); await load(); setBusy(false);
 }
 const positions=Object.entries(drills);
 return <section className="training"><div className="trainingHead"><div><span className="eyebrow">TRAINING CENTER</span><h2>DEVELOP YOUR SQUAD</h2><p className="muted">Latih pemain dan kembangkan atribut.</p></div><div className="trainingRule"><b>+10 XP</b><span>per session</span></div></div>
 <div className="trainingLayout"><div className="panel trainingPlayers"><h3>SELECT PLAYER</h3>{players.map(p=><button className={"playerPick "+(selected===p.id?"active":"")} key={p.id} onClick={()=>setSelected(p.id)}><span className="pickRating">{p.overall}</span><span><b>{p.name}</b><small>{p.position} • Energy {p.energy??100}</small></span></button>)}</div>
 <div className="panel trainingDrill"><h3>TRAINING DRILL</h3><div className="drillGrid">{positions.map(([k,d])=><button key={k} className={"drill "+(drill===k?"active":"")} onClick={()=>setDrill(k)}><b>{d.label}</b><small>+{d.xp} XP • -{d.energy} Energy</small></button>)}</div>
 <div className="selectedBox">{selected?(()=>{const p=players.find(x=>x.id===selected);return <><b>{p?.name}</b><span>XP {p?.training_xp??0}/100</span></>} )():<span>Pilih pemain terlebih dahulu</span>}</div>
 <button className="primary trainButton" disabled={!selected||busy} onClick={train}>{busy?"TRAINING...":"START TRAINING"}</button>{msg&&<div className="notice">{msg}</div>}</div></div>
 <div className="panel history"><h3>RECENT TRAINING</h3>{history.length?<div className="historyRows">{history.map(h=><div className="historyRow" key={h.id}><b>{h.drill}</b><span>+{h.xp_gained} XP</span><span>-{h.energy_used} Energy</span><span>{new Date(h.created_at).toLocaleString()}</span></div>)}</div>:<p className="muted">Belum ada riwayat training.</p>}</div></section>
}
function Coming({title}){return <div className="panel coming"><span className="eyebrow">NEXT BUILD</span><h2>{title.toUpperCase()}</h2><p>Modul ini akan dibangun setelah Squad + Tactics.</p></div>}
function Shell({children}){return <main className="shell">{children}</main>}
function Logo({big=false}){return <div className={"logo "+(big?"big":"")}>R88</div>}
