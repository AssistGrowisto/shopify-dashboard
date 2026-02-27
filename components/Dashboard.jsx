"use client";

import { useState } from "react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ComposedChart, Line, BarChart, Bar, Area,
} from "recharts";

var CL = { bg:"#0B0F1A", cd:"#131825", bd:"#1E2A42", gn:"#22C55E", rd:"#EF4444", am:"#F59E0B", tx:"#E2E8F0", mt:"#94A3B8", dm:"#64748B", gr:"#1E293B", cp:"#818CF8", nb:"#34D399", n4:"#F9A8D4", al:"#C4B5FD" };

// ═══ HELPERS ═══
function f$(v){return "$"+Math.round(v).toLocaleString();}
function avg(a,s,e){var sl=a.slice(s,e);return sl.length?sl.reduce(function(x,y){return x+y;},0)/sl.length:0;}
function pct(a,b){return b===0?0:((a-b)/b)*100;}
function rng(a){var v=a.filter(function(x){return x>0;});return v.length?{lo:Math.min.apply(null,v),hi:Math.max.apply(null,v)}:{lo:0,hi:1};}
function yoy(c,p){return p>0?parseFloat(((c-p)/p*100).toFixed(1)):0;}

function hBg(val,lo,hi,inv){
  if(!val||lo===hi)return"transparent";var t=(val-lo)/(hi-lo);if(inv)t=1-t;t=Math.max(0,Math.min(1,t));
  var r,g,b;if(t<0.25){var p=t/0.25;r=153+67*p;g=27+23*p;b=27+3*p;}
  else if(t<0.5){var p2=(t-0.25)/0.25;r=220-3*p2;g=50+69*p2;b=30-24*p2;}
  else if(t<0.75){var p3=(t-0.5)/0.25;r=217-116*p3;g=119+44*p3;b=6+7*p3;}
  else{var p4=(t-0.75)/0.25;r=101-79*p4;g=163;b=13+61*p4;}
  return"rgba("+Math.round(r)+","+Math.round(g)+","+Math.round(b)+",0.38)";
}
function hTx(val,lo,hi,inv){
  if(!val||lo===hi)return CL.mt;var t=(val-lo)/(hi-lo);if(inv)t=1-t;t=Math.max(0,Math.min(1,t));
  if(t<0.2)return"#FCA5A5";if(t<0.4)return"#FDBA74";if(t<0.6)return"#FDE68A";if(t<0.8)return"#BEF264";return"#86EFAC";
}

// ═══ UI COMPONENTS ═══
function Pill(p){return<span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"2px 7px",borderRadius:5,fontSize:10,fontWeight:600,background:p.color+"18",color:p.color}}>{p.children}</span>;}
function CB(p){return<div style={{background:CL.cd,border:"1px solid "+CL.bd,borderRadius:11,padding:16,marginBottom:12}}><div style={{fontSize:12,fontWeight:600,color:CL.tx,marginBottom:9}}>{p.title}</div><ResponsiveContainer width="100%" height={p.h||280}>{p.children}</ResponsiveContainer></div>;}
function Ins(p){var cc=p.type==="positive"?{bg:CL.gn+"10",b:CL.gn+"25",c:CL.gn}:p.type==="negative"?{bg:CL.rd+"10",b:CL.rd+"25",c:CL.rd}:{bg:CL.am+"10",b:CL.am+"25",c:CL.am};return<div style={{background:cc.bg,border:"1px solid "+cc.b,borderRadius:8,padding:"8px 12px",fontSize:11,color:CL.tx,lineHeight:1.5,display:"flex",gap:7,marginBottom:7}}><span style={{color:cc.c,flexShrink:0}}>{p.type==="positive"?"\u2726":"\u26A0"}</span><span>{p.children}</span></div>;}
function TT(p){if(!p.active||!p.payload||!p.payload.length)return null;return<div style={{background:"#1A2035",border:"1px solid "+CL.bd,borderRadius:6,padding:"7px 11px",maxWidth:280}}><div style={{fontSize:10,fontWeight:600,color:CL.tx,marginBottom:3}}>{p.label}</div>{p.payload.filter(function(x){return x.value!==0;}).map(function(x,i){var d=typeof x.value==="number"?(x.value>=500?"$"+x.value.toLocaleString():x.value<20?x.value.toFixed(2)+"%":x.value.toLocaleString()):String(x.value);return<div key={i} style={{display:"flex",alignItems:"center",gap:4,marginBottom:1}}><span style={{width:6,height:6,borderRadius:"50%",background:x.color||x.stroke}}/><span style={{fontSize:9,color:CL.mt}}>{x.name}:</span><span style={{fontSize:9,fontWeight:600,color:CL.tx}}>{d}</span></div>;})}</div>;}
function Leg(){return<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><span style={{fontSize:9,color:CL.dm}}>Low</span><div style={{height:8,flex:1,maxWidth:200,borderRadius:4,background:"linear-gradient(90deg, rgba(153,27,27,0.5), rgba(217,119,6,0.5), rgba(22,163,74,0.5))"}}/><span style={{fontSize:9,color:CL.dm}}>High</span></div>;}
var thS={padding:"6px",textAlign:"center",fontSize:8,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.04em",borderBottom:"2px solid "+CL.bd,position:"sticky",top:0,background:CL.cd,zIndex:1};
function HC(p){var bg=p.val?hBg(p.val,p.lo,p.hi,p.inv):"transparent";var tc=p.val?hTx(p.val,p.lo,p.hi,p.inv):CL.mt;return<td style={{padding:"5px 8px",textAlign:"center",fontSize:10,fontWeight:p.bold?700:600,color:tc,background:bg,borderBottom:"1px solid "+CL.bd+"20",borderLeft:p.val?"3px solid "+tc:"3px solid transparent"}}>{p.v}</td>;}
function YC(p){if(p.val===undefined||p.val===null)return<td style={{padding:"5px 6px",textAlign:"center",fontSize:10,borderBottom:"1px solid "+CL.bd+"20"}}/>;var bg=p.val>=0?"rgba(34,197,94,0.12)":"rgba(239,68,68,0.12)";return<td style={{padding:"5px 6px",textAlign:"center",fontSize:10,borderBottom:"1px solid "+CL.bd+"20",background:bg}}><Pill color={p.val>=0?CL.gn:CL.rd}>{p.val>=0?"+":""}{p.val}%</Pill></td>;}
function MonC(p){var inR1=p.i>=p.r1s&&p.i<=p.r1e;var inR2=p.i>=p.r2s&&p.i<=p.r2e;var bgc=inR2?CL.al+"10":inR1?CL.am+"10":"transparent";var tc=inR2?CL.al:inR1?CL.am:CL.tx;return<td style={{padding:"5px 6px",textAlign:"left",fontSize:10,fontWeight:600,color:tc,borderBottom:"1px solid "+CL.bd+"20",whiteSpace:"nowrap",background:bgc}}>{inR2?"\u25B8 ":inR1?"\u25C6 ":""}{p.m}</td>;}
function PlainTd(p){return<td style={{padding:"5px 6px",textAlign:"center",fontSize:10,color:CL.mt,borderBottom:"1px solid "+CL.bd+"20"}}>{p.children}</td>;}
function pLabel(MO,s,e){return(MO[s]||"?")+" - "+(MO[e]||"?");}
function MonthPicker(p){return<select style={{background:CL.bg,color:CL.tx,border:"1px solid "+CL.bd,borderRadius:5,padding:"4px 6px",fontSize:10,fontFamily:"inherit",cursor:"pointer",minWidth:70}} value={p.val} onChange={function(ev){p.onChange(parseInt(ev.target.value));}}>{p.months.map(function(m,i){return<option key={i} value={i} style={{background:CL.bg}}>{m}</option>;})}</select>;}

// ═══ STORE OVERVIEW ═══
function StoreOverview(p){
  var d=p.store,MO=p.months,ac=p.ac,nm=p.nm;
  var cd=MO.map(function(m,i){return{m:m,s:d.s[i]||0,sp:d.sp[i]||0,c:d.cv[i]||0};});
  var aS1=avg(d.s,p.r1s,p.r1e+1),aS2=avg(d.s,p.r2s,p.r2e+1);
  var aC1=avg(d.cv,p.r1s,p.r1e+1),aC2=avg(d.cv,p.r2s,p.r2e+1);
  var aA1=avg(d.av,p.r1s,p.r1e+1),aA2=avg(d.av,p.r2s,p.r2e+1);
  var aO1=avg(d.or,p.r1s,p.r1e+1),aO2=avg(d.or,p.r2s,p.r2e+1);
  var cards=[{l:"Sales/mo",v:f$(aS2),ch:pct(aS2,aS1)},{l:"Conv Rate",v:aC2.toFixed(2)+"%",ch:pct(aC2,aC1)},{l:"AOV",v:"$"+aA2.toFixed(2),ch:pct(aA2,aA1)},{l:"Orders/mo",v:Math.round(aO2).toString(),ch:pct(aO2,aO1)}];
  return<div>
    <div style={{marginBottom:12,marginTop:18}}><h2 style={{fontSize:15,fontWeight:700,color:CL.tx,margin:0}}>{nm} — Summary</h2><p style={{fontSize:11,color:CL.mt,margin:"2px 0 0"}}><span style={{color:CL.am}}>P1: {pLabel(MO,p.r1s,p.r1e)}</span> vs <span style={{color:ac}}>P2: {pLabel(MO,p.r2s,p.r2e)}</span></p></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:9,marginBottom:14}}>
      {cards.map(function(s,i){return<div key={i} style={{background:CL.cd,border:"1px solid "+CL.bd,borderRadius:11,padding:13}}><div style={{fontSize:9,color:CL.mt,fontWeight:600,textTransform:"uppercase",marginBottom:3}}>{s.l}</div><div style={{fontSize:18,fontWeight:700,color:CL.tx}}>{s.v}</div><Pill color={s.ch>=0?CL.gn:CL.rd}>{s.ch>=0?"\u25B2":"\u25BC"}{Math.abs(s.ch).toFixed(1)}%</Pill></div>;})}
    </div>
    <CB title="Net Sales" h={250}><ComposedChart data={cd}><CartesianGrid strokeDasharray="3 3" stroke={CL.gr}/><XAxis dataKey="m" tick={{fontSize:9,fill:CL.dm}}/><YAxis tick={{fontSize:9,fill:CL.dm}} tickFormatter={function(v){return "$"+(v/1000).toFixed(0)+"k";}}/><Tooltip content={TT}/><Area type="monotone" dataKey="s" fill={ac+"15"} stroke="none"/><Line type="monotone" dataKey="s" stroke={ac} strokeWidth={2.5} dot={{r:3,fill:ac}} name="Current"/><Line type="monotone" dataKey="sp" stroke={CL.am} strokeWidth={2} strokeDasharray="5 5" dot={{r:2,fill:CL.am}} name="Prior Year"/></ComposedChart></CB>
    <CB title="Conversion Rate" h={220}><ComposedChart data={cd}><CartesianGrid strokeDasharray="3 3" stroke={CL.gr}/><XAxis dataKey="m" tick={{fontSize:9,fill:CL.dm}}/><YAxis tick={{fontSize:9,fill:CL.dm}} tickFormatter={function(v){return v+"%";}}/><Tooltip content={TT}/><Line type="monotone" dataKey="c" stroke={ac} strokeWidth={2.5} dot={{r:3,fill:ac}} name="Conv%"/></ComposedChart></CB>
  </div>;
}

