// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { AvatarMedal } from "../../components/avatar.jsx";
import { GIcon } from "../../components/icons.jsx";
import { DaricPill } from "../../components/toasts.jsx";
import { SKINS, TITLES, TOKEN_TYPES, CHEAT_SHEETS, getOwnedRewards, getOwnedTokens, SHOP_CATALOG, AVATARS, FRAMES, convertCosmeticDups, convertTokensToPremium } from "../../data/chests.js";
import { shopRarColor, shopItemName, SHOP_SECTIONS, shopItemDesc } from "../../lib/shopCatalog.js";
import { tone } from "../../lib/tone.js";
import { weekId } from "../../lib/util.js";
import { useState, useEffect } from "react";

export function ShopItemVisual(p){
  var item=p.item;
  if(item.cat==="skin"){var sk=SKINS[item.ref]||{};return(<div style={{width:52,height:52,borderRadius:13,background:"linear-gradient(135deg,"+(sk.hex||"#888")+","+(sk.dark||"#555")+")",border:"2px solid "+tone(shopRarColor(item.rarity)),boxShadow:"0 0 14px "+(sk.hex||"#888")+"66"}}/>);}
  if(item.cat==="frame")return <AvatarMedal avatarId="champion" size={50} frameId={item.ref}/>;
  if(item.cat==="title"){var ti=TITLES[item.ref]||{};return(<div style={{width:52,height:52,borderRadius:13,border:"2px solid "+(ti.color||"#888"),display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(180deg,#1a1208,#0a0604)"}}><span style={{fontSize:24,fontWeight:900,color:ti.color||"#888"}}>{"✦"}</span></div>);}
  if(item.cat==="token"){var tk=TOKEN_TYPES[item.ref]||{};return <span style={{fontSize:36}}>{tk.icon}</span>;}
  if(item.cat==="cheat_sheet"){var cs=CHEAT_SHEETS[item.ref]||{};return <span style={{fontSize:36}}>{cs.icon||"📜"}</span>;}
  return null;
}
export function Shop(p){
  var u=p.u;
  var [owned,setOwned]=useState(null);      // player_rewards rows (one-shot ownership)
  var [toks,setToks]=useState({});          // token qty map (cap checks)
  var [busy,setBusy]=useState(false);
  var [confirmItem,setConfirmItem]=useState(null);
  var [flash,setFlash]=useState(null);      // {ok, msg}
  var [shopView,setShopView]=useState("shop"); // "shop" | "conversions"
  var [openSec,setOpenSec]=useState({});       // collapsible shop sections (collapsed by default)

  function refreshOwned(){
    Promise.all([
      getOwnedRewards(u.name,u.classCode||"visitor"),
      getOwnedTokens(u.name,u.classCode||"visitor"),
    ]).then(function(arr){setOwned(arr[0]||[]);setToks(arr[1]||{});})
    .catch(function(e){console.warn("[SHOP] refreshOwned failed:",e&&e.message);setOwned([]);});
  }
  useEffect(function(){refreshOwned();},[]);

  function isOwned(item){
    if(item.cat==="token"||!owned)return false;
    return owned.some(function(r){return r.reward_type===item.cat&&r.reward_id===item.ref;});
  }
  function atCap(item){
    if(item.cat!=="token")return false;
    var cap=(TOKEN_TYPES[item.ref]&&TOKEN_TYPES[item.ref].cap)||1;
    return (toks[item.ref]||0)>=cap;
  }
  function showFlash(ok,msg){setFlash({ok:ok,msg:msg});setTimeout(function(){setFlash(null);},2600);}

  var ERRMAP={insufficient_marks:"Not enough Darics",already_owned:"Already owned",at_cap:"Already at maximum",weekly_cap:"Weekly limit reached (2/week)",no_student:"Account error",visitor:"Unavailable in visitor mode",empty_response:"No response, try again"};
  function doBuy(item){
    setConfirmItem(null);
    if(busy)return;
    setBusy(true);
    Promise.resolve(p.buy(item)).then(function(res){
      setBusy(false);
      if(res&&res.ok){showFlash(true,"Acquired — "+shopItemName(item));refreshOwned();}
      else{showFlash(false,ERRMAP[res&&res.error]||"Purchase failed, try again");}
    });
  }

  // Conversions sub-view : reuse ConversionsView (its back calls setView(null) → return to shop)
  if(shopView==="conversions"){
    return(<ConversionsView u={u} setView={function(){setShopView("shop");refreshOwned();}} setAvatar={p.setAvatar}/>);
  }

  var marks=u.arenaMarks||0;
  var loading=owned===null;
  var goldBtn={background:"linear-gradient(135deg,#e8c45a,#a8801f)",color:"#1a1208"};
  return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <button className="back-btn" onClick={p.back}>{"←"} Back</button>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:8}}>
      <h1 className="out" style={{fontWeight:800,fontSize:23,margin:0,display:"flex",alignItems:"center",gap:8}}><GIcon name="daric" size={24} color="var(--gold)"/> Arena Shop</h1>
      <DaricPill marks={marks}/>
    </div>
    <p style={{fontSize:12,color:"var(--t2)",marginTop:0,marginBottom:18,lineHeight:1.5}}>Spend Darics earned from chests and progression. Shop cosmetics never drop in chests.</p>

    <button onClick={function(){setShopView("conversions");}} className="crd" style={{width:"100%",padding:"12px 14px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",marginBottom:18,background:"rgba(192,96,240,.05)",border:"1px solid rgba(192,96,240,.2)"}}>
      <GIcon name="gem-necklace" size={22} color={tone("#c060f0")}/>
      <div style={{flex:1,textAlign:"left"}}>
        <div style={{fontSize:13,fontWeight:700,color:tone("#c060f0")}}>Conversions</div>
        <div style={{fontSize:10,color:"var(--t2)"}}>Duplicates {"→"} tokens · 5 tokens {"→"} premium</div>
      </div>
      <span style={{color:"var(--t3)",fontSize:18}}>{"›"}</span>
    </button>

    {loading&&<p style={{color:"var(--t3)",textAlign:"center",padding:40}}>Loading shop...</p>}

    {!loading&&SHOP_SECTIONS.map(function(sec){
      var items=SHOP_CATALOG.filter(function(it){return (it.group||it.cat)===sec.key;});
      if(items.length===0)return null;
      var open=!!openSec[sec.key];
      return(<div key={sec.key} style={{marginBottom:10,borderRadius:12,border:"1px solid var(--bdr)",overflow:"hidden",background:"var(--bg2)"}}>
        <button onClick={function(){var nv=Object.assign({},openSec);nv[sec.key]=!open;setOpenSec(nv);}}
          style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",background:"transparent",border:"none",cursor:"pointer",color:"var(--t1)",fontFamily:"inherit"}}>
          <span style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1.5,color:"var(--t2)"}}>{sec.label} <span style={{color:"var(--t3)",marginLeft:4,fontWeight:600}}>{items.length}</span></span>
          <span style={{fontSize:14,color:"var(--gold)",display:"inline-block",transform:open?"rotate(0deg)":"rotate(-90deg)",transition:"transform .2s"}}>{"▾"}</span>
        </button>
        {open&&<div style={{padding:"4px 14px 16px",borderTop:"1px solid var(--bdr)",display:"flex",flexDirection:"column",gap:10}}>
          {items.map(function(item){
            var ownedFlag=isOwned(item);
            var capFlag=atCap(item);
            var affordable=marks>=item.price;
            // Daily Doubler — 2/week purchase cap (in addition to the stock cap)
            var weekLocked=item.ref==="daily_doubler"&&(function(){var b=u.boosts||{};var wk=weekId();return ((b.ddWeekId===wk)?(b.ddWeekCount||0):0)>=2;})();
            var locked=ownedFlag||capFlag||weekLocked;
            return(<div key={item.item_id} className="crd" style={{padding:"12px 14px",display:"flex",alignItems:"center",gap:12,opacity:(locked||!affordable)?.6:1}}>
              <div style={{flexShrink:0,width:52,height:52,display:"flex",alignItems:"center",justifyContent:"center"}}><ShopItemVisual item={item}/></div>
              <div style={{flex:1,minWidth:0,overflow:"hidden"}}>
                <div style={{fontSize:14,fontWeight:700,color:"var(--t1)",marginBottom:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{shopItemName(item)}</div>
                <div style={{fontSize:10,color:"var(--t2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{shopItemDesc(item)}</div>
              </div>
              <div style={{flexShrink:0,textAlign:"right"}}>
                {locked?(
                  <span style={{fontSize:11,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:.5}}>{ownedFlag?"Owned":weekLocked?"Weekly max":"Max"}</span>
                ):(
                  <button onClick={function(){setConfirmItem(item);}} disabled={!affordable||busy}
                    style={Object.assign({fontSize:12,fontWeight:800,padding:"8px 14px",borderRadius:99,border:"none",whiteSpace:"nowrap",cursor:affordable?"pointer":"not-allowed",display:"inline-flex",alignItems:"center",gap:4},affordable?goldBtn:{background:"rgba(224,82,82,.12)",color:"var(--red)"})}>
                    <GIcon name="daric" size={13} color={affordable?"#1a1208":"var(--red)"}/> {item.price}
                  </button>
                )}
              </div>
            </div>);
          })}
        </div>}
      </div>);
    })}

    {confirmItem&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:9998,display:"flex",alignItems:"center",justifyContent:"center",padding:24}} onClick={function(){if(!busy)setConfirmItem(null);}}>
      <div className="crd" style={{maxWidth:320,textAlign:"center",background:"var(--bg2)"}} onClick={function(e){e.stopPropagation();}}>
        <div style={{marginBottom:12,display:"flex",justifyContent:"center"}}><ShopItemVisual item={confirmItem}/></div>
        <h3 className="out" style={{fontSize:18,fontWeight:800,margin:"0 0 6px",color:"var(--t1)"}}>{shopItemName(confirmItem)}</h3>
        <p style={{fontSize:13,color:"var(--t2)",margin:"0 0 16px"}}>Buy for <b style={{color:"var(--gold)"}}>{confirmItem.price}</b> Darics?</p>
        <div style={{display:"flex",gap:10}}>
          <button className="btn2" style={{flex:1}} disabled={busy} onClick={function(){setConfirmItem(null);}}>Cancel</button>
          <button disabled={busy} onClick={function(){doBuy(confirmItem);}} style={Object.assign({flex:1,fontSize:14,fontWeight:800,padding:"12px",borderRadius:12,border:"none",cursor:"pointer"},goldBtn)}>{busy?"...":"Confirm"}</button>
        </div>
      </div>
    </div>}

    {flash&&<div style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",padding:"12px 18px",borderRadius:10,background:flash.ok?"rgba(46,180,100,.15)":"rgba(220,58,80,.15)",border:"1px solid "+(flash.ok?"var(--green)":"var(--red)"),color:flash.ok?"var(--green)":"var(--red)",fontSize:13,fontWeight:700,zIndex:1000,maxWidth:"90%",textAlign:"center"}}>{flash.msg}</div>}
  </div>);
}
export function ConversionsView(p){
  var u=p.u;
  var [rewardsRows,setRewardsRows]=useState(null);
  var [tokens,setTokens]=useState(null);
  var [busy,setBusy]=useState(false);
  var [toast,setToast]=useState(null);

  function refresh(){
    setRewardsRows(null);setTokens(null);
    Promise.all([
      getOwnedRewards(u.name,u.classCode||"visitor"),
      getOwnedTokens(u.name,u.classCode||"visitor"),
    ]).then(function(arr){
      setRewardsRows(arr[0]||[]);
      setTokens(arr[1]||{});
    });
  }
  useEffect(function(){refresh();},[]);

  function showToast(t){setToast(t);setTimeout(function(){setToast(null);},2400);}
  // i18n hint : Conversions UI in EN per app policy ; rarity/info labels delegated
  // to TOKEN_TYPES.name and the rest are short imperatives.

  // Group dups : map "type:id" → count
  var dupGroups=[];
  if(rewardsRows){
    var counts={};
    rewardsRows.forEach(function(r){
      var k=r.reward_type+":"+r.reward_id;
      counts[k]=(counts[k]||0)+1;
    });
    Object.keys(counts).forEach(function(k){
      // Need 4+ instances to convert : 3 dups consumed + 1 original kept. The plan's
      // "3 doublons" means 3 EXTRAS beyond the original — without this guard, converting
      // at count=3 would wipe out the user's only copy.
      if(counts[k]<4)return;
      var parts=k.split(":");
      var type=parts[0], id=parts.slice(1).join(":");
      // Only allow trade-in for cosmetics (avatar/skin/frame/title) — cheat sheets stay rare
      if(["avatar","skin","frame","title"].indexOf(type)===-1)return;
      var name="";
      if(type==="avatar"&&AVATARS[id])name=AVATARS[id].name;
      else if(type==="skin"&&SKINS[id])name=SKINS[id].name;
      else if(type==="frame"&&FRAMES[id])name=FRAMES[id].name;
      else if(type==="title"&&TITLES[id])name=TITLES[id].name;
      else name=id;
      dupGroups.push({type:type,id:id,name:name,count:counts[k]});
    });
    dupGroups.sort(function(a,b){return b.count-a.count;});
  }

  // Premium-eligible non-premium tokens (qty >= 5)
  var convertibleTokens=[];
  if(tokens){
    Object.keys(TOKEN_TYPES).forEach(function(tt){
      if(TOKEN_TYPES[tt].premium)return;
      var qty=tokens[tt]||0;
      if(qty>=5)convertibleTokens.push({type:tt,qty:qty,info:TOKEN_TYPES[tt]});
    });
  }

  async function doConvertCosmetic(group){
    if(busy)return;
    setBusy(true);
    var res=await convertCosmeticDups(u.name,u.classCode||"visitor",group.type,group.id);
    setBusy(false);
    if(!res.ok){showToast({err:true,msg:"Failed: "+(res.error||"unknown")});return;}
    if(res.xpFallback){
      // All tokens capped → grant XP to user profile directly
      var c=JSON.parse(JSON.stringify(u));c.xp+=res.xpFallback;c.weeklyXp+=res.xpFallback;p.setAvatar(c);
      showToast({err:false,msg:"+"+res.xpFallback+" XP (tokens maxed)"});
    }else{
      var ti=TOKEN_TYPES[res.token];
      showToast({err:false,msg:"+1 "+(ti?ti.name:res.token)});
    }
    refresh();
  }
  async function doConvertTokens(item){
    if(busy)return;
    setBusy(true);
    var res=await convertTokensToPremium(u.name,u.classCode||"visitor",item.type);
    setBusy(false);
    if(!res.ok){
      var msgMap={all_premium_capped:"All premium tokens maxed",not_enough_tokens:"Not enough tokens"};
      showToast({err:true,msg:msgMap[res.error]||"Failed: "+res.error});return;
    }
    var ti=TOKEN_TYPES[res.token];
    showToast({err:false,msg:"+1 "+(ti?ti.name:res.token)+" (premium)"});
    refresh();
  }

  var loading=rewardsRows===null||tokens===null;
  return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
      <button onClick={function(){p.setView(null);}} style={{background:"none",border:"none",color:"var(--cyan)",fontSize:22,cursor:"pointer",padding:0,lineHeight:1}}>{"←"}</button>
      <h1 className="out" style={{fontWeight:800,fontSize:20,margin:0}}>Conversions</h1>
    </div>
    <p style={{fontSize:12,color:"var(--t2)",marginTop:0,marginBottom:24,lineHeight:1.5}}>
      Anti-frustration : trade your duplicates for useful tokens, or 5 tokens for a premium one.
    </p>

    {loading&&<p style={{color:"var(--t3)",textAlign:"center",padding:40}}>Loading...</p>}

    {!loading&&<>
      {/* ── 3 dups → 1 token ── */}
      <div style={{fontSize:11,color:"var(--t2)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Duplicate cosmetics · 3 dups → 1 token</div>
      <div style={{fontSize:11,color:"var(--t3)",marginBottom:14,lineHeight:1.5}}>You always keep at least 1 copy. Shown only when you have ≥ 4 copies of the same item.</div>
      {dupGroups.length===0?(
        <div className="crd" style={{padding:16,textAlign:"center",marginBottom:32}}>
          <p style={{color:"var(--t3)",fontSize:12,margin:0,lineHeight:1.5}}>No tradeable duplicates yet.</p>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:32}}>
          {dupGroups.map(function(g){
            // Per-type visual mini-preview
            var visual=null;
            if(g.type==="avatar"&&AVATARS[g.id])visual=<AvatarMedal avatarId={g.id} size={32}/>;
            else if(g.type==="skin"&&SKINS[g.id])visual=<div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,"+SKINS[g.id].hex+","+SKINS[g.id].dark+")"}}/>;
            else if(g.type==="frame"&&FRAMES[g.id])visual=<AvatarMedal avatarId="champion" size={28} frameId={g.id}/>;
            else if(g.type==="title"&&TITLES[g.id])visual=<span style={{fontSize:18,color:tone(TITLES[g.id].color)}}>{"✦"}</span>;
            return(<div key={g.type+g.id} className="crd" style={{padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}>
              <div style={{flexShrink:0,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center"}}>{visual}</div>
              <div style={{flex:1,minWidth:0,overflow:"hidden"}}>
                <div style={{fontSize:13,fontWeight:700,color:"var(--t1)",marginBottom:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{g.name}</div>
                <div style={{fontSize:10,color:"var(--t2)",textTransform:"uppercase",letterSpacing:1}}>{g.type} · ×{g.count} → ×{g.count-3}</div>
              </div>
              <button onClick={function(){doConvertCosmetic(g);}} disabled={busy} className="btn2"
                style={{fontSize:11,padding:"7px 12px",flexShrink:0,whiteSpace:"nowrap"}}>
                {busy?"...":"−3 → token"}
              </button>
            </div>);
          })}
        </div>
      )}

      {/* ── 5 tokens → 1 premium ── */}
      <div style={{fontSize:11,color:"var(--t2)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Non-premium tokens · 5 → 1 premium</div>
      {convertibleTokens.length===0?(
        <div className="crd" style={{padding:16,textAlign:"center"}}>
          <p style={{color:"var(--t3)",fontSize:12,margin:0,lineHeight:1.5}}>Not enough tokens yet. Stack at least 5 of the same type to convert.</p>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {convertibleTokens.map(function(item){
            return(<div key={item.type} className="crd" style={{padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:26,flexShrink:0,width:36,textAlign:"center"}}>{item.info.icon}</span>
              <div style={{flex:1,minWidth:0,overflow:"hidden"}}>
                <div style={{fontSize:13,fontWeight:700,color:"var(--t1)",marginBottom:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.info.name}</div>
                <div style={{fontSize:10,color:"var(--t2)",textTransform:"uppercase",letterSpacing:1}}>{"×"+item.qty}</div>
              </div>
              <button onClick={function(){doConvertTokens(item);}} disabled={busy} className="btn2"
                style={{fontSize:11,padding:"7px 12px",flexShrink:0,whiteSpace:"nowrap"}}>
                {busy?"...":"−5 → premium"}
              </button>
            </div>);
          })}
        </div>
      )}
    </>}

    {toast&&<div style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",padding:"12px 18px",borderRadius:10,background:toast.err?"rgba(220,58,80,.15)":"rgba(46,180,100,.15)",border:"1px solid "+(toast.err?"var(--red)":"var(--green)"),color:toast.err?"var(--red)":"var(--green)",fontSize:13,fontWeight:700,zIndex:1000}}>{toast.msg}</div>}
  </div>);
}
