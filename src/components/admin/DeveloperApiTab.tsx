import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type Snippet = {
  id: string;
  title: string;
  description: string;
  build: (base: string, profilePattern: string) => string;
};

/* =========================================================================
   Reusable JS fragments (string-built so we can drop them into <script>)
   ========================================================================= */

const FETCH_HELPER = (base: string, profilePattern: string) => `var BASE=${JSON.stringify(base)};
var PROFILE_PATTERN=${JSON.stringify(profilePattern)};
function acProfileUrl(slug){return PROFILE_PATTERN.replace('{slug}',encodeURIComponent(slug||''));}
function acFetchTalents(params){
  var qs=Object.keys(params||{}).filter(function(k){return params[k]!==''&&params[k]!=null;})
    .map(function(k){return encodeURIComponent(k)+'='+encodeURIComponent(params[k]);}).join('&');
  return fetch(BASE+'/api/public/v1/talents'+(qs?'?'+qs:''))
    .then(function(r){return r.json();})
    .then(function(res){
      if(res&&Array.isArray(res.data))return res.data;
      if(Array.isArray(res))return res;
      if(res&&res.error)throw new Error(res.error);
      return [];
    });
}
function acCard(t,opts){
  opts=opts||{};
  var img=t.headshot_url||t.headshot_thumb_url||'';
  var name=t.stage_name||t.full_name||'Talent';
  var ring=opts.vip?'box-shadow:0 0 0 2px #c9a14a inset !important;':'';
  var badge='';
  if(t.featured) badge='<span style="position:absolute;top:10px;left:10px;background:#111;color:#fff;font-size:10px;letter-spacing:.1em;padding:4px 8px;border-radius:999px;text-transform:uppercase;">Featured</span>';
  else if(t.vip) badge='<span style="position:absolute;top:10px;left:10px;background:#c9a14a;color:#111;font-size:10px;letter-spacing:.1em;padding:4px 8px;border-radius:999px;text-transform:uppercase;">VIP</span>';
  return '<a class="ac-card" href="'+acProfileUrl(t.slug)+'" rel="noopener" style="'+ring+'">'
    +'<div style="position:relative;">'
    +(img?'<img src="'+img+'" alt="'+name+'" loading="lazy" />':'<div class="ac-card-ph"></div>')
    +badge
    +'</div>'
    +'<div class="ac-card-body"><div class="ac-card-name">'+name+'</div>'
    +'<div class="ac-card-meta">'+(t.location||'')+(t.nationality?' &middot; '+t.nationality:'')+'</div></div></a>';
}`;

/* =========================================================================
   Section builders
   ========================================================================= */

const AC_RESET_CSS = `<style id="ac-reset">
.ac-wrap,.ac-wrap *{box-sizing:border-box;}
.ac-wrap{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;color:#111;line-height:1.4;max-width:100%;}
.ac-wrap h2{font-size:24px!important;font-weight:700!important;margin:6px 0 0!important;color:#111!important;line-height:1.2!important;}
.ac-wrap p{margin:4px 0 0!important;color:#666;font-size:14px;}
.ac-wrap a{text-decoration:none!important;}
.ac-wrap img{max-width:100%;height:auto;display:block;}
.ac-wrap input,.ac-wrap select,.ac-wrap textarea,.ac-wrap button{font:inherit;color:inherit;}
.ac-eyebrow{font-size:11px;letter-spacing:.25em;text-transform:uppercase;color:#111;}
.ac-section{padding:32px 0;}
.ac-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:18px;}
.ac-card{display:block!important;color:#111!important;background:#fff;border:1px solid #eee;border-radius:14px;overflow:hidden;transition:transform .25s ease,box-shadow .25s ease;}
.ac-card:hover{transform:translateY(-3px);box-shadow:0 12px 30px -12px rgba(0,0,0,.25);}
.ac-card img{width:100%;aspect-ratio:3/4;object-fit:cover;}
.ac-card-ph{width:100%;aspect-ratio:3/4;background:#f4f4f5;}
.ac-card-body{padding:12px 14px;}
.ac-card-name{font-weight:600;font-size:15px;color:#111;}
.ac-card-meta{font-size:12px;color:#666;margin-top:2px;}
.ac-input{width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:10px;background:#fff;color:#111;}
.ac-filters{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:16px;}
@keyframes acFade{from{opacity:0}to{opacity:1}}
</style>`;