// ═══ STORE SALES HEATMAP ═══
function StoreSales(p){
  var d=p.store,MO=p.months,sR=rng(d.s);
  var cd=MO.map(function(m,i){return{m:m,s:d.s[i]||0,sp:d.sp[i]||0};});
  return<div>
    <CB title="Net Sales" h={280}><ComposedChart data={cd}><CartesianGrid strokeDasharray="3 3" stroke={CL.gr}/><XAxis dataKey="m" tick={{fontSize:9,fill:CL.dm}}/><YAxis tick={{fontSize:9,fill:CL.dm}} tickFormatter={function(v){return "$"+(v/1000).toFixed(0)+"k";}}/><Tooltip content={TT}/><Area type="monotone" dataKey="s" fill={p.ac+"15"} stroke="none"/><Line type="monotone" dataKey="s" stroke={p.ac} strokeWidth={2.5} dot={{r:3,fill:p.ac}} name="Current"/><Line type="monotone" dataKey="sp" stroke={CL.am} strokeWidth={2} strokeDasharray="5 5" dot={{r:2,fill:CL.am}} name="Prior Year"/></ComposedChart></CB>
    <div style={{background:CL.cd,border:"1px solid "+CL.bd,borderRadius:11,padding:14,marginBottom:12,overflowX:"auto"}}><div style={{fontSize:12,fontWeight:600,color:CL.tx,marginBottom:4}}>Monthly Heatmap</div><Leg/>
    <table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><th style={{...thS,textAlign:"left"}}>Month</th><th style={{...thS,color:p.ac}}>Net Sales</th><th style={thS}>Prior Year</th><th style={thS}>YoY%</th></tr></thead>
    <tbody>{MO.map(function(m,i){return<tr key={i}><MonC m={m} i={i} r1s={p.r1s} r1e={p.r1e} r2s={p.r2s} r2e={p.r2e}/><HC v={f$(d.s[i]||0)} val={d.s[i]} lo={sR.lo} hi={sR.hi}/><PlainTd>{f$(d.sp[i]||0)}</PlainTd><YC val={yoy(d.s[i]||0,d.sp[i]||0)}/></tr>;})}</tbody></table></div>
  </div>;
}

// ═══ STORE FUNNEL ═══
function StoreFunnel(p){
  var d=p.store,MO=p.months,r1s=p.r1s,r1e=p.r1e,r2s=p.r2s,r2e=p.r2e;
  var bSe=avg(d.se,r1s,r1e+1),aSe=avg(d.se,r2s,r2e+1);
  var bCa=avg(d.ca,r1s,r1e+1),aCa=avg(d.ca,r2s,r2e+1);
  var bRc=avg(d.rc,r1s,r1e+1),aRc=avg(d.rc,r2s,r2e+1);
  var bCk=avg(d.ck,r1s,r1e+1),aCk=avg(d.ck,r2s,r2e+1);
  var stages=["Sessions","Add to Cart","Reached Checkout","Completed"];
  var fB=[bSe,bCa,bRc,bCk],fA=[aSe,aCa,aRc,aCk];
  var stgCol=[CL.dm,CL.am,"#3B82F6",CL.gn];
  return<div>
    <div style={{marginBottom:12,marginTop:18}}><h2 style={{fontSize:15,fontWeight:700,color:CL.tx,margin:0}}>Conversion Funnel</h2><p style={{fontSize:11,color:CL.mt,margin:"2px 0 0"}}><span style={{color:CL.am}}>P1: {pLabel(MO,r1s,r1e)}</span> vs <span style={{color:p.ac}}>P2: {pLabel(MO,r2s,r2e)}</span></p></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
      {[{label:"Period 1",data:fB,col:CL.am},{label:"Period 2",data:fA,col:p.ac}].map(function(per,pi){
        var top=per.data[0];
        return<div key={pi} style={{background:CL.cd,border:"1px solid "+CL.bd,borderRadius:11,padding:14}}>
          <div style={{fontSize:11,fontWeight:700,color:per.col,marginBottom:10}}>{per.label}</div>
          {stages.map(function(st,si){var val=Math.round(per.data[si]);var pctT=top>0?(val/top*100):0;var barW=Math.max(pctT,2);var dropP=si>0&&per.data[si-1]>0?((per.data[si-1]-val)/per.data[si-1]*100).toFixed(1):null;
            return<div key={si} style={{marginBottom:si<3?2:0}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}><span style={{fontSize:9,color:CL.mt,fontWeight:600}}>{st}</span><span style={{fontSize:10,fontWeight:700,color:CL.tx}}>{val.toLocaleString()} <span style={{fontSize:8,color:CL.dm}}>({pctT.toFixed(1)}%)</span></span></div><div style={{height:18,background:CL.bg,borderRadius:4,overflow:"hidden",marginBottom:1}}><div style={{height:"100%",width:barW+"%",background:stgCol[si],borderRadius:4}}/></div>{dropP&&<div style={{textAlign:"center",fontSize:8,color:CL.rd,fontWeight:600,padding:"1px 0"}}>{"\u25BC"} {dropP}% drop</div>}</div>;})}
        </div>;})}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:9,marginBottom:14}}>
      {[{l:"Sess \u2192 Cart",b:bSe>0?bCa/bSe*100:0,a:aSe>0?aCa/aSe*100:0},{l:"Cart \u2192 Chk",b:bCa>0?bRc/bCa*100:0,a:aCa>0?aRc/aCa*100:0},{l:"Chk \u2192 Complete",b:bRc>0?bCk/bRc*100:0,a:aRc>0?aCk/aRc*100:0},{l:"Overall",b:bSe>0?bCk/bSe*100:0,a:aSe>0?aCk/aSe*100:0}].map(function(m,i){var ch=m.b>0?pct(m.a,m.b):0;return<div key={i} style={{background:CL.cd,border:"1px solid "+CL.bd,borderRadius:11,padding:13}}><div style={{fontSize:9,color:CL.mt,fontWeight:600,textTransform:"uppercase",marginBottom:3}}>{m.l}</div><div style={{fontSize:16,fontWeight:700,color:CL.tx}}>{m.a.toFixed(1)}%</div><div style={{fontSize:9,color:CL.dm}}>was {m.b.toFixed(1)}%</div>{m.b>0&&<Pill color={ch>=0?CL.gn:CL.rd}>{ch>=0?"\u25B2":"\u25BC"}{Math.abs(ch).toFixed(1)}%</Pill>}</div>;})}
    </div>
  </div>;
}

