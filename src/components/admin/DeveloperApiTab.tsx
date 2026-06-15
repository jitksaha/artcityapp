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
.aca-wrap{max-width:1200px;margin:0 auto;}
.aca-shell{background:#fff;border:0;border-radius:0;overflow:visible;}
.aca-frame{width:100%;border:0;display:block;background:#fff;height:1200px;}
</style>
<section class="ac-wrap aca-wrap">
  <div class="aca-shell">
    <iframe
      id="aca-frame"
      class="aca-frame"
      src="${base}/register?embed=1"
      title="Apply to Art City Casting"
      loading="lazy"
      allow="camera; microphone; clipboard-write; clipboard-read"
      referrerpolicy="no-referrer-when-downgrade"
    ></iframe>
  </div>
</section>
<script>(function(){
  var frame=document.getElementById('aca-frame');
  if(!frame)return;
  window.addEventListener('message',function(e){
    try{
      var d=e.data;if(!d)return;
      if(typeof d==='string'){try{d=JSON.parse(d);}catch(_){return;}}
      if(d&&d.type==='ac:resize'&&typeof d.height==='number'&&d.height>200){
        frame.style.height=Math.min(d.height+24,8000)+'px';
      }
    }catch(_){}
  });
})();</script>`;
}

function buildCastingForm(base: string, profilePattern: string) {
  return `${AC_RESET_CSS}
<div class="ac-wrap"><form id="ac-casting" style="max-width:600px;margin:0 auto;display:grid;gap:10px;">
  <input name="company_name" class="ac-input" placeholder="Company / Production *" required />
  <input name="contact_person" class="ac-input" placeholder="Your name *" required />
  <input name="email" class="ac-input" type="email" placeholder="Email *" required />
  <input name="production_title" class="ac-input" placeholder="Project title *" required />
  <textarea name="brief" class="ac-input" placeholder="Describe the role / brief *" required rows="5"></textarea>
  <button type="submit" style="padding:12px;background:#111;color:#fff;border:0;border-radius:10px;cursor:pointer;font-weight:600;">Send request</button>
  <p id="ac-casting-msg" style="margin:0;font-size:14px;"></p>
</form></div>
<script>(function(){
  var BASE=${JSON.stringify(base)};
  var f=document.getElementById('ac-casting'),m=document.getElementById('ac-casting-msg');
  f.addEventListener('submit',function(e){
    e.preventDefault();m.textContent='Sending…';m.style.color='#666';
    var raw=Object.fromEntries(new FormData(f).entries());
    var d={
      company_name:raw.company_name||undefined,
      contact_person:raw.contact_person,
      email:raw.email,
      production_title:raw.production_title,
      message:raw.brief||undefined,
      role_description:raw.brief||undefined
    };
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
.acp-root{max-width:1100px;margin:0 auto;padding:32px 20px 72px;color:#111;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;}
.acp-root *{box-sizing:border-box;}
.acp-header{display:flex;flex-direction:column;gap:24px;}
@media(min-width:768px){.acp-header{flex-direction:row;}}
.acp-photo{width:100%;border-radius:12px;overflow:hidden;background:#f4f4f5;}
@media(min-width:768px){.acp-photo{width:320px;flex-shrink:0;}}
.acp-photo img{width:100%;aspect-ratio:3/4;object-fit:cover;display:block;}
.acp-main{flex:1;display:flex;flex-direction:column;gap:12px;}
.acp-title-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.acp-name{font-size:30px;font-weight:600;letter-spacing:-.025em;margin:0;color:#0a0a0a;line-height:1.1;}
.acp-badge{display:inline-flex;align-items:center;font-size:11px;font-weight:600;padding:3px 10px;border-radius:6px;}
.acp-badge.vip{background:#111;color:#fff;}
.acp-badge.feat{background:#f4f4f5;color:#222;border:1px solid #e4e4e7;}
.acp-meta-line{font-size:14px;color:#71717a;}
.acp-bio{font-size:14px;line-height:1.65;color:#3f3f46;margin:0;}
.acp-kv-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px 18px;padding-top:6px;}
@media(min-width:640px){.acp-kv-grid{grid-template-columns:repeat(3,1fr);}}
.acp-kv{display:flex;flex-direction:column;}
.acp-kv-label{font-size:10px;font-weight:500;letter-spacing:.05em;text-transform:uppercase;color:#a1a1aa;}
.acp-kv-val{font-size:14px;color:#18181b;text-transform:capitalize;margin-top:2px;}
.acp-kv-empty{font-style:italic;color:#a1a1aa;font-size:14px;}
.acp-cta{margin-top:8px;display:flex;flex-direction:column;gap:8px;}
.acp-cta a{display:inline-block;background:#111;color:#fff;padding:10px 18px;border-radius:8px;font-weight:500;font-size:14px;text-align:center;}
.acp-cta a:hover{background:#000;}
.acp-cta-note{font-size:12px;color:#71717a;border:1px solid rgba(17,17,17,.15);background:rgba(17,17,17,.03);padding:10px 12px;border-radius:8px;}
.acp-section{margin-top:36px;}
.acp-section h2{font-size:18px;font-weight:600;margin:0 0 12px;color:#111;}
.acp-card{border:1px solid #e4e4e7;background:#fff;border-radius:10px;padding:16px;}
.acp-detail-grid{display:grid;grid-template-columns:repeat(1,1fr);gap:12px;}
@media(min-width:640px){.acp-detail-grid{grid-template-columns:repeat(2,1fr);}}
@media(min-width:900px){.acp-detail-grid{grid-template-columns:repeat(3,1fr);}}
.acp-tabs{display:flex;gap:4px;border-bottom:1px solid #e4e4e7;margin-bottom:14px;flex-wrap:wrap;}
.acp-tab{padding:8px 14px;font-size:13px;font-weight:500;color:#71717a;border:0;background:transparent;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;}
.acp-tab[aria-selected="true"]{color:#111;border-bottom-color:#111;}
.acp-tab[disabled]{opacity:.4;cursor:not-allowed;}
.acp-tab-count{font-size:11px;color:#a1a1aa;margin-left:4px;}
.acp-gallery{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;}
@media(min-width:640px){.acp-gallery{grid-template-columns:repeat(3,1fr);}}
@media(min-width:900px){.acp-gallery{grid-template-columns:repeat(4,1fr);}}
.acp-gallery button{padding:0;border:1px solid #e4e4e7;background:#f4f4f5;border-radius:8px;overflow:hidden;cursor:zoom-in;}
.acp-gallery img{width:100%;aspect-ratio:3/4;object-fit:cover;display:block;transition:transform .3s ease;}
.acp-gallery button:hover img{transform:scale(1.03);}
.acp-empty{font-size:14px;color:#71717a;text-align:center;padding:24px;}
.acp-chips{display:flex;flex-wrap:wrap;gap:6px;}
.acp-chip{font-size:12px;padding:4px 10px;border-radius:6px;background:#f4f4f5;color:#222;border:1px solid #e4e4e7;text-transform:capitalize;}
.acp-cred-list{list-style:none;padding:0;margin:8px 0 0;display:flex;flex-direction:column;gap:6px;}
.acp-cred-list li{font-size:14px;border-left:2px solid #e4e4e7;padding-left:12px;}
.acp-cred-meta{color:#71717a;}
.acp-lightbox{position:fixed;inset:0;background:rgba(8,8,8,.94);display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px;cursor:zoom-out;}
.acp-lightbox img{max-width:96vw;max-height:92vh;border-radius:8px;}
.acp-back{display:inline-flex;align-items:center;gap:6px;color:#71717a;font-size:13px;margin-bottom:24px;text-decoration:none;}
.acp-back:hover{color:#111;}
</style>
<div class="ac-wrap"><div id="ac-profile" class="acp-root" style="min-height:300px;"></div></div>
<script>(function(){
var BASE=${JSON.stringify(base)};
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function pretty(v){if(v==null||v==='')return '<span class="acp-kv-empty">Not provided</span>';if(Array.isArray(v)){var c=v.filter(function(x){return x!=null&&x!=='';});if(!c.length)return '<span class="acp-kv-empty">Not provided</span>';return c.map(function(x){return esc(String(x).replace(/_/g,' '));}).join(', ');}if(typeof v==='boolean')return v?'Yes':'No';return esc(String(v).replace(/_/g,' '));}
function kv(label,val){return '<div class="acp-kv"><span class="acp-kv-label">'+esc(label)+'</span><span class="acp-kv-val">'+pretty(val)+'</span></div>';}
function detail(label,val){return '<div><div class="acp-kv-label">'+esc(label)+'</div><div class="acp-kv-val" style="margin-top:2px;">'+pretty(val)+'</div></div>';}
function getSlug(){var u=new URL(window.location.href);var s=u.searchParams.get('slug')||u.searchParams.get('talent');if(s)return s;var parts=u.pathname.split('/').filter(Boolean);return parts.length?decodeURIComponent(parts[parts.length-1]):'';}
function pick(o){for(var i=1;i<arguments.length;i++){var k=arguments[i];if(o&&o[k]!=null&&o[k]!=='')return o[k];}return undefined;}
function credList(arr){if(!arr||!arr.length)return '<p class="acp-kv-empty">Not provided</p>';return '<ul class="acp-cred-list">'+arr.map(function(c){var bits=[];if(c.role)bits.push('· '+esc(c.role));if(c.director)bits.push('· dir. '+esc(c.director));if(c.year)bits.push('· '+esc(c.year));if(c.productionCompany)bits.push('· '+esc(c.productionCompany));return '<li><span style="font-weight:500;">'+esc(c.projectName||'Untitled')+'</span> <span class="acp-cred-meta">'+bits.join(' ')+'</span></li>';}).join('')+'</ul>';}
function section(title,inner){return '<section class="acp-section"><h2>'+esc(title)+'</h2>'+inner+'</section>';}
function detailCard(items){return '<div class="acp-card"><div class="acp-detail-grid">'+items.join('')+'</div></div>';}
function renderGallery(items,emptyText){if(!items.length)return '<p class="acp-empty">'+esc(emptyText||'No photos in this category.')+'</p>';return '<div class="acp-gallery">'+items.map(function(m,i){var thumb=m.thumbnail_url||m.url;var eager=i<4;return '<button type="button" data-src="'+esc(m.url)+'" aria-label="Open photo"><img src="'+esc(thumb)+'" alt="" width="300" height="400" loading="'+(eager?'eager':'lazy')+'" decoding="async" fetchpriority="'+(eager?'high':'low')+'"/></button>';}).join('')+'</div>';}
function preconnectFor(url){try{var u=new URL(url);var key='acp-pc-'+u.origin;if(document.getElementById(key))return;var l=document.createElement('link');l.id=key;l.rel='preconnect';l.href=u.origin;l.crossOrigin='';document.head.appendChild(l);}catch(e){}}

var slug=getSlug();
var el=document.getElementById('ac-profile');
if(!slug){el.innerHTML='<p style="color:#c00;text-align:center;padding:60px;">No talent slug in URL.</p>';return;}
el.innerHTML='<div style="text-align:center;padding:80px 20px;color:#999;font-size:12px;letter-spacing:.25em;text-transform:uppercase;">Loading profile…</div>';
fetch(BASE+'/api/public/v1/talents/'+encodeURIComponent(slug))
 .then(function(r){return r.json();})
 .then(function(res){
    var payload=(res&&res.data)?res.data:res;
    var t=(payload&&payload.talent)?payload.talent:payload;
    var media=(payload&&payload.media)?payload.media:[];
    if(!t||t.error||!t.slug){el.innerHTML='<div style="text-align:center;padding:80px 20px;"><h2 style="font-size:32px;font-weight:800;margin:0 0 8px;">Talent not found</h2><p style="color:#666;">We could not find a talent matching this URL.</p></div>';try{document.title='Talent not found';}catch(e){}return;}
    try{document.title=(t.stage_name||t.full_name||'Talent')+' \u2014 Art City';}catch(e){}

    var name=esc(t.stage_name||t.full_name||'Talent');
    var img=t.headshot_url||t.headshot_thumb_url||'';
    if(img)preconnectFor(img);
    if(media[0]&&media[0].url)preconnectFor(media[0].url);
    var metaParts=[t.age&&(t.age+' yrs'),t.gender&&String(t.gender).replace(/_/g,' '),t.playing_age&&('playing '+t.playing_age),t.location,t.nationality].filter(Boolean).map(esc);
    var badges='';
    if(t.vip)badges+='<span class="acp-badge vip">VIP</span>';
    if(t.featured)badges+='<span class="acp-badge feat">Featured</span>';

    var galHead=[],galMed=[],galFull=[];
    media.forEach(function(m){if(m.kind==='headshot')galHead.push(m);else if(m.kind==='medium_shot'||m.kind==='medium')galMed.push(m);else if(m.kind==='full_body'||m.kind==='fullbody')galFull.push(m);});
    var voiceReel=null,cvFile=null;
    media.forEach(function(m){if(m.kind==='voice_reel'&&!voiceReel)voiceReel=m;if(m.kind==='cv'&&!cvFile)cvFile=m;});
    var totalGal=galHead.length+galMed.length+galFull.length;

    // Header
    var heroThumb=t.headshot_thumb_url||t.headshot_url||'';
    var header='<header class="acp-header">'+
      (img?'<div class="acp-photo"><img src="'+esc(heroThumb)+'" alt="'+name+'" width="320" height="427" loading="eager" fetchpriority="high" decoding="async"/></div>':'')+
      '<div class="acp-main">'+
        '<div class="acp-title-row"><h1 class="acp-name">'+name+'</h1>'+badges+'</div>'+
        (metaParts.length?'<p class="acp-meta-line">'+metaParts.join(' \u00b7 ')+'</p>':'')+
        (t.bio?'<p class="acp-bio">'+esc(t.bio)+'</p>':'')+
        '<div class="acp-kv-grid">'+
          kv('Age',t.age)+kv('Playing age',t.playing_age)+kv('Gender',t.gender)+
          kv('Location',t.location)+kv('Nationality',t.nationality)+kv('Native language',t.native_language)+
        '</div>'+
      '</div>'+
    '</header>';

    // Gallery with tabs
    var galleryHtml='';
    if(totalGal>0){
      var tabs=[['all','All',totalGal],['headshot','Headshots',galHead.length],['medium','Medium shots',galMed.length],['fullbody','Full-body',galFull.length]];
      galleryHtml=section('Gallery',
        '<div class="acp-tabs" role="tablist">'+
          tabs.map(function(tb){return '<button type="button" class="acp-tab" data-tab="'+tb[0]+'" aria-selected="'+(tb[0]==='all'?'true':'false')+'"'+(tb[2]===0&&tb[0]!=='all'?' disabled':'')+'>'+tb[1]+'<span class="acp-tab-count">('+tb[2]+')</span></button>';}).join('')+
        '</div>'+
        '<div id="acp-gal-content">'+renderGallery(galHead.concat(galMed).concat(galFull))+'</div>'
      );
    }

    // Showreel
    var showreel=t.showreel_link?section('Showreel','<a href="'+esc(t.showreel_link)+'" target="_blank" rel="noopener" style="color:#111;text-decoration:underline;word-break:break-all;font-size:14px;">'+esc(t.showreel_link)+'</a>'):'';

    // Categories
    var cats=Array.isArray(t.categories)&&t.categories.length
      ? section('Categories','<div class="acp-chips">'+t.categories.map(function(c){return '<span class="acp-chip">'+esc(String(c).replace(/_/g,' '))+'</span>';}).join('')+'</div>')
      : '';

    var ph=t.physical||{},sk=t.skills||{},la=t.languages||{},ex=t.experience||{},ag=t.agent||{},av=t.availability||{},ex2=t.extra_notes||{};

    var physicalSec=section('Physical Attributes',detailCard([
      detail('Height',ph.height),detail('Weight',ph.weight),
      detail('Eye color',pick(ph,'eyeColor','eye_color')),detail('Hair color',pick(ph,'hairColor','hair_color')),
      detail('Hair length',pick(ph,'hairLength','hair_length')),detail('Skin tone',pick(ph,'skinTone','skin_tone')),
      detail('Body type',pick(ph,'bodyType','body_type')),detail('Distinguishing features',pick(ph,'distinguishingFeatures','distinguishing_features'))
    ]));

    var vocalRange=[pick(sk,'lowestNote','lowest_note'),pick(sk,'highestNote','highest_note')].filter(Boolean).join(' \u2013 ');
    var skillsSec=section('Skills & Training',detailCard([
      detail('Acting level',pick(sk,'actingLevel','acting_level')),detail('Dance styles',sk.dance),
      detail('Dance category',pick(sk,'danceCategory','dance_category')),detail('Singing',sk.singing),
      detail('Vocal range',vocalRange),detail('Vocal techniques',pick(sk,'vocalTechniques','vocal_techniques')),
      detail('Stunts',sk.stunts),detail('Instruments',sk.instruments),detail('Sports',sk.sports),
      detail('Driving license',pick(sk,'drivingLicense','driving_license')),detail('Other skills',sk.skills),detail('Profession',sk.profession)
    ]));

    var langSec=section('Languages',detailCard([
      detail('Native language',pick(la,'nativeLanguage','native_language')||t.native_language),
      detail('Other languages',pick(la,'otherLanguages','other_languages')),
      detail('Fluency',la.fluency),
      detail('Kurdish dialect',pick(la,'kurdishDialect','kurdish_dialect')),
      detail('Accents',la.accents)
    ]));

    var creditGroups=[['Film','filmCredits'],['TV','tvCredits'],['Theatre','theatreCredits'],['Commercial','commercialCredits']];
    var expInner='<div class="acp-card"><p style="margin:0;font-size:14px;"><span style="color:#71717a;">Years of experience: </span>'+pretty(pick(ex,'yearsOfExperience','years_of_experience'))+'</p>'+
      creditGroups.map(function(g){return '<div style="margin-top:16px;"><h3 style="font-size:14px;font-weight:500;margin:0 0 4px;">'+g[0]+' Credits</h3>'+credList(ex[g[1]])+'</div>';}).join('')+
      '<div style="margin-top:16px;"><h3 style="font-size:14px;font-weight:500;margin:0 0 4px;">Training</h3>'+
        (ex.training&&ex.training.length?'<ul class="acp-cred-list">'+ex.training.map(function(tr){var bits=[];if(tr.yearGraduated)bits.push('· '+esc(tr.yearGraduated));if(tr.productionCompany)bits.push('· '+esc(tr.productionCompany));return '<li><span style="font-weight:500;">'+esc(tr.institution||'Institution')+'</span> <span class="acp-cred-meta">'+bits.join(' ')+'</span></li>';}).join('')+'</ul>':'<p class="acp-kv-empty">Not provided</p>')+
      '</div>'+
      '<p style="margin:16px 0 0;font-size:14px;"><span style="color:#71717a;">Workshops: </span>'+pretty(ex.workshops)+'</p>'+
    '</div>';
    var expSec=section('Experience',expInner);

    var agentSec=section('Agent / Representation',detailCard([
      detail('Agent name',pick(ag,'agentName','agent_name')),detail('Agency',ag.agency),
      detail('Agent email',pick(ag,'agentEmail','agent_email')),detail('Agent phone',pick(ag,'agentPhone','agent_phone'))
    ]));

    var availSec=section('Availability',detailCard([
      detail('Available for work',pick(av,'availableForWork','available_for_work')),
      detail('Travel availability',pick(av,'travelAvailability','travel_availability')),
      detail('Passport',av.passport),detail('Work permit',pick(av,'workPermit','work_permit')),
      detail('Willing to travel',pick(av,'willingToTravel','willing_to_travel'))
    ]));

    var notesSec=section('Special Skills & Notes','<div class="acp-card"><div class="acp-detail-grid" style="grid-template-columns:repeat(1,1fr);gap:16px;">'+
      [['Special skills',pick(ex2,'specialSkills','special_skills')],['Awards',ex2.awards],['Language notes',pick(ex2,'languageNotes','language_notes')],['Casting notes',pick(ex2,'castingNotes','casting_notes')],['Other notes',ex2.notes]]
        .map(function(p){return detail(p[0],p[1]);}).join('')+
    '</div></div>');

    var mediaSec=section('Media & Documents','<div class="acp-card"><div class="acp-detail-grid">'+
      detail('Showreel',t.showreel_link?'<a href="'+esc(t.showreel_link)+'" target="_blank" rel="noopener" style="color:#111;text-decoration:underline;word-break:break-all;">'+esc(t.showreel_link)+'</a>':null)+
      '<div><div class="acp-kv-label">Voice reel</div><div style="margin-top:4px;">'+(voiceReel?'<audio controls preload="none" src="'+esc(voiceReel.url)+'" style="width:100%;max-width:280px;"></audio>':'<span class="acp-kv-empty">Not provided</span>')+'</div></div>'+
      detail('CV / R\u00e9sum\u00e9',cvFile?'<a href="'+esc(cvFile.url)+'" target="_blank" rel="noopener" style="color:#111;text-decoration:underline;">Download CV</a>':null)+
    '</div></div>');

    el.innerHTML=
      '<a href="javascript:history.back()" class="acp-back">\u2190 Back</a>'+
      header+galleryHtml+showreel+cats+physicalSec+skillsSec+langSec+expSec+agentSec+availSec+notesSec+mediaSec;

    // Gallery tab switching
    var galContent=document.getElementById('acp-gal-content');
    if(galContent){
      el.querySelectorAll('.acp-tab').forEach(function(btn){
        btn.addEventListener('click',function(){
          if(btn.disabled)return;
          el.querySelectorAll('.acp-tab').forEach(function(b){b.setAttribute('aria-selected',b===btn?'true':'false');});
          var k=btn.getAttribute('data-tab');
          var items=k==='headshot'?galHead:k==='medium'?galMed:k==='fullbody'?galFull:galHead.concat(galMed).concat(galFull);
          galContent.innerHTML=renderGallery(items);
          attachLightbox();
        });
      });
    }
    function attachLightbox(){
      el.querySelectorAll('.acp-gallery button').forEach(function(b){
        b.addEventListener('click',function(){
          var src=b.getAttribute('data-src');if(!src)return;
          var lb=document.createElement('div');lb.className='acp-lightbox';lb.innerHTML='<img src="'+src+'"/>';
          lb.addEventListener('click',function(){lb.remove();});
          document.body.appendChild(lb);
        });
      });
    }
    attachLightbox();
 })
 .catch(function(e){el.innerHTML='<div style="text-align:center;padding:80px 20px;"><h2 style="font-size:28px;font-weight:800;">Profile unavailable</h2><p style="color:#666;">'+esc(e.message)+'</p></div>';});
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
  const CANONICAL_BASE = "https://app.artcity.group";
  const detected = typeof window !== "undefined" ? window.location.origin : "";
  const isPreview =
    /lovableproject\.com|id-preview--|lovable\.app/.test(detected) ||
    detected !== CANONICAL_BASE;
  const [base, setBase] = useState(CANONICAL_BASE);
  const [profilePattern, setProfilePattern] = useState(
    "https://artcity.group/talent-profile/?slug={slug}",
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">WordPress embed snippets</CardTitle>
          <CardDescription>
            Paste any snippet into a WordPress Custom HTML block on{" "}
            <strong>artcity.group</strong>. All API calls go to{" "}
            <code>https://app.artcity.group</code>. No API keys needed — these
            endpoints are public. All snippets now use the versioned{" "}
            <code>/api/public/v1/*</code> endpoints (legacy{" "}
            <code>/api/public/*</code> URLs still respond for older embeds).
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
              placeholder="https://app.artcity.group"
              className="font-mono text-xs"
            />
            {isPreview && (
              <p className="text-xs text-amber-600">
                Keep this set to the canonical app domain{" "}
                <code>https://app.artcity.group</code> so embeds work from any
                WordPress site.
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