function buildHero(base: string, profilePattern: string) {
  return `${AC_RESET_CSS}
<div class="ac-wrap"><div id="ac-hero" style="position:relative;border-radius:18px;overflow:hidden;aspect-ratio:21/9;background:#111;">
  <div id="ac-hero-slides" style="position:absolute;inset:0;"></div>
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.1),rgba(0,0,0,.7));"></div>
  <div id="ac-hero-meta" style="position:absolute;left:0;right:0;bottom:0;padding:32px;color:#fff;"></div>
</div></div>
<script>(function(){${FETCH_HELPER(base, profilePattern)}
var idx=0,items=[];
function render(){
  if(!items.length) return;
  var t=items[idx%items.length];
  var img=t.headshot_url||t.headshot_thumb_url||'';
  document.getElementById('ac-hero-slides').innerHTML=img?'<img src="'+img+'" style="width:100%;height:100%;object-fit:cover;display:block;animation:acFade 1s ease;"/>':'';
  document.getElementById('ac-hero-meta').innerHTML=
    '<div style="font-size:11px;letter-spacing:.25em;text-transform:uppercase;opacity:.8;color:#fff;">Featured Talent</div>'
    +'<div style="font-size:32px;font-weight:700;margin-top:6px;color:#fff;line-height:1.1;">'+(t.stage_name||t.full_name||'Talent')+'</div>'
    +'<div style="opacity:.85;margin-top:4px;color:#fff;">'+(t.location||'')+'</div>'
    +'<a href="'+acProfileUrl(t.slug)+'" rel="noopener" style="display:inline-block;margin-top:14px;background:#fff;color:#111;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;">View profile &rarr;</a>';
}
acFetchTalents({featured_only:'true',limit:8}).then(function(r){items=r.length?r:[];if(!items.length){return acFetchTalents({limit:6}).then(function(x){items=x;render();setInterval(function(){idx++;render();},5000);});}render();setInterval(function(){idx++;render();},5000);});
})();</script>`;
}

function buildVip(base: string, profilePattern: string) {
  return `${AC_RESET_CSS}
<section class="ac-wrap ac-section" id="ac-vip">
  <div style="margin-bottom:20px;">
    <div class="ac-eyebrow" style="color:#c9a14a;">&#9819; VIP Talent</div>
    <h2>Premium roster</h2>
    <p>Highly requested talents selected by Art City Casting.</p>
  </div>
  <div id="ac-vip-grid" class="ac-grid"></div>
</section>
<script>(function(){${FETCH_HELPER(base, profilePattern)}
var el=document.getElementById('ac-vip-grid');
acFetchTalents({vip_only:'true',limit:8}).then(function(items){
  if(!items.length){el.innerHTML='<p style="color:#666;">No VIP talents yet.</p>';return;}
  el.innerHTML=items.map(function(t){return acCard(t,{vip:true});}).join('');
}).catch(function(e){el.innerHTML='<p style="color:#c00;">'+e.message+'</p>';});
})();</script>`;
}

function buildFeatured(base: string, profilePattern: string) {
  return `${AC_RESET_CSS}
<section class="ac-wrap ac-section" id="ac-featured">
  <div style="margin-bottom:20px;">
    <div class="ac-eyebrow">&#10026; Featured</div>
    <h2>Featured talents</h2>
  </div>
  <div id="ac-featured-grid" class="ac-grid"></div>
</section>
<script>(function(){${FETCH_HELPER(base, profilePattern)}
var el=document.getElementById('ac-featured-grid');
acFetchTalents({featured_only:'true',limit:8}).then(function(items){
  if(!items.length){el.innerHTML='<p style="color:#666;">No featured talents yet.</p>';return;}
  el.innerHTML=items.map(function(t){return acCard(t);}).join('');
}).catch(function(e){el.innerHTML='<p style="color:#c00;">'+e.message+'</p>';});
})();</script>`;
}