// ═══ ALL STORES FUNNEL (multi-store view) ═══
function AllFunnel(p){
  var DS=p.DS,MO=p.months,r1s=p.r1s,r1e=p.r1e,r2s=p.r2s,r2e=p.r2e;

  // Combined totals for funnel panels (sum across months in each period, not average)
  function sumR(arr,s,e){var t=0;for(var i=s;i<=e;i++)t+=(arr[i]||0);return t;}
  var stores=[
    {k:"cp",n:"ColorProof",c:CL.cp,d:DS.cp},
    {k:"nb",n:"NeumaBeauty",c:CL.nb,d:DS.nb},
    {k:"n4",n:"Number 4",c:CL.n4,d:DS.n4}
  ];

  // Combined funnel data
  var cSe1=0,cCa1=0,cRc1=0,cCk1=0,cSe2=0,cCa2=0,cRc2=0,cCk2=0;
  stores.forEach(function(st){
    cSe1+=sumR(st.d.se,r1s,r1e);cCa1+=sumR(st.d.ca,r1s,r1e);cRc1+=sumR(st.d.rc,r1s,r1e);cCk1+=sumR(st.d.ck,r1s,r1e);
    cSe2+=sumR(st.d.se,r2s,r2e);cCa2+=sumR(st.d.ca,r2s,r2e);cRc2+=sumR(st.d.rc,r2s,r2e);cCk2+=sumR(st.d.ck,r2s,r2e);
  });

  var stages=["Sessions","Add to Cart","Reached Checkout","Completed"];
  var stgCol=[CL.dm,CL.am,"#3B82F6",CL.gn];
  var fP1=[cSe1,cCa1,cRc1,cCk1],fP2=[cSe2,cCa2,cRc2,cCk2];

  // Per-store pass-through rates for the table
  function ptr(d){
    var se1=sumR(d.se,r1s,r1e),ca1=sumR(d.ca,r1s,r1e),rc1=sumR(d.rc,r1s,r1e),ck1=sumR(d.ck,r1s,r1e);
    var se2=sumR(d.se,r2s,r2e),ca2=sumR(d.ca,r2s,r2e),rc2=sumR(d.rc,r2s,r2e),ck2=sumR(d.ck,r2s,r2e);
    return[
      {l:"Sess \u2192 Cart",p1:se1>0?ca1/se1*100:0,p2:se2>0?ca2/se2*100:0},
      {l:"Cart \u2192 Chk",p1:ca1>0?rc1/ca1*100:0,p2:ca2>0?rc2/ca2*100:0},
      {l:"Chk \u2192 Complete",p1:rc1>0?ck1/rc1*100:0,p2:rc2>0?ck2/rc2*100:0},
      {l:"Overall",p1:se1>0?ck1/se1*100:0,p2:se2>0?ck2/se2*100:0}
    ];
  }
  var storeRates=stores.map(function(st){return{n:st.n,c:st.c,rates:ptr(st.d)};});
  // Combined rates
  var combRates=[
    {l:"Sess \u2192 Cart",p1:cSe1>0?cCa1/cSe1*100:0,p2:cSe2>0?cCa2/cSe2*100:0},
    {l:"Cart \u2192 Chk",p1:cCa1>0?cRc1/cCa1*100:0,p2:cCa2>0?cRc2/cCa2*100:0},
    {l:"Chk \u2192 Complete",p1:cRc1>0?cCk1/cRc1*100:0,p2:cRc2>0?cCk2/cRc2*100:0},
    {l:"Overall",p1:cSe1>0?cCk1/cSe1*100:0,p2:cSe2>0?cCk2/cSe2*100:0}
  ];

  function DeltaPill(p1,p2){var ch=p1>0?((p2-p1)/p1*100):0;var col=ch>=0?CL.gn:CL.rd;return<td style={{padding:"5px 4px",textAlign:"center",fontSize:10,borderBottom:"1px solid "+CL.bd+"20",background:ch>=0?"rgba(34,197,94,0.12)":"rgba(239,68,68,0.12)"}}><Pill color={col}>{ch>=0?"+":""}{ch.toFixed(1)}%</Pill></td>;}

  return<div>
    <div style={{marginBottom:12,marginTop:18}}><h2 style={{fontSize:15,fontWeight:700,color:CL.tx,margin:0}}>Conversion Funnel — All Stores</h2><p style={{fontSize:11,color:CL.mt,margin:"2px 0 0"}}><span style={{color:CL.am}}>P1: {pLabel(MO,r1s,r1e)}</span> vs <span style={{color:CL.al}}>P2: {pLabel(MO,r2s,r2e)}</span></p></div>

    {/* Two-panel combined funnel */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
      {[{label:"P1: "+pLabel(MO,r1s,r1e)+" (Combined)",data:fP1,col:CL.am},{label:"P2: "+pLabel(MO,r2s,r2e)+" (Combined)",data:fP2,col:CL.al}].map(function(per,pi){
        var top=per.data[0];
        return<div key={pi} style={{background:CL.cd,border:"1px solid "+CL.bd,borderRadius:11,padding:14}}>
          <div style={{fontSize:11,fontWeight:700,color:per.col,marginBottom:10}}>{per.label}</div>
          {stages.map(function(st,si){var val=Math.round(per.data[si]);var pctT=top>0?(val/top*100):0;var barW=Math.max(pctT,2);var dropP=si>0&&per.data[si-1]>0?((per.data[si-1]-val)/per.data[si-1]*100).toFixed(1):null;
            return<div key={si} style={{marginBottom:si<3?2:0}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}><span style={{fontSize:9,color:CL.mt,fontWeight:600}}>{st}</span><span style={{fontSize:10,fontWeight:700,color:CL.tx}}>{val.toLocaleString()} <span style={{fontSize:8,color:CL.dm}}>({pctT.toFixed(1)}%)</span></span></div><div style={{height:18,background:CL.bg,borderRadius:4,overflow:"hidden",marginBottom:1}}><div style={{height:"100%",width:barW+"%",background:stgCol[si],borderRadius:4}}/></div>{dropP&&<div style={{textAlign:"center",fontSize:8,color:CL.rd,fontWeight:600,padding:"1px 0"}}>{"\u25BC"} {dropP}% drop</div>}</div>;})}
        </div>;})}
    </div>

    {/* Stage Pass-Through Rates Table */}
    <div style={{background:CL.cd,border:"1px solid "+CL.bd,borderRadius:11,padding:14,marginBottom:12,overflowX:"auto"}}>
      <div style={{fontSize:12,fontWeight:600,color:CL.tx,marginBottom:8}}>Stage Pass-Through Rates</div>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead>
          <tr>
            <th style={{...thS,textAlign:"left",minWidth:100}} rowSpan={2}>Stage</th>
            {storeRates.map(function(st){return<th key={st.n} colSpan={3} style={{...thS,color:st.c,borderBottom:"2px solid "+st.c}}>{st.n}</th>;})}
            <th colSpan={3} style={{...thS,color:CL.tx,borderBottom:"2px solid "+CL.tx}}>Combined</th>
          </tr>
          <tr>
            {storeRates.concat([{n:"comb",c:CL.tx}]).map(function(st,si){return[
              <th key={si+"p1"} style={{...thS,color:CL.mt,fontSize:7}}>P1</th>,
              <th key={si+"p2"} style={{...thS,color:CL.mt,fontSize:7}}>P2</th>,
              <th key={si+"d"} style={{...thS,color:CL.mt,fontSize:7}}>{"\u0394"}</th>
            ];})}
          </tr>
        </thead>
        <tbody>
          {[0,1,2,3].map(function(ri){
            var row=combRates[ri];
            return<tr key={ri}>
              <td style={{padding:"6px 6px",textAlign:"left",fontSize:10,fontWeight:600,color:CL.tx,borderBottom:"1px solid "+CL.bd+"20"}}>{row.l}</td>
              {storeRates.map(function(st,si){var r=st.rates[ri];return[
                <td key={si+"p1"} style={{padding:"5px 4px",textAlign:"center",fontSize:10,color:CL.mt,borderBottom:"1px solid "+CL.bd+"20"}}>{r.p1.toFixed(1)}%</td>,
                <td key={si+"p2"} style={{padding:"5px 4px",textAlign:"center",fontSize:10,fontWeight:600,color:CL.tx,borderBottom:"1px solid "+CL.bd+"20"}}>{r.p2.toFixed(1)}%</td>,
                DeltaPill(r.p1,r.p2)
              ];})}
              <td style={{padding:"5px 4px",textAlign:"center",fontSize:10,color:CL.mt,borderBottom:"1px solid "+CL.bd+"20"}}>{row.p1.toFixed(1)}%</td>
              <td style={{padding:"5px 4px",textAlign:"center",fontSize:10,fontWeight:600,color:CL.tx,borderBottom:"1px solid "+CL.bd+"20"}}>{row.p2.toFixed(1)}%</td>
              {DeltaPill(row.p1,row.p2)}
            </tr>;
          })}
        </tbody>
      </table>
    </div>
  </div>;
}

// ═══ STORE CONVERSION (single store) ═══
function StoreConversion(p){
  var d=p.store,MO=p.months,cvR=rng(d.cv);
  var cd=MO.map(function(m,i){return{m:m,c:d.cv[i]||0};});
  return<div>
    <CB title="Conversion Rate Over Time" h={280}><ComposedChart data={cd}><CartesianGrid strokeDasharray="3 3" stroke={CL.gr}/><XAxis dataKey="m" tick={{fontSize:9,fill:CL.dm}}/><YAxis tick={{fontSize:9,fill:CL.dm}} tickFormatter={function(v){return v+"%";}}/><Tooltip content={TT}/><Area type="monotone" dataKey="c" fill={p.ac+"15"} stroke="none"/><Line type="monotone" dataKey="c" stroke={p.ac} strokeWidth={2.5} dot={{r:3,fill:p.ac}} name="Conv%"/></ComposedChart></CB>
    <div style={{background:CL.cd,border:"1px solid "+CL.bd,borderRadius:11,padding:14,marginBottom:12,overflowX:"auto"}}><div style={{fontSize:12,fontWeight:600,color:CL.tx,marginBottom:4}}>Monthly Heatmap</div><Leg/>
    <table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><th style={{...thS,textAlign:"left"}}>Month</th><th style={{...thS,color:p.ac}}>Conv Rate</th></tr></thead>
    <tbody>{MO.map(function(m,i){return<tr key={i}><MonC m={m} i={i} r1s={p.r1s} r1e={p.r1e} r2s={p.r2s} r2e={p.r2e}/><HC v={(d.cv[i]||0).toFixed(2)+"%"} val={d.cv[i]} lo={cvR.lo} hi={cvR.hi}/></tr>;})}</tbody></table></div>
  </div>;
}

// ═══ ALL STORES CONVERSION (multi-store view) ═══
function AllConversion(p){
  var DS=p.DS,MO=p.months,r1s=p.r1s,r1e=p.r1e,r2s=p.r2s,r2e=p.r2e;

  // Build chart data with per-store conversion rates and sessions
  var cd=MO.map(function(m,i){
    return{
      m:m,
      cpC:DS.cp.cv[i]||0, nbC:DS.nb.cv[i]||0, n4C:DS.n4.cv[i]||0,
      cpSe:DS.cp.se[i]||0, nbSe:DS.nb.se[i]||0, n4Se:DS.n4.se[i]||0
    };
  });

  // Ranges for heatmap coloring
  var allRates=[].concat(DS.cp.cv||[],DS.nb.cv||[],DS.n4.cv||[]).filter(function(x){return x>0;});
  var allSess=[].concat(DS.cp.se||[],DS.nb.se||[],DS.n4.se||[]).filter(function(x){return x>0;});
  var rateR={lo:allRates.length?Math.min.apply(null,allRates):0,hi:allRates.length?Math.max.apply(null,allRates):1};
  var sessR={lo:allSess.length?Math.min.apply(null,allSess):0,hi:allSess.length?Math.max.apply(null,allSess):1};

  return<div>
    <div style={{marginBottom:12,marginTop:18}}><h2 style={{fontSize:15,fontWeight:700,color:CL.tx,margin:0}}>Conversion & Sessions</h2><p style={{fontSize:11,color:CL.mt,margin:"2px 0 0"}}>All stores comparison</p></div>

    {/* Multi-store Conversion Rate Line Chart */}
    <CB title="Conversion Rate" h={280}>
      <ComposedChart data={cd}>
        <CartesianGrid strokeDasharray="3 3" stroke={CL.gr}/>
        <XAxis dataKey="m" tick={{fontSize:9,fill:CL.dm}}/>
        <YAxis tick={{fontSize:9,fill:CL.dm}} tickFormatter={function(v){return v+"%";}}/>
        <Tooltip content={TT}/>
        <Line type="monotone" dataKey="cpC" stroke={CL.cp} strokeWidth={2.5} dot={{r:3,fill:CL.cp}} name="ColorProof"/>
        <Line type="monotone" dataKey="nbC" stroke={CL.nb} strokeWidth={2.5} dot={{r:3,fill:CL.nb}} name="NeumaBeauty"/>
        <Line type="monotone" dataKey="n4C" stroke={CL.n4} strokeWidth={2.5} dot={{r:3,fill:CL.n4}} name="Number 4"/>
      </ComposedChart>
    </CB>

    {/* Stacked Sessions Bar Chart */}
    <CB title="Sessions — Stacked" h={280}>
      <BarChart data={cd}>
        <CartesianGrid strokeDasharray="3 3" stroke={CL.gr}/>
        <XAxis dataKey="m" tick={{fontSize:9,fill:CL.dm}}/>
        <YAxis tick={{fontSize:9,fill:CL.dm}} tickFormatter={function(v){return v>=1000?(v/1000).toFixed(0)+"k":v;}}/>
        <Tooltip content={TT}/>
        <Bar dataKey="cpSe" stackId="sessions" fill={CL.cp} name="ColorProof"/>
        <Bar dataKey="nbSe" stackId="sessions" fill={CL.nb} name="NeumaBeauty"/>
        <Bar dataKey="n4Se" stackId="sessions" fill={CL.n4} radius={[4,4,0,0]} name="Number 4"/>
      </BarChart>
    </CB>

    {/* Cross-Store Heatmap Table */}
    <div style={{background:CL.cd,border:"1px solid "+CL.bd,borderRadius:11,padding:14,marginBottom:12,overflowX:"auto"}}>
      <div style={{fontSize:12,fontWeight:600,color:CL.tx,marginBottom:4}}>Cross-Store Heatmap</div>
      <Leg/>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead>
          <tr>
            <th style={{...thS,textAlign:"left"}}>Month</th>
            <th style={{...thS,color:CL.cp}}>CP Rate</th>
            <th style={{...thS,color:CL.cp}}>CP Sess</th>
            <th style={{...thS,color:CL.nb}}>NB Rate</th>
            <th style={{...thS,color:CL.nb}}>NB Sess</th>
            <th style={{...thS,color:CL.n4}}>N4 Rate</th>
            <th style={{...thS,color:CL.n4}}>N4 Sess</th>
            <th style={thS}>Combined</th>
          </tr>
        </thead>
        <tbody>
          {MO.map(function(m,i){
            var cpR2=DS.cp.cv[i]||0,nbR2=DS.nb.cv[i]||0,n4R2=DS.n4.cv[i]||0;
            var cpS2=DS.cp.se[i]||0,nbS2=DS.nb.se[i]||0,n4S2=DS.n4.se[i]||0;
            var totSe=cpS2+nbS2+n4S2;
            var totCk=(DS.cp.ck[i]||0)+(DS.nb.ck[i]||0)+(DS.n4.ck[i]||0);
            var combined=totSe>0?(totCk/totSe*100):0;
            return<tr key={i}>
              <MonC m={m} i={i} r1s={r1s} r1e={r1e} r2s={r2s} r2e={r2e}/>
              <HC v={cpR2.toFixed(2)+"%"} val={cpR2} lo={rateR.lo} hi={rateR.hi}/>
              <HC v={cpS2.toLocaleString()} val={cpS2} lo={sessR.lo} hi={sessR.hi}/>
              <HC v={nbR2.toFixed(2)+"%"} val={nbR2} lo={rateR.lo} hi={rateR.hi}/>
              <HC v={nbS2.toLocaleString()} val={nbS2} lo={sessR.lo} hi={sessR.hi}/>
              <HC v={n4R2.toFixed(2)+"%"} val={n4R2} lo={rateR.lo} hi={rateR.hi}/>
              <HC v={n4S2.toLocaleString()} val={n4S2} lo={sessR.lo} hi={sessR.hi}/>
              <HC v={combined.toFixed(2)+"%"} val={combined} lo={rateR.lo} hi={rateR.hi} bold={true}/>
            </tr>;
          })}
        </tbody>
      </table>
    </div>
  </div>;
}

// ═══ ALL STORES AOV & ORDERS (multi-store view) ═══
function AllAOV(p){
  var DS=p.DS,MO=p.months,r1s=p.r1s,r1e=p.r1e,r2s=p.r2s,r2e=p.r2e;

  // Build chart data with per-store AOV, orders, and combined AOV
  var cd=MO.map(function(m,i){
    var cpS=DS.cp.s[i]||0,nbS=DS.nb.s[i]||0,n4S=DS.n4.s[i]||0;
    var cpO=DS.cp.or[i]||0,nbO=DS.nb.or[i]||0,n4O=DS.n4.or[i]||0;
    var totO=cpO+nbO+n4O;
    var totS=cpS+nbS+n4S;
    return{
      m:m,
      cpA:DS.cp.av[i]||0, nbA:DS.nb.av[i]||0, n4A:DS.n4.av[i]||0,
      comb:totO>0?totS/totO:0,
      cpO:cpO, nbO:nbO, n4O:n4O
    };
  });

  // Ranges for heatmap
  var allAOVs=[].concat(DS.cp.av||[],DS.nb.av||[],DS.n4.av||[]).filter(function(x){return x>0;});
  var allOrds=[].concat(DS.cp.or||[],DS.nb.or||[],DS.n4.or||[]).filter(function(x){return x>0;});
  var aovR={lo:allAOVs.length?Math.min.apply(null,allAOVs):0,hi:allAOVs.length?Math.max.apply(null,allAOVs):1};
  var ordR={lo:allOrds.length?Math.min.apply(null,allOrds):0,hi:allOrds.length?Math.max.apply(null,allOrds):1};
  // Total orders range
  var totOrds=MO.map(function(_,i){return(DS.cp.or[i]||0)+(DS.nb.or[i]||0)+(DS.n4.or[i]||0);}).filter(function(x){return x>0;});
  var totOrdR={lo:totOrds.length?Math.min.apply(null,totOrds):0,hi:totOrds.length?Math.max.apply(null,totOrds):1};

  return<div>
    <div style={{marginBottom:12,marginTop:18}}><h2 style={{fontSize:15,fontWeight:700,color:CL.tx,margin:0}}>AOV & Orders</h2><p style={{fontSize:11,color:CL.mt,margin:"2px 0 0"}}>All stores comparison</p></div>

    {/* Multi-store AOV Trend Line Chart */}
    <CB title="AOV Trend" h={280}>
      <ComposedChart data={cd}>
        <CartesianGrid strokeDasharray="3 3" stroke={CL.gr}/>
        <XAxis dataKey="m" tick={{fontSize:9,fill:CL.dm}}/>
        <YAxis tick={{fontSize:9,fill:CL.dm}} tickFormatter={function(v){return"$"+v;}}/>
        <Tooltip content={TT}/>
        <Line type="monotone" dataKey="cpA" stroke={CL.cp} strokeWidth={2.5} dot={{r:3,fill:CL.cp}} name="ColorProof"/>
        <Line type="monotone" dataKey="nbA" stroke={CL.nb} strokeWidth={2.5} dot={{r:3,fill:CL.nb}} name="NeumaBeauty"/>
        <Line type="monotone" dataKey="n4A" stroke={CL.n4} strokeWidth={2.5} dot={{r:3,fill:CL.n4}} name="Number 4"/>
        <Line type="monotone" dataKey="comb" stroke={CL.al} strokeWidth={2} strokeDasharray="5 5" dot={{r:2,fill:CL.al}} name="Combined"/>
      </ComposedChart>
    </CB>

    {/* Stacked Orders Bar Chart */}
    <CB title="Orders — Stacked" h={280}>
      <BarChart data={cd}>
        <CartesianGrid strokeDasharray="3 3" stroke={CL.gr}/>
        <XAxis dataKey="m" tick={{fontSize:9,fill:CL.dm}}/>
        <YAxis tick={{fontSize:9,fill:CL.dm}}/>
        <Tooltip content={TT}/>
        <Bar dataKey="cpO" stackId="orders" fill={CL.cp} name="ColorProof"/>
        <Bar dataKey="nbO" stackId="orders" fill={CL.nb} name="NeumaBeauty"/>
        <Bar dataKey="n4O" stackId="orders" fill={CL.n4} radius={[4,4,0,0]} name="Number 4"/>
      </BarChart>
    </CB>

    {/* Cross-Store Heatmap Table */}
    <div style={{background:CL.cd,border:"1px solid "+CL.bd,borderRadius:11,padding:14,marginBottom:12,overflowX:"auto"}}>
      <div style={{fontSize:12,fontWeight:600,color:CL.tx,marginBottom:4}}>Cross-Store Heatmap</div>
      <Leg/>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead>
          <tr>
            <th style={{...thS,textAlign:"left"}}>Month</th>
            <th style={{...thS,color:CL.cp}}>CP AOV</th>
            <th style={{...thS,color:CL.cp}}>CP Ord</th>
            <th style={{...thS,color:CL.nb}}>NB AOV</th>
            <th style={{...thS,color:CL.nb}}>NB Ord</th>
            <th style={{...thS,color:CL.n4}}>N4 AOV</th>
            <th style={{...thS,color:CL.n4}}>N4 Ord</th>
            <th style={thS}>Tot Ord</th>
          </tr>
        </thead>
        <tbody>
          {MO.map(function(m,i){
            var cpAv=DS.cp.av[i]||0,nbAv=DS.nb.av[i]||0,n4Av=DS.n4.av[i]||0;
            var cpOr=DS.cp.or[i]||0,nbOr=DS.nb.or[i]||0,n4Or=DS.n4.or[i]||0;
            var totOr=cpOr+nbOr+n4Or;
            return<tr key={i}>
              <MonC m={m} i={i} r1s={r1s} r1e={r1e} r2s={r2s} r2e={r2e}/>
              <HC v={"$"+cpAv.toFixed(2)} val={cpAv} lo={aovR.lo} hi={aovR.hi}/>
              <HC v={cpOr.toLocaleString()} val={cpOr} lo={ordR.lo} hi={ordR.hi}/>
              <HC v={"$"+nbAv.toFixed(2)} val={nbAv} lo={aovR.lo} hi={aovR.hi}/>
              <HC v={nbOr.toLocaleString()} val={nbOr} lo={ordR.lo} hi={ordR.hi}/>
              <HC v={"$"+n4Av.toFixed(2)} val={n4Av} lo={aovR.lo} hi={aovR.hi}/>
              <HC v={n4Or.toLocaleString()} val={n4Or} lo={ordR.lo} hi={ordR.hi}/>
              <HC v={totOr.toLocaleString()} val={totOr} lo={totOrdR.lo} hi={totOrdR.hi} bold={true}/>
            </tr>;
          })}
        </tbody>
      </table>
    </div>
  </div>;
}

// ═══ STORE AOV & ORDERS ═══
function StoreAOV(p){
  var d=p.store,MO=p.months,avR=rng(d.av),orR=rng(d.or);
  var cd=MO.map(function(m,i){return{m:m,a:d.av[i]||0,ap:d.ap[i]||0,o:d.or[i]||0};});
  return<div>
    <CB title="Average Order Value" h={280}><ComposedChart data={cd}><CartesianGrid strokeDasharray="3 3" stroke={CL.gr}/><XAxis dataKey="m" tick={{fontSize:9,fill:CL.dm}}/><YAxis tick={{fontSize:9,fill:CL.dm}} tickFormatter={function(v){return "$"+v;}}/><Tooltip content={TT}/><Area type="monotone" dataKey="a" fill={p.ac+"15"} stroke="none"/><Line type="monotone" dataKey="a" stroke={p.ac} strokeWidth={2.5} dot={{r:3,fill:p.ac}} name="AOV"/><Line type="monotone" dataKey="ap" stroke={CL.am} strokeWidth={2} strokeDasharray="5 5" dot={{r:2,fill:CL.am}} name="Prior Year"/></ComposedChart></CB>
    <CB title="Orders Over Time" h={250}><BarChart data={cd}><CartesianGrid strokeDasharray="3 3" stroke={CL.gr}/><XAxis dataKey="m" tick={{fontSize:9,fill:CL.dm}}/><YAxis tick={{fontSize:9,fill:CL.dm}}/><Tooltip content={TT}/><Bar dataKey="o" fill={p.ac} radius={[4,4,0,0]} name="Orders"/></BarChart></CB>
    <div style={{background:CL.cd,border:"1px solid "+CL.bd,borderRadius:11,padding:14,marginBottom:12,overflowX:"auto"}}><div style={{fontSize:12,fontWeight:600,color:CL.tx,marginBottom:4}}>Monthly Heatmap</div><Leg/>
    <table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><th style={{...thS,textAlign:"left"}}>Month</th><th style={{...thS,color:p.ac}}>AOV</th><th style={thS}>Prior Year</th><th style={thS}>YoY%</th><th style={{...thS,color:p.ac}}>Orders</th></tr></thead>
    <tbody>{MO.map(function(m,i){return<tr key={i}><MonC m={m} i={i} r1s={p.r1s} r1e={p.r1e} r2s={p.r2s} r2e={p.r2e}/><HC v={"$"+(d.av[i]||0).toFixed(2)} val={d.av[i]} lo={avR.lo} hi={avR.hi}/><PlainTd>{"$"+(d.ap[i]||0).toFixed(2)}</PlainTd><YC val={yoy(d.av[i]||0,d.ap[i]||0)}/><HC v={Math.round(d.or[i]||0).toString()} val={d.or[i]} lo={orR.lo} hi={orR.hi}/></tr>;})}</tbody></table></div>
  </div>;
}

// ═══ STORE TRAFFIC (single store with all session metrics) ═══
function StoreTraffic(p){
  var d=p.store,MO=p.months,ac=p.ac;
  var hasTM=d.se&&d.se.length>0;

  // Session metrics charts data
  var cd=hasTM?MO.map(function(m,i){return{
    m:m, se:d.se[i]||0, sep:d.sep?d.sep[i]||0:0,
    cv:d.cv[i]||0, cvp:d.cvp?d.cvp[i]||0:0,
    acr:d.acr?d.acr[i]||0:0, acrp:d.acrp?d.acrp[i]||0:0,
    ccr:d.ccr?d.ccr[i]||0:0, ccrp:d.ccrp?d.ccrp[i]||0:0,
    pvs:d.pvs?d.pvs[i]||0:0, pvsp:d.pvsp?d.pvsp[i]||0:0,
    br:d.br?d.br[i]||0:0, brp:d.brp?d.brp[i]||0:0,
    asd:d.asd?d.asd[i]||0:0, asdp:d.asdp?d.asdp[i]||0:0
  };}):[];

  function MetricChart(title,dk,dkp,h,fmt){
    return<CB title={title} h={h||220}><ComposedChart data={cd}><CartesianGrid strokeDasharray="3 3" stroke={CL.gr}/><XAxis dataKey="m" tick={{fontSize:9,fill:CL.dm}}/><YAxis tick={{fontSize:9,fill:CL.dm}} tickFormatter={fmt||function(v){return v;}}/><Tooltip content={TT}/><Area type="monotone" dataKey={dk} fill={ac+"15"} stroke="none"/><Line type="monotone" dataKey={dk} stroke={ac} strokeWidth={2.5} dot={{r:3,fill:ac}} name="Current"/>{dkp&&<Line type="monotone" dataKey={dkp} stroke={CL.am} strokeWidth={2} strokeDasharray="5 5" dot={{r:2,fill:CL.am}} name="Prior Period"/>}</ComposedChart></CB>;
  }

  return<div>
    {hasTM&&<div>
      <div style={{marginBottom:12,marginTop:18}}><h2 style={{fontSize:15,fontWeight:700,color:CL.tx,margin:0}}>Traffic & Session Metrics</h2></div>
      {MetricChart("Sessions","se","sep",250,function(v){return v>=1000?(v/1000).toFixed(0)+"k":v;})}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {MetricChart("Conversion Rate","cv","cvp",200,function(v){return v+"%";})}
        {MetricChart("Added to Cart Rate","acr","acrp",200,function(v){return v+"%";})}
        {MetricChart("Checkout Conv Rate","ccr","ccrp",200,function(v){return v+"%";})}
        {MetricChart("Bounce Rate","br","brp",200,function(v){return v+"%";})}
        {MetricChart("Pageviews / Session","pvs","pvsp",200)}
        {MetricChart("Avg Session Duration","asd","asdp",200,function(v){return v>=60?Math.floor(v/60)+"m":v+"s";})}
      </div>
    </div>}
    {/* Referrer Table */}
    {(d.rf||[]).length>0&&<div style={{background:CL.cd,border:"1px solid "+CL.bd,borderRadius:11,padding:14,marginBottom:12,marginTop:12,overflowX:"auto"}}><div style={{fontSize:12,fontWeight:600,color:CL.tx,marginBottom:4}}>Traffic Sources (Referrers)</div><Leg/><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><th style={{...thS,textAlign:"left"}}>Source</th><th style={thS}>Sessions</th><th style={{...thS,color:ac}}>Conv%</th></tr></thead><tbody>{(d.rf||[]).map(function(r,i){return<tr key={i}><td style={{padding:"5px 6px",textAlign:"left",fontSize:10,fontWeight:600,color:CL.tx,borderBottom:"1px solid "+CL.bd+"20"}}>{r.n}</td><PlainTd>{r.s.toLocaleString()}</PlainTd><HC v={r.r>0?r.r+"%":"0%"} val={r.r} lo={0} hi={16}/></tr>;})}</tbody></table></div>}
  </div>;
}

// ═══ ALL STORES TRAFFIC (multi-store view) ═══
function AllTraffic(p){
  var DS=p.DS,MO=p.months;

  // Build chart data with per-store metrics
  var cd=MO.map(function(m,i){
    return{
      m:m,
      cpSe:DS.cp.se[i]||0, nbSe:DS.nb.se[i]||0, n4Se:DS.n4.se[i]||0,
      cpCv:DS.cp.cv[i]||0, nbCv:DS.nb.cv[i]||0, n4Cv:DS.n4.cv[i]||0,
      cpAcr:DS.cp.acr?DS.cp.acr[i]||0:0, nbAcr:DS.nb.acr?DS.nb.acr[i]||0:0, n4Acr:DS.n4.acr?DS.n4.acr[i]||0:0,
      cpCcr:DS.cp.ccr?DS.cp.ccr[i]||0:0, nbCcr:DS.nb.ccr?DS.nb.ccr[i]||0:0, n4Ccr:DS.n4.ccr?DS.n4.ccr[i]||0:0,
      cpBr:DS.cp.br?DS.cp.br[i]||0:0, nbBr:DS.nb.br?DS.nb.br[i]||0:0, n4Br:DS.n4.br?DS.n4.br[i]||0:0,
      cpPvs:DS.cp.pvs?DS.cp.pvs[i]||0:0, nbPvs:DS.nb.pvs?DS.nb.pvs[i]||0:0, n4Pvs:DS.n4.pvs?DS.n4.pvs[i]||0:0,
      cpAsd:DS.cp.asd?DS.cp.asd[i]||0:0, nbAsd:DS.nb.asd?DS.nb.asd[i]||0:0, n4Asd:DS.n4.asd?DS.n4.asd[i]||0:0
    };
  });

  function MultiChart(title,cpK,nbK,n4K,h,fmt){
    return<CB title={title} h={h||250}><ComposedChart data={cd}><CartesianGrid strokeDasharray="3 3" stroke={CL.gr}/><XAxis dataKey="m" tick={{fontSize:9,fill:CL.dm}}/><YAxis tick={{fontSize:9,fill:CL.dm}} tickFormatter={fmt||function(v){return v;}}/><Tooltip content={TT}/><Line type="monotone" dataKey={cpK} stroke={CL.cp} strokeWidth={2.5} dot={{r:3,fill:CL.cp}} name="ColorProof"/><Line type="monotone" dataKey={nbK} stroke={CL.nb} strokeWidth={2.5} dot={{r:3,fill:CL.nb}} name="NeumaBeauty"/><Line type="monotone" dataKey={n4K} stroke={CL.n4} strokeWidth={2.5} dot={{r:3,fill:CL.n4}} name="Number 4"/></ComposedChart></CB>;
  }

  function StackedBar(title,cpK,nbK,n4K,h,fmt){
    return<CB title={title} h={h||250}><BarChart data={cd}><CartesianGrid strokeDasharray="3 3" stroke={CL.gr}/><XAxis dataKey="m" tick={{fontSize:9,fill:CL.dm}}/><YAxis tick={{fontSize:9,fill:CL.dm}} tickFormatter={fmt||function(v){return v;}}/><Tooltip content={TT}/><Bar dataKey={cpK} stackId="s" fill={CL.cp} name="ColorProof"/><Bar dataKey={nbK} stackId="s" fill={CL.nb} name="NeumaBeauty"/><Bar dataKey={n4K} stackId="s" fill={CL.n4} radius={[4,4,0,0]} name="Number 4"/></BarChart></CB>;
  }

  return<div>
    <div style={{marginBottom:12,marginTop:18}}><h2 style={{fontSize:15,fontWeight:700,color:CL.tx,margin:0}}>Traffic & Session Metrics — All Stores</h2></div>

    {/* Sessions Stacked */}
    {StackedBar("Sessions — Stacked","cpSe","nbSe","n4Se",280,function(v){return v>=1000?(v/1000).toFixed(0)+"k":v;})}

    {/* Metric comparison charts in 2-column grid */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      {MultiChart("Conversion Rate","cpCv","nbCv","n4Cv",220,function(v){return v+"%";})}
      {MultiChart("Added to Cart Rate","cpAcr","nbAcr","n4Acr",220,function(v){return v+"%";})}
      {MultiChart("Checkout Conv Rate","cpCcr","nbCcr","n4Ccr",220,function(v){return v+"%";})}
      {MultiChart("Bounce Rate","cpBr","nbBr","n4Br",220,function(v){return v+"%";})}
      {MultiChart("Pageviews / Session","cpPvs","nbPvs","n4Pvs",220)}
      {MultiChart("Avg Session Duration","cpAsd","nbAsd","n4Asd",220,function(v){return v>=60?Math.floor(v/60)+"m":v+"s";})}
    </div>

    {/* Cross-Store Heatmap */}
    <div style={{background:CL.cd,border:"1px solid "+CL.bd,borderRadius:11,padding:14,marginBottom:12,marginTop:12,overflowX:"auto"}}>
      <div style={{fontSize:12,fontWeight:600,color:CL.tx,marginBottom:4}}>Sessions & Bounce Rate Heatmap</div>
      <Leg/>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr>
          <th style={{...thS,textAlign:"left"}}>Month</th>
          <th style={{...thS,color:CL.cp}}>CP Sess</th>
          <th style={{...thS,color:CL.cp}}>CP Bnce</th>
          <th style={{...thS,color:CL.nb}}>NB Sess</th>
          <th style={{...thS,color:CL.nb}}>NB Bnce</th>
          <th style={{...thS,color:CL.n4}}>N4 Sess</th>
          <th style={{...thS,color:CL.n4}}>N4 Bnce</th>
          <th style={thS}>Tot Sess</th>
        </tr></thead>
        <tbody>{MO.map(function(m,i){
          var cpS=DS.cp.se[i]||0,nbS=DS.nb.se[i]||0,n4S=DS.n4.se[i]||0;
          var cpB=DS.cp.br?DS.cp.br[i]||0:0,nbB=DS.nb.br?DS.nb.br[i]||0:0,n4B=DS.n4.br?DS.n4.br[i]||0:0;
          var allSe=[].concat(DS.cp.se||[],DS.nb.se||[],DS.n4.se||[]).filter(function(x){return x>0;});
          var seR={lo:allSe.length?Math.min.apply(null,allSe):0,hi:allSe.length?Math.max.apply(null,allSe):1};
          return<tr key={i}>
            <MonC m={m} i={i} r1s={p.r1s} r1e={p.r1e} r2s={p.r2s} r2e={p.r2e}/>
            <HC v={cpS.toLocaleString()} val={cpS} lo={seR.lo} hi={seR.hi}/>
            <HC v={cpB.toFixed(1)+"%"} val={cpB} lo={0} hi={100} inv={true}/>
            <HC v={nbS.toLocaleString()} val={nbS} lo={seR.lo} hi={seR.hi}/>
            <HC v={nbB.toFixed(1)+"%"} val={nbB} lo={0} hi={100} inv={true}/>
            <HC v={n4S.toLocaleString()} val={n4S} lo={seR.lo} hi={seR.hi}/>
            <HC v={n4B.toFixed(1)+"%"} val={n4B} lo={0} hi={100} inv={true}/>
            <HC v={(cpS+nbS+n4S).toLocaleString()} val={cpS+nbS+n4S} lo={seR.lo*3} hi={seR.hi*3} bold={true}/>
          </tr>;
        })}</tbody>
      </table>
    </div>
  </div>;
}

// ═══ STORE CAMPAIGN ═══
function StoreCampaign(p){var d=p.store,revR=rng((d.ut||[]).map(function(u){return u.sa;}));return<div><Ins type="info">Campaign data is aggregated for the full period.</Ins><div style={{background:CL.cd,border:"1px solid "+CL.bd,borderRadius:11,padding:14,marginBottom:12,overflowX:"auto"}}><div style={{fontSize:12,fontWeight:600,color:CL.tx,marginBottom:4}}>Campaign Detail</div><Leg/><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><th style={{...thS,textAlign:"left"}}>Channel</th><th style={thS}>Sessions</th><th style={{...thS,color:p.ac}}>Revenue</th><th style={thS}>Orders</th><th style={thS}>Conv%</th></tr></thead><tbody>{(d.ut||[]).map(function(u,i){return<tr key={i}><td style={{padding:"5px 6px",textAlign:"left",fontSize:10,fontWeight:600,color:CL.tx,borderBottom:"1px solid "+CL.bd+"20"}}><span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:u.cl,marginRight:5}}/>{u.ch}</td><PlainTd>{u.se.toLocaleString()}</PlainTd><HC v={f$(u.sa)} val={u.sa} lo={0} hi={revR.hi}/><PlainTd>{u.or}</PlainTd><HC v={u.cv+"%"} val={u.cv} lo={0} hi={52}/></tr>;})}</tbody></table></div></div>;}