function buildDirectory(base: string, profilePattern: string) {
  return `${AC_RESET_CSS}
<style>
.ac-chips{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;}
.ac-chip{cursor:pointer;padding:6px 14px;border:1px solid #ddd;border-radius:999px;background:#fff;color:#111;font-size:13px;font-weight:500;user-select:none;transition:all .15s ease;}
.ac-chip:hover{border-color:#111;}
.ac-chip[aria-pressed="true"]{background:#111;color:#fff;border-color:#111;}
.ac-chip.vip[aria-pressed="true"]{background:#c9a14a;border-color:#c9a14a;color:#111;}
</style>
<section class="ac-wrap ac-section" id="ac-dir">
  <div style="margin-bottom:20px;">
    <div class="ac-eyebrow">Directory</div>
    <h2>All represented talents</h2>
  </div>
  <div class="ac-chips" role="group" aria-label="Quick filters">
    <button type="button" class="ac-chip" data-filter="all" aria-pressed="true">All</button>
    <button type="button" class="ac-chip vip" data-filter="vip" aria-pressed="false">&#9819; VIP</button>
    <button type="button" class="ac-chip" data-filter="featured" aria-pressed="false">&#10026; Featured</button>
  </div>
  <div class="ac-filters">
    <input id="ac-q" class="ac-input" placeholder="Search name…" />
    <select id="ac-gender" class="ac-input">
      <option value="">All genders</option><option value="male">Male</option><option value="female">Female</option><option value="non_binary">Non-binary</option><option value="other">Other</option>
    </select>
    <select id="ac-cat" class="ac-input">
      <option value="">All categories</option><option value="actor">Actor</option><option value="actress">Actress</option><option value="model">Model</option><option value="performer">Performer</option><option value="voice_talent">Voice talent</option>
    </select>
    <input id="ac-loc" class="ac-input" placeholder="Location" />
    <input id="ac-lang" class="ac-input" placeholder="Language" />
    <select id="ac-sort" class="ac-input">
      <option value="featured">Sort: Featured</option><option value="newest">Newest</option><option value="name_asc">Name A–Z</option><option value="name_desc">Name Z–A</option>
    </select>
  </div>
  <div id="ac-dir-meta" style="font-size:13px;color:#666;margin-bottom:10px;"></div>
  <div id="ac-dir-grid" class="ac-grid"></div>
</section>
<script>(function(){${FETCH_HELPER(base, profilePattern)}
var ids=['ac-q','ac-gender','ac-cat','ac-loc','ac-lang','ac-sort'];
var grid=document.getElementById('ac-dir-grid'),meta=document.getElementById('ac-dir-meta'),t;
var activeFilter='all',reqId=0;
function load(){
  var myReq=++reqId;
  meta.textContent='Loading…';
  var params={q:document.getElementById('ac-q').value,gender:document.getElementById('ac-gender').value,category:document.getElementById('ac-cat').value,location:document.getElementById('ac-loc').value,language:document.getElementById('ac-lang').value,sort:document.getElementById('ac-sort').value,limit:100};
  if(activeFilter==='vip')params.vip_only='true';
  if(activeFilter==='featured')params.featured_only='true';
  acFetchTalents(params)
    .then(function(items){if(myReq!==reqId)return;meta.textContent=items.length+' '+(items.length===1?'result':'results');grid.innerHTML=items.length?items.map(function(x){return acCard(x,{vip:activeFilter==='vip'});}).join(''):'<p style="color:#666;">No talents found.</p>';})
    .catch(function(e){if(myReq!==reqId)return;meta.textContent='';grid.innerHTML='<p style="color:#c00;">'+e.message+'</p>';});
}
ids.forEach(function(id){var el=document.getElementById(id);if(el.tagName==='SELECT'){el.addEventListener('change',load);}else{el.addEventListener('input',function(){clearTimeout(t);t=setTimeout(load,250);});}});
Array.prototype.forEach.call(document.querySelectorAll('.ac-chip'),function(b){b.addEventListener('click',function(){activeFilter=b.getAttribute('data-filter');Array.prototype.forEach.call(document.querySelectorAll('.ac-chip'),function(x){x.setAttribute('aria-pressed',x===b?'true':'false');});load();});});
load();
})();</script>`;
}

function buildApplyCta(base: string, profilePattern: string) {
  return `${AC_RESET_CSS}
<style id="ac-apply-css">
.aca-wrap{max-width:1100px;margin:0 auto;}
.aca-card{padding:48px 32px;background:linear-gradient(135deg,#fafafa,#f0e9d6);border-radius:20px;text-align:center;}
.aca-eyebrow{font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#c9a14a;font-weight:700;}
.aca-title{font-size:32px!important;line-height:1.15!important;margin:12px 0 0!important;font-weight:800;color:#111;}
.aca-lede{margin:14px auto 0!important;max-width:580px;color:#555;font-size:15px;line-height:1.55;}
.aca-note{margin:10px 0 0;color:#888;font-size:12px;}
.aca-actions{margin-top:22px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}
.aca-btn{padding:13px 24px;border-radius:999px;text-decoration:none!important;font-weight:600;font-size:14px;display:inline-block;cursor:pointer;border:1px solid #111;line-height:1;}
.aca-btn.primary{background:#111;color:#fff!important;}
.aca-btn.secondary{background:#fff;color:#111!important;}
.aca-form-wrap{display:none;margin-top:24px;background:#fff;border-radius:20px;padding:0;text-align:left;box-shadow:0 30px 60px -40px rgba(0,0,0,.25);overflow:hidden;}
.aca-form-wrap.open{display:block;}
.aca-form-head{display:flex;justify-content:space-between;align-items:center;padding:14px 20px;border-bottom:1px solid #eee;gap:10px;flex-wrap:wrap;background:#fafaf7;}
.aca-form-head h3{margin:0;font-size:16px;font-weight:700;color:#111;}
.aca-close{background:transparent;border:0;color:#666;font-size:13px;cursor:pointer;text-decoration:underline;}
.aca-frame{width:100%;height:1800px;border:0;display:block;background:#fff;}
@media(max-width:640px){.aca-frame{height:2400px;}}
</style>
<section class="ac-wrap aca-wrap">
  <div class="aca-card">
    <div class="aca-eyebrow">&#10026; Join the roster</div>
    <h2 class="aca-title">Apply to Join Art City Casting</h2>
    <p class="aca-lede">Actors, actresses, models, voice talents, and performers can submit their information for review. Approved applicants may be added to the Art City Casting talent database.</p>
    <p class="aca-note">You must create an account or sign in before submitting the application form.</p>
    <div class="aca-actions">
      <button type="button" class="aca-btn primary" id="aca-open">Start your application</button>
      <a href="${base}/login" target="_blank" rel="noopener" class="aca-btn secondary">Sign in</a>
    </div>
  </div>

  <div class="aca-form-wrap" id="aca-form-wrap">
    <div class="aca-form-head">
      <h3>Actor Register and Post Feeds</h3>
      <div style="display:flex;gap:12px;align-items:center;">
        <a href="${base}/register" target="_blank" rel="noopener" style="font-size:12px;color:#666;text-decoration:underline;">Open in new tab</a>
        <button type="button" class="aca-close" id="aca-close">Close</button>
      </div>
    </div>
    <iframe id="aca-frame" class="aca-frame" loading="lazy" title="Apply to Art City Casting" allow="clipboard-write; clipboard-read"></iframe>
  </div>
</section>
<script>(function(){
  var BASE=${JSON.stringify(base)};
  var openBtn=document.getElementById('aca-open');
  var closeBtn=document.getElementById('aca-close');
  var wrap=document.getElementById('aca-form-wrap');
  var frame=document.getElementById('aca-frame');
  openBtn.addEventListener('click',function(){
    if(!frame.src)frame.src=BASE+'/register?embed=1';
    wrap.classList.add('open');
    wrap.scrollIntoView({behavior:'smooth',block:'start'});
  });
  closeBtn.addEventListener('click',function(){wrap.classList.remove('open');});
})();</script>`;
}