// ═══ ALL STORES OVERVIEW ═══
function AllOverview(p){
  var DS=p.DS,MO=p.months,r1s=p.r1s,r1e=p.r1e,r2s=p.r2s,r2e=p.r2e;
  var CD=MO.map(function(m,i){return{m:m,cpS:(DS.cp.s[i]||0),nbS:(DS.nb.s[i]||0),n4S:(DS.n4.s[i]||0),cpC:(DS.cp.cv[i]||0),nbC:(DS.nb.cv[i]||0),n4C:(DS.n4.cv[i]||0)};});
  var tB=avg(DS.cp.s,r1s,r1e+1)+avg(DS.nb.s,r1s,r1e+1)+avg(DS.n4.s,r1s,r1e+1);
  var tA=avg(DS.cp.s,r2s,r2e+1)+avg(DS.nb.s,r2s,r2e+1)+avg(DS.n4.s,r2s,r2e+1);
  var metrics=[
    {l:"Sales/mo",f:f$,d:[{b:avg(DS.cp.s,r1s,r1e+1),a:avg(DS.cp.s,r2s,r2e+1)},{b:avg(DS.nb.s,r1s,r1e+1),a:avg(DS.nb.s,r2s,r2e+1)},{b:avg(DS.n4.s,r1s,r1e+1),a:avg(DS.n4.s,r2s,r2e+1)}]},
    {l:"Conv %",f:function(v){return v.toFixed(2)+"%";},d:[{b:avg(DS.cp.cv,r1s,r1e+1),a:avg(DS.cp.cv,r2s,r2e+1)},{b:avg(DS.nb.cv,r1s,r1e+1),a:avg(DS.nb.cv,r2s,r2e+1)},{b:avg(DS.n4.cv,r1s,r1e+1),a:avg(DS.n4.cv,r2s,r2e+1)}]},
    {l:"AOV",f:function(v){return "$"+v.toFixed(2);},d:[{b:avg(DS.cp.av,r1s,r1e+1),a:avg(DS.cp.av,r2s,r2e+1)},{b:avg(DS.nb.av,r1s,r1e+1),a:avg(DS.nb.av,r2s,r2e+1)},{b:avg(DS.n4.av,r1s,r1e+1),a:avg(DS.n4.av,r2s,r2e+1)}]}
  ];
  var stores=[{n:"ColorProof",c:CL.cp},{n:"NeumaBeauty",c:CL.nb},{n:"Number 4",c:CL.n4}];
  return<div>
    <div style={{marginBottom:12,marginTop:18}}><h2 style={{fontSize:15,fontWeight:700,color:CL.tx,margin:0}}>Portfolio Summary</h2><p style={{fontSize:11,color:CL.mt,margin:"2px 0 0"}}><span style={{color:CL.am}}>P1: {pLabel(MO,r1s,r1e)}</span> vs <span style={{color:CL.al}}>P2: {pLabel(MO,r2s,r2e)}</span></p></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:9,marginBottom:14}}>
      <div style={{background:CL.cd,border:"1px solid "+CL.bd,borderRadius:11,padding:13}}><div style={{fontSize:9,color:CL.mt,fontWeight:600,textTransform:"uppercase",marginBottom:3}}>P2 Sales/mo</div><div style={{fontSize:19,fontWeight:700,color:CL.tx}}>{f$(tA)}</div><Pill color={pct(tA,tB)>=0?CL.gn:CL.rd}>{pct(tA,tB)>=0?"\u25B2":"\u25BC"}{Math.abs(pct(tA,tB)).toFixed(1)}%</Pill></div>
      <div style={{background:CL.cd,border:"1px solid "+CL.bd,borderRadius:11,padding:13}}><div style={{fontSize:9,color:CL.mt,fontWeight:600,textTransform:"uppercase",marginBottom:3}}>P1 Sales/mo</div><div style={{fontSize:19,fontWeight:700,color:CL.tx}}>{f$(tB)}</div><div style={{fontSize:9,color:CL.dm}}>Baseline</div></div>
    </div>
    <div style={{background:CL.cd,border:"1px solid "+CL.bd,borderRadius:11,padding:14,marginBottom:14,overflowX:"auto"}}>
      <div style={{fontSize:12,fontWeight:600,color:CL.tx,marginBottom:10}}>Period 1 vs Period 2</div>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
        <thead><tr style={{borderBottom:"2px solid "+CL.bd}}><th style={{padding:5,textAlign:"left",color:CL.mt,fontSize:9}}>Metric</th>{stores.map(function(st){return<th key={st.n} colSpan={3} style={{padding:5,textAlign:"center",color:st.c,fontSize:9,fontWeight:600,borderBottom:"2px solid "+st.c}}>{st.n}</th>;})}</tr></thead>
        <tbody>{metrics.map(function(mt){return<tr key={mt.l} style={{borderBottom:"1px solid "+CL.bd+"25"}}><td style={{padding:"6px 5px",fontWeight:600,color:CL.tx}}>{mt.l}</td>{mt.d.map(function(dd,j){var ch=pct(dd.a,dd.b);var bg2=ch>=0?"rgba(34,197,94,0.15)":"rgba(239,68,68,0.15)";return[<td key={j+"b"} style={{padding:"6px 3px",textAlign:"center",color:CL.mt}}>{mt.f(dd.b)}</td>,<td key={j+"a"} style={{padding:"6px 3px",textAlign:"center",color:CL.tx,fontWeight:600}}>{mt.f(dd.a)}</td>,<td key={j+"c"} style={{padding:"6px 5px",textAlign:"center",background:dd.b>0?bg2:"transparent"}}>{dd.b>0?<Pill color={ch>=0?CL.gn:CL.rd}>{ch>=0?"+":""}{ch.toFixed(1)}%</Pill>:<span style={{fontSize:9,color:CL.dm}}>N/A</span>}</td>];})}</tr>;})}</tbody>
      </table>
    </div>
    <CB title="Net Sales — All Stores" h={280}><ComposedChart data={CD}><CartesianGrid strokeDasharray="3 3" stroke={CL.gr}/><XAxis dataKey="m" tick={{fontSize:9,fill:CL.dm}}/><YAxis tick={{fontSize:9,fill:CL.dm}} tickFormatter={function(v){return "$"+(v/1000).toFixed(0)+"k";}}/><Tooltip content={TT}/><Line type="monotone" dataKey="cpS" stroke={CL.cp} strokeWidth={2.5} dot={{r:3,fill:CL.cp}} name="ColorProof"/><Line type="monotone" dataKey="nbS" stroke={CL.nb} strokeWidth={2.5} dot={{r:3,fill:CL.nb}} name="NeumaBeauty"/><Line type="monotone" dataKey="n4S" stroke={CL.n4} strokeWidth={2.5} dot={{r:3,fill:CL.n4}} name="Number 4"/></ComposedChart></CB>
  </div>;
}