function buildCastingForm(base: string, profilePattern: string) {
  return `${AC_RESET_CSS}
<div class="ac-wrap"><form id="ac-casting" style="max-width:600px;margin:0 auto;display:grid;gap:10px;">
  <input name="company_name" class="ac-input" placeholder="Company / Production *" required />
  <input name="contact_name" class="ac-input" placeholder="Your name *" required />
  <input name="contact_email" class="ac-input" type="email" placeholder="Email *" required />
  <input name="project_title" class="ac-input" placeholder="Project title" />
  <textarea name="brief" class="ac-input" placeholder="Describe the role / brief *" required rows="5"></textarea>
  <button type="submit" style="padding:12px;background:#111;color:#fff;border:0;border-radius:10px;cursor:pointer;font-weight:600;">Send request</button>
  <p id="ac-casting-msg" style="margin:0;font-size:14px;"></p>
</form></div>
<script>(function(){
  var BASE=${JSON.stringify(base)};
  var f=document.getElementById('ac-casting'),m=document.getElementById('ac-casting-msg');
  f.addEventListener('submit',function(e){
    e.preventDefault();m.textContent='Sending…';m.style.color='#666';
    var d=Object.fromEntries(new FormData(f).entries());
    fetch(BASE+'/api/public/v1/casting-requests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})
      .then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j};});})
      .then(function(x){if(x.ok){m.textContent='Request sent. We will contact you shortly.';m.style.color='#0a0';f.reset();}else{m.textContent=(x.j&&x.j.error)||'Failed to send';m.style.color='#c00';}})
      .catch(function(e){m.textContent=e.message;m.style.color='#c00';});
  });
})();</script>`;
}

function buildAllInOne(base: string, profilePattern: string) {
  return `<!-- Art City — Full Talents experience -->
<div class="ac-wrap" style="padding:24px 0;display:grid;gap:32px;">
${buildHero(base, profilePattern)}
${buildVip(base, profilePattern)}
${buildFeatured(base, profilePattern)}
${buildDirectory(base, profilePattern)}
${buildApplyCta(base, profilePattern)}
</div>`;
}

function buildSingleProfile(base: string, profilePattern: string) {
  return `${AC_RESET_CSS}
<style id="ac-profile-css">
.acp-root{max-width:1200px;margin:0 auto;padding:32px 20px 72px;color:#111;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;}
.acp-root *{box-sizing:border-box;}
.acp-back{display:inline-flex;align-items:center;gap:6px;color:#666;font-size:13px;margin-bottom:24px;text-decoration:none;}
.acp-back:hover{color:#111;}
.acp-hero{display:grid;grid-template-columns:minmax(0,440px) minmax(0,1fr);gap:56px;align-items:start;}
.acp-photo{position:relative;border-radius:22px;overflow:hidden;background:#0e0e0e;box-shadow:0 30px 60px -30px rgba(0,0,0,.4);}
.acp-photo img{width:100%;aspect-ratio:3/4;object-fit:cover;display:block;}
.acp-badges{position:absolute;top:16px;left:16px;display:flex;gap:6px;flex-wrap:wrap;z-index:2;}
.acp-badge{font-size:10px;letter-spacing:.18em;text-transform:uppercase;padding:7px 12px;border-radius:999px;font-weight:700;}
.acp-badge.vip{background:linear-gradient(135deg,#f0cf6a,#b8862a);color:#111;}
.acp-badge.feat{background:rgba(17,17,17,.88);color:#fff;backdrop-filter:blur(8px);}
.acp-eyebrow{font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#999;font-weight:600;}
.acp-name{font-size:clamp(34px,4.6vw,56px);line-height:1.02;font-weight:800;letter-spacing:-.025em;margin:12px 0 16px;color:#0a0a0a;}
.acp-meta{font-size:14px;color:#555;display:flex;flex-wrap:wrap;align-items:center;}
.acp-meta>span{display:inline-flex;align-items:center;}
.acp-meta>span+span:before{content:"";width:3px;height:3px;border-radius:50%;background:#bbb;margin:0 12px;}
.acp-bio{margin-top:22px;font-size:16px;line-height:1.7;color:#2a2a2a;white-space:pre-line;max-width:62ch;}
.acp-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:1px;margin-top:32px;background:#ececec;border:1px solid #ececec;border-radius:16px;overflow:hidden;}
.acp-stat{background:#fff;padding:16px 18px;}
.acp-stat-label{font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#999;font-weight:600;}
.acp-stat-val{margin-top:6px;font-size:17px;font-weight:700;color:#111;line-height:1.3;}
.acp-section{margin-top:52px;}
.acp-h{font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:#111;font-weight:700;margin-bottom:18px;display:flex;align-items:center;gap:14px;}
.acp-h:after{content:"";flex:1;height:1px;background:linear-gradient(90deg,#222,transparent);}
.acp-chips{display:flex;flex-wrap:wrap;gap:8px;}
.acp-chip{font-size:13px;padding:8px 14px;border-radius:999px;background:#f4f4f5;color:#222;border:1px solid #eaeaea;font-weight:500;}
.acp-chip.dark{background:#111;color:#fff;border-color:#111;}
.acp-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;}
.acp-gallery img{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:14px;cursor:zoom-in;transition:transform .4s ease;display:block;}
.acp-gallery img:hover{transform:scale(1.02);}
.acp-lightbox{position:fixed;inset:0;background:rgba(8,8,8,.94);display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px;cursor:zoom-out;}
.acp-lightbox img{max-width:96vw;max-height:92vh;border-radius:8px;}
@media(max-width:820px){.acp-hero{grid-template-columns:1fr;gap:28px;}.acp-root{padding:20px 16px 48px;}}
</style>
<div class="ac-wrap"><div id="ac-profile" class="acp-root" style="min-height:300px;"></div></div>
<script>(function(){${FETCH_HELPER(base, profilePattern)}
function acText(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function acFlat(v){var out=[];function w(x){if(x==null||x==='')return;if(Array.isArray(x)){x.forEach(w);return;}if(typeof x==='object'){Object.keys(x).forEach(function(k){w(x[k]);});return;}out.push(String(x));}w(v);var seen={};return out.filter(function(s){if(seen[s])return false;seen[s]=1;return true;});}
function acChips(v,dark){var arr=acFlat(v);if(!arr.length)return'';return '<div class="acp-chips">'+arr.map(function(s){return '<span class="acp-chip'+(dark?' dark':'')+'">'+acText(s)+'</span>';}).join('')+'</div>';}
function getSlug(){var u=new URL(window.location.href);var s=u.searchParams.get('slug')||u.searchParams.get('talent');if(s)return s;var parts=u.pathname.split('/').filter(Boolean);return parts.length?decodeURIComponent(parts[parts.length-1]):'';}
var slug=getSlug();
var el=document.getElementById('ac-profile');
if(!slug){el.innerHTML='<p style="color:#c00;text-align:center;padding:60px;">No talent slug in URL.</p>';return;}
el.innerHTML='<div style="text-align:center;padding:80px 20px;color:#999;font-size:12px;letter-spacing:.25em;text-transform:uppercase;">Loading profile…</div>';
fetch(BASE+'/api/public/v1/talents/'+encodeURIComponent(slug))
 .then(function(r){return r.json();})
 .then(function(res){
    var payload=(res&&res.data)?res.data:res;
    var t=(payload&&payload.talent)?payload.talent:payload;
    if(!t||t.error||!t.slug){el.innerHTML='<div style="text-align:center;padding:80px 20px;"><h2 style="font-size:32px;font-weight:800;margin:0 0 8px;">Talent not found</h2><p style="color:#666;">We could not find a talent matching this URL.</p></div>';try{document.title='Talent not found';}catch(e){}return;}
    try{document.title=(t.stage_name||t.full_name||'Talent')+' \u2014 Art City';}catch(e){}
    var img=t.headshot_url||t.headshot_thumb_url||'';
    var name=acText(t.stage_name||t.full_name||'Talent');
    var metaBits=[t.location,t.nationality,t.gender].filter(Boolean).map(function(x){return '<span>'+acText(x)+'</span>';}).join('');
    var badges='';
    if(t.vip)badges+='<span class="acp-badge vip">\u2605 VIP</span>';
    if(t.featured)badges+='<span class="acp-badge feat">Featured</span>';
    var stats=[];
    if(t.age)stats.push(['Age',acText(t.age)]);
    if(t.playing_age)stats.push(['Playing age',acText(t.playing_age)]);
    if(t.native_language)stats.push(['Language',acText(t.native_language)]);
    if(t.nationality)stats.push(['Nationality',acText(t.nationality)]);
    var statsHtml=stats.length?'<div class="acp-stats">'+stats.map(function(s){return '<div class="acp-stat"><div class="acp-stat-label">'+s[0]+'</div><div class="acp-stat-val">'+s[1]+'</div></div>';}).join('')+'</div>':'';
    var catChips=(t.categories&&t.categories.length)?'<div class="acp-section"><div class="acp-h">Categories</div>'+acChips(t.categories,true)+'</div>':'';
    var skillChips=t.skills?'<div class="acp-section"><div class="acp-h">Skills</div>'+acChips(t.skills,false)+'</div>':'';
    var gal=(t.gallery_urls&&t.gallery_urls.length)?t.gallery_urls:[];
    var galleryHtml=gal.length?'<div class="acp-section"><div class="acp-h">Gallery</div><div class="acp-gallery">'+gal.map(function(g){return '<img src="'+g+'" loading="lazy" alt="'+name+'"/>';}).join('')+'</div></div>':'';
    var showreel=t.showreel_link?'<div class="acp-section"><div class="acp-h">Showreel</div><a href="'+acText(t.showreel_link)+'" target="_blank" rel="noopener" style="color:#111;text-decoration:underline;word-break:break-all;font-size:14px;">'+acText(t.showreel_link)+'</a></div>':'';
    el.innerHTML=
      '<a href="javascript:history.back()" class="acp-back">\u2190 Back to talents</a>'+
      '<div class="acp-hero">'+
        '<div class="acp-photo">'+(badges?'<div class="acp-badges">'+badges+'</div>':'')+(img?'<img src="'+img+'" alt="'+name+'"/>':'<div style="aspect-ratio:3/4;background:#f4f4f5;"></div>')+'</div>'+
        '<div>'+
          '<div class="acp-eyebrow">Art City Talent</div>'+
          '<h1 class="acp-name">'+name+'</h1>'+
          (metaBits?'<div class="acp-meta">'+metaBits+'</div>':'')+
          (t.bio?'<div class="acp-bio">'+acText(t.bio)+'</div>':'')+
          statsHtml+
        '</div>'+
      '</div>'+
      catChips+skillChips+galleryHtml+showreel;
    el.querySelectorAll('.acp-gallery img').forEach(function(im){im.addEventListener('click',function(){var lb=document.createElement('div');lb.className='acp-lightbox';lb.innerHTML='<img src="'+im.src+'"/>';lb.addEventListener('click',function(){lb.remove();});document.body.appendChild(lb);});});
 })
 .catch(function(e){el.innerHTML='<div style="text-align:center;padding:80px 20px;"><h2 style="font-size:28px;font-weight:800;">Profile unavailable</h2><p style="color:#666;">'+acText(e.message)+'</p></div>';});
})();</script>`;
}