// ═══════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════
export default function Dashboard({ data }) {
  var stP=useState("all"),proj=stP[0],setProj=stP[1];
  var stT=useState("overview"),tab=stT[0],setTab=stT[1];
  var DS = { cp: data.cp || {}, nb: data.nb || {}, n4: data.n4 || {} };
  var MO = data.months || [];
  var maxIdx = MO.length - 1;

  var stR1s=useState(0),r1s=stR1s[0],setR1s=stR1s[1];
  var stR1e=useState(Math.min(8,maxIdx)),r1e=stR1e[0],setR1e=stR1e[1];
  var stR2s=useState(Math.min(9,maxIdx)),r2s=stR2s[0],setR2s=stR2s[1];
  var stR2e=useState(maxIdx),r2e=stR2e[0],setR2e=stR2e[1];
  var stDP=useState(false),showDP=stDP[0],setShowDP=stDP[1];

  var projects=[{id:"all",label:"All Stores",ac:CL.al,icon:"\u2605",nm:"All Stores"},{id:"cp",label:"ColorProof",ac:CL.cp,icon:"C",nm:"ColorProof"},{id:"nb",label:"NeumaBeauty",ac:CL.nb,icon:"N",nm:"NeumaBeauty"},{id:"n4",label:"Number 4",ac:CL.n4,icon:"4",nm:"Number 4 Hair"}];
  var cur=projects[0];for(var pi=0;pi<projects.length;pi++){if(projects[pi].id===proj)cur=projects[pi];}

  var tabs=[{id:"overview",label:"Overview"},{id:"sales",label:"Net Sales"},{id:"conversion",label:"Conversion"},{id:"aov",label:"AOV & Orders"},{id:"funnel",label:"Funnel"},{id:"traffic",label:"Traffic"},{id:"campaigns",label:"Campaigns"}];
  var rp={r1s:r1s,r1e:r1e,r2s:r2s,r2e:r2e,months:MO};
  var sp=function(k){return{store:DS[k],ac:cur.ac,nm:cur.nm,months:MO,r1s:r1s,r1e:r1e,r2s:r2s,r2e:r2e};};

  function renderTab(){
    if(proj==="all"){
      var allS={s:MO.map(function(_,i){return(DS.cp.s[i]||0)+(DS.nb.s[i]||0)+(DS.n4.s[i]||0);}),sp:MO.map(function(_,i){return(DS.cp.sp[i]||0)+(DS.nb.sp[i]||0)+(DS.n4.sp[i]||0);})};
      var allF={se:MO.map(function(_,i){return(DS.cp.se[i]||0)+(DS.nb.se[i]||0)+(DS.n4.se[i]||0);}),ca:MO.map(function(_,i){return(DS.cp.ca[i]||0)+(DS.nb.ca[i]||0)+(DS.n4.ca[i]||0);}),rc:MO.map(function(_,i){return(DS.cp.rc[i]||0)+(DS.nb.rc[i]||0)+(DS.n4.rc[i]||0);}),ck:MO.map(function(_,i){return(DS.cp.ck[i]||0)+(DS.nb.ck[i]||0)+(DS.n4.ck[i]||0);})};
      var allCV={cv:MO.map(function(_,i){var se=(DS.cp.se[i]||0)+(DS.nb.se[i]||0)+(DS.n4.se[i]||0);var ck=(DS.cp.ck[i]||0)+(DS.nb.ck[i]||0)+(DS.n4.ck[i]||0);return se>0?(ck/se*100):0;})};
      var allAOV={av:MO.map(function(_,i){var tS=(DS.cp.s[i]||0)+(DS.nb.s[i]||0)+(DS.n4.s[i]||0);var tO=(DS.cp.or[i]||0)+(DS.nb.or[i]||0)+(DS.n4.or[i]||0);return tO>0?tS/tO:0;}),ap:MO.map(function(_,i){var tS=(DS.cp.sp[i]||0)+(DS.nb.sp[i]||0)+(DS.n4.sp[i]||0);var tO=(DS.cp.or[i]||0)+(DS.nb.or[i]||0)+(DS.n4.or[i]||0);return tO>0?tS/tO:0;}),or:MO.map(function(_,i){return(DS.cp.or[i]||0)+(DS.nb.or[i]||0)+(DS.n4.or[i]||0);})};
      if(tab==="overview")return<AllOverview DS={DS} months={MO} r1s={r1s} r1e={r1e} r2s={r2s} r2e={r2e}/>;
      if(tab==="sales")return<StoreSales store={allS} ac={CL.al} months={MO} r1s={r1s} r1e={r1e} r2s={r2s} r2e={r2e}/>;
      if(tab==="conversion")return<AllConversion DS={DS} months={MO} r1s={r1s} r1e={r1e} r2s={r2s} r2e={r2e}/>;
      if(tab==="aov")return<AllAOV DS={DS} months={MO} r1s={r1s} r1e={r1e} r2s={r2s} r2e={r2e}/>;
      if(tab==="funnel")return<AllFunnel DS={DS} months={MO} r1s={r1s} r1e={r1e} r2s={r2s} r2e={r2e}/>;
      if(tab==="traffic")return<AllTraffic DS={DS} months={MO} r1s={r1s} r1e={r1e} r2s={r2s} r2e={r2e}/>;
      if(tab==="campaigns")return<StoreCampaign store={{ut:[]}} ac={CL.al}/>;
    }else{
      var k=proj;
      if(tab==="overview")return<StoreOverview {...sp(k)}/>;
      if(tab==="sales")return<StoreSales {...sp(k)}/>;
      if(tab==="conversion")return<StoreConversion {...sp(k)}/>;
      if(tab==="aov")return<StoreAOV {...sp(k)}/>;
      if(tab==="funnel")return<StoreFunnel {...sp(k)}/>;
      if(tab==="traffic")return<StoreTraffic store={DS[k]} ac={cur.ac} months={MO}/>;
      if(tab==="campaigns")return<StoreCampaign store={DS[k]} ac={cur.ac}/>;
    }
    return null;
  }

  var lblS={fontSize:8,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4};

  return(
    <div style={{minHeight:"100vh",background:CL.bg,color:CL.tx,fontFamily:"system-ui, sans-serif"}}>
      {/* HEADER */}
      <div style={{background:CL.cd,borderBottom:"1px solid "+CL.bd,padding:"12px 16px 10px",position:"sticky",top:0,zIndex:20}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <div>
            <h1 style={{fontSize:16,fontWeight:700,margin:0}}>Shopify Portfolio Dashboard</h1>
            <p style={{fontSize:9,color:CL.mt,margin:"1px 0 0"}}>{MO[0]} - {MO[MO.length-1]} {data.lastUpdated ? " \u00B7 Updated: "+new Date(data.lastUpdated).toLocaleDateString() : ""}</p>
          </div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={function(){setShowDP(!showDP);}} style={{display:"flex",alignItems:"center",gap:5,background:showDP?CL.al+"20":CL.bg,border:"1px solid "+(showDP?CL.al:CL.bd),borderRadius:6,padding:"5px 10px",cursor:"pointer",fontFamily:"inherit",color:showDP?CL.al:CL.mt,fontSize:10,fontWeight:600}}>{"\u{1F4C5}"} Compare</button>
            <button onClick={function(){window.location.reload();}} style={{display:"flex",alignItems:"center",gap:4,background:CL.bg,border:"1px solid "+CL.bd,borderRadius:6,padding:"5px 10px",cursor:"pointer",fontFamily:"inherit",color:CL.mt,fontSize:10,fontWeight:600}}>{"\u{1F504}"} Refresh</button>
          </div>
        </div>
        {showDP&&<div style={{background:CL.bg,border:"1px solid "+CL.bd,borderRadius:8,padding:"10px 12px",marginBottom:8}}>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
            <div style={{flex:1,minWidth:180}}><div style={{...lblS,color:CL.am}}>{"\u25C6"} Period 1</div><div style={{display:"flex",gap:6,alignItems:"center"}}><MonthPicker val={r1s} months={MO} onChange={function(v){setR1s(v);if(v>r1e)setR1e(v);}}/><span style={{fontSize:9,color:CL.dm}}>to</span><MonthPicker val={r1e} months={MO} onChange={function(v){setR1e(v);if(v<r1s)setR1s(v);}}/></div></div>
            <div style={{flex:1,minWidth:180}}><div style={{...lblS,color:CL.al}}>{"\u25B8"} Period 2</div><div style={{display:"flex",gap:6,alignItems:"center"}}><MonthPicker val={r2s} months={MO} onChange={function(v){setR2s(v);if(v>r2e)setR2e(v);}}/><span style={{fontSize:9,color:CL.dm}}>to</span><MonthPicker val={r2e} months={MO} onChange={function(v){setR2e(v);if(v<r2s)setR2s(v);}}/></div></div>
          </div>
          <div style={{display:"flex",gap:16,marginTop:8,fontSize:9}}><span style={{color:CL.am}}>{"\u25C6"} P1: {pLabel(MO,r1s,r1e)}</span><span style={{color:CL.al}}>{"\u25B8"} P2: {pLabel(MO,r2s,r2e)}</span></div>
        </div>}
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {projects.map(function(p2){var active=proj===p2.id;return<button key={p2.id} onClick={function(){setProj(p2.id);setTab("overview");}} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 11px",borderRadius:8,border:active?"2px solid "+p2.ac:"1px solid "+CL.bd,background:active?p2.ac+"15":CL.cd,cursor:"pointer",fontFamily:"inherit"}}><div style={{width:20,height:20,borderRadius:5,background:active?p2.ac:CL.dm+"30",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:active?"#fff":CL.dm}}>{p2.icon}</div><span style={{fontSize:11,fontWeight:600,color:active?CL.tx:CL.mt}}>{p2.label}</span></button>;})}
        </div>
      </div>
      {/* TAB BAR */}
      <div style={{display:"flex",gap:2,padding:"6px 16px",borderBottom:"1px solid "+CL.bd,background:CL.cd,overflowX:"auto",position:"sticky",top:showDP?195:85,zIndex:19}}>
        {tabs.map(function(t){return<button key={t.id} onClick={function(){setTab(t.id);}} style={{padding:"6px 14px",borderRadius:6,border:"none",cursor:"pointer",fontFamily:"inherit",background:tab===t.id?cur.ac:"transparent",color:tab===t.id?"#fff":CL.mt,fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>{t.label}</button>;})}
      </div>
      {/* CONTENT */}
      <div style={{padding:"10px 16px 40px",maxWidth:1200,margin:"0 auto"}}>{renderTab()}</div>
    </div>
  );
}