/* =========================================================================
   Snippet list
   ========================================================================= */

const SNIPPETS: Snippet[] = [
  {
    id: "all",
    title: "🎬 Complete Talents experience (all-in-one)",
    description:
      "Hero slideshow + VIP roster + Featured + filterable directory + Apply CTA. One paste — full page.",
    build: buildAllInOne,
  },
  {
    id: "profile",
    title: "👤 Single Talent profile page (fixes /talents/{slug} 404)",
    description:
      "Paste into ONE WordPress page (e.g. /talent-profile/). It reads ?slug= from the URL (or the last path segment) and renders the full profile. Then set the link pattern above to https://artcity.group/talent-profile/?slug={slug}.",
    build: buildSingleProfile,
  },
  {
    id: "hero",
    title: "Hero slideshow",
    description: "Rotating featured talents with name, location, and CTA.",
    build: buildHero,
  },
  {
    id: "vip",
    title: "VIP roster",
    description: "Premium VIP-only talent cards.",
    build: buildVip,
  },
  {
    id: "featured",
    title: "Featured talents",
    description: "Editorially featured cards.",
    build: buildFeatured,
  },
  {
    id: "directory",
    title: "Filterable directory (all talents)",
    description: "Search, gender, category, location, language, sort + grid.",
    build: buildDirectory,
  },
  {
    id: "apply",
    title: "Apply to join (signup CTA)",
    description: "Branded section with Start application + Sign in buttons.",
    build: buildApplyCta,
  },
  {
    id: "casting",
    title: "Casting request form",
    description: "Producers submit casting requests to your admin panel.",
    build: buildCastingForm,
  },
  {
    id: "link",
    title: "Simple link to /talents",
    description: "When you don't want to embed at all.",
    build: (base) => `<a href="${base}/talents" class="button">Browse Talents</a>`,
  },
  {
    id: "iframe",
    title: "Iframe the live /talents page",
    description: "Quickest fallback if you don't want any script on WordPress.",
    build: (base) =>
      `<iframe src="${base}/talents" style="width:100%;height:1400px;border:0;" loading="lazy"></iframe>`,
  },
];

/* =========================================================================
   UI
   ========================================================================= */

export function DeveloperApiTab() {
  const detected = typeof window !== "undefined" ? window.location.origin : "";
  const isPreview = /lovableproject\.com|id-preview--/.test(detected);
  const [base, setBase] = useState(isPreview ? "https://acbe.lovable.app" : detected);
  const [profilePattern, setProfilePattern] = useState(
    "https://artcity.group/talent-profile/?slug={slug}",
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">WordPress embed snippets</CardTitle>
          <CardDescription>
            Paste any snippet into a WordPress Custom HTML block. No API keys
            needed — these endpoints are public. Start with the all-in-one,
            or pick individual sections.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">
              API base URL (where talent data is fetched from)
            </label>
            <Input
              value={base}
              onChange={(e) => setBase(e.target.value.replace(/\/$/, ""))}
              placeholder="https://acbe.lovable.app"
              className="font-mono text-xs"
            />
            {isPreview && (
              <p className="text-xs text-amber-600">
                Preview URLs require Lovable auth. Keep this set to your
                published domain (e.g. <code>https://acbe.lovable.app</code>).
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">
              Talent profile link pattern (where cards link to)
            </label>
            <Input
              value={profilePattern}
              onChange={(e) => setProfilePattern(e.target.value)}
              placeholder="https://artcity.group/talents/{slug}"
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Use <code>{"{slug}"}</code> as the placeholder. Cards and the
              hero CTA will link to this URL on your WordPress site instead
              of the Lovable domain.
            </p>
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 space-y-1">
              <p className="font-semibold">Fix "Page can't be found" on WordPress</p>
              <p>
                WordPress doesn't have a page for every talent slug — that's
                why <code>/talents/aisha-ahmed-100</code> shows a 404. Do this once:
              </p>
              <ol className="list-decimal pl-4 space-y-0.5">
                <li>Create a new WordPress page titled <strong>Talent Profile</strong> with URL <code>/talent-profile/</code>.</li>
                <li>Paste the <strong>Single Talent profile page</strong> snippet below into a Custom HTML block on that page.</li>
                <li>Keep the link pattern above set to <code>{"https://artcity.group/talent-profile/?slug={slug}"}</code>.</li>
              </ol>
              <p>
                Now every card across your site opens the same WordPress page,
                which dynamically loads the right talent. Clean, professional,
                no 404s.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {SNIPPETS.map((s) => (
        <SnippetCard
          key={s.id}
          snippet={s}
          base={base}
          profilePattern={profilePattern}
        />
      ))}
    </div>
  );
}

function SnippetCard({
  snippet,
  base,
  profilePattern,
}: {
  snippet: Snippet;
  base: string;
  profilePattern: string;
}) {
  const code = useMemo(
    () => snippet.build(base, profilePattern),
    [snippet, base, profilePattern],
  );
  const copy = () => {
    navigator.clipboard.writeText(code);
    toast.success("Copied — paste into a WordPress Custom HTML block");
  };
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{snippet.title}</CardTitle>
            <CardDescription>{snippet.description}</CardDescription>
          </div>
          <div className="flex gap-2 shrink-0">
            {(snippet.id === "link" || snippet.id === "iframe") && (
              <Button variant="outline" size="sm" asChild>
                <a href={`${base}/talents`} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open
                </a>
              </Button>
            )}
            <Button size="sm" onClick={copy}>
              <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          readOnly
          value={code}
          className="font-mono text-xs h-44 resize-y"
          onClick={(e) => (e.target as HTMLTextAreaElement).select()}
        />
      </CardContent>
    </Card>
  );
}