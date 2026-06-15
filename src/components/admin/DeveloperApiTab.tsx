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
  return `<!-- Art City — Casting Request form (matches app/casting-request) -->
<style id="acr-css">
.acr-root{max-width:920px;margin:0 auto;padding:0 16px;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,system-ui,sans-serif;line-height:1.5;}
.acr-root *{box-sizing:border-box;}
.acr-card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:28px;box-shadow:0 1px 2px rgba(0,0,0,.02);}
.acr-title{font-size:20px;font-weight:700;letter-spacing:-.01em;margin:0 0 14px;color:#0f172a;}
.acr-notice{border:1px solid #fecaca;background:#fef2f2;color:#7f1d1d;border-radius:10px;padding:12px 14px;font-size:13px;line-height:1.5;margin-bottom:20px;}
.acr-grid{display:grid;grid-template-columns:1fr;gap:16px;}
@media(min-width:640px){.acr-grid{grid-template-columns:1fr 1fr;}}
.acr-field{display:flex;flex-direction:column;gap:6px;}
.acr-field.full{grid-column:1/-1;}
.acr-label{font-size:13px;font-weight:700;color:#0f172a;}
.acr-label .req{color:#dc2626;margin-left:2px;}
.acr-input,.acr-textarea{width:100%;padding:10px 14px;border:1px solid #e2e8f0;border-radius:10px;background:#fff;color:#0f172a;font:inherit;font-size:14px;transition:border-color .15s,box-shadow .15s;}
.acr-input:focus,.acr-textarea:focus{outline:none;border-color:#1e6ef5;box-shadow:0 0 0 3px rgba(30,110,245,.15);}
.acr-textarea{min-height:90px;resize:vertical;font-family:inherit;}
.acr-actions{margin-top:8px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;}
.acr-submit{background:#dc2626;color:#fff;border:0;padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px;cursor:pointer;transition:background .15s;}
.acr-submit:hover:not(:disabled){background:#b91c1c;}
.acr-submit:disabled{opacity:.7;cursor:not-allowed;}
.acr-msg{margin:0;font-size:13px;}
.acr-msg.ok{color:#15803d;}
.acr-msg.err{color:#b91c1c;}
</style>
<div class="acr-root">
  <form id="acr-form" class="acr-card" novalidate>
    <h2 class="acr-title">Casting Request</h2>
    <div class="acr-notice">Direct contact with listed talent is not available. All casting inquiries, negotiations, bookings, and confirmations are managed exclusively through Art City Casting.</div>
    <div class="acr-grid">
      <div class="acr-field">
        <label class="acr-label" for="acr-production_title">Production title<span class="req">*</span></label>
        <input id="acr-production_title" name="production_title" class="acr-input" placeholder="e.g. Untitled Feature Film" maxlength="200" required />
      </div>
      <div class="acr-field">
        <label class="acr-label" for="acr-production_type">Production type</label>
        <input id="acr-production_type" name="production_type" class="acr-input" placeholder="Film, TV, commercial…" maxlength="80" />
      </div>
      <div class="acr-field">
        <label class="acr-label" for="acr-shooting_dates">Shooting dates</label>
        <input id="acr-shooting_dates" name="shooting_dates" class="acr-input" placeholder="e.g. Aug 12 – Sep 3, 2026" maxlength="200" />
      </div>
      <div class="acr-field">
        <label class="acr-label" for="acr-shooting_location">Shooting location</label>
        <input id="acr-shooting_location" name="shooting_location" class="acr-input" placeholder="City, country" maxlength="200" />
      </div>
      <div class="acr-field">
        <label class="acr-label" for="acr-budget_range">Budget range</label>
        <input id="acr-budget_range" name="budget_range" class="acr-input" placeholder="e.g. $5k – $10k" maxlength="80" />
      </div>
      <div class="acr-field">
        <label class="acr-label" for="acr-company_name">Company name</label>
        <input id="acr-company_name" name="company_name" class="acr-input" placeholder="Your production company" maxlength="200" />
      </div>
      <div class="acr-field">
        <label class="acr-label" for="acr-contact_person">Contact person<span class="req">*</span></label>
        <input id="acr-contact_person" name="contact_person" class="acr-input" placeholder="Full name" maxlength="150" required />
      </div>
      <div class="acr-field">
        <label class="acr-label" for="acr-email">Email<span class="req">*</span></label>
        <input id="acr-email" name="email" type="email" class="acr-input" placeholder="you@example.com" maxlength="255" required />
      </div>
      <div class="acr-field">
        <label class="acr-label" for="acr-phone">Phone</label>
        <input id="acr-phone" name="phone" class="acr-input" placeholder="+964 7XX XXX XXXX" maxlength="40" />
      </div>
      <div class="acr-field">
        <label class="acr-label" for="acr-requested_talent_name">Requested talent name</label>
        <input id="acr-requested_talent_name" name="requested_talent_name" class="acr-input" placeholder="Talent's name (if known)" maxlength="200" />
      </div>
      <div class="acr-field full">
        <label class="acr-label" for="acr-role_description">Role description</label>
        <textarea id="acr-role_description" name="role_description" class="acr-textarea" rows="3" maxlength="5000" placeholder="Describe the role, character, age range, requirements…"></textarea>
      </div>
      <div class="acr-field full">
        <label class="acr-label" for="acr-message">Message</label>
        <textarea id="acr-message" name="message" class="acr-textarea" rows="3" maxlength="5000" placeholder="Any additional details for our team"></textarea>
      </div>
    </div>
    <div class="acr-actions">
      <button type="submit" class="acr-submit" id="acr-submit">Submit Request</button>
      <p id="acr-msg" class="acr-msg"></p>
    </div>
  </form>
</div>
<script>(function(){
  var BASE=${JSON.stringify(base)};
  var f=document.getElementById('acr-form'),m=document.getElementById('acr-msg'),btn=document.getElementById('acr-submit');
  /* Prefill requested_talent_name from ?talent= or ?name= query params (matches app behavior) */
  try{
    var qs=new URLSearchParams(window.location.search);
    var preName=qs.get('name')||qs.get('talent_name');
    if(preName){var rt=document.getElementById('acr-requested_talent_name');if(rt&&!rt.value)rt.value=preName;}
  }catch(_){}
  f.addEventListener('submit',function(e){
    e.preventDefault();
    btn.disabled=true;m.className='acr-msg';m.textContent='Sending…';
    var raw={};Array.prototype.forEach.call(f.elements,function(el){if(el.name)raw[el.name]=(el.value||'').trim();});
    if(!raw.production_title||!raw.contact_person||!raw.email){m.className='acr-msg err';m.textContent='Please fill all required fields.';btn.disabled=false;return;}
    var d={
      production_title:raw.production_title,
      production_type:raw.production_type||undefined,
      shooting_dates:raw.shooting_dates||undefined,
      shooting_location:raw.shooting_location||undefined,
      budget_range:raw.budget_range||undefined,
      company_name:raw.company_name||undefined,
      contact_person:raw.contact_person,
      email:raw.email,
      phone:raw.phone||undefined,
      requested_talent_name:raw.requested_talent_name||undefined,
      role_description:raw.role_description||undefined,
      message:raw.message||undefined
    };
    fetch(BASE+'/api/public/v1/casting-requests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})
      .then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j};});})
      .then(function(x){
        btn.disabled=false;
        if(x.ok){m.className='acr-msg ok';m.textContent='Request sent. Our team will contact you shortly.';f.reset();}
        else{m.className='acr-msg err';m.textContent=(x.j&&x.j.error)||'Failed to send request.';}
      })
      .catch(function(e){btn.disabled=false;m.className='acr-msg err';m.textContent=e.message;});
  });
})();</script>`;
}

function buildAllInOne(base: string, profilePattern: string) {
  return `<!-- Art City — Complete Talents experience (matches app/talents) -->
<style id="acx-css">
.acx-root{max-width:1280px;margin:0 auto;padding:0 16px 64px;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,system-ui,sans-serif;line-height:1.5;}
.acx-root *{box-sizing:border-box;}
.acx-root img{max-width:100%;height:auto;display:block;}
.acx-root a{color:inherit;text-decoration:none;}
.acx-root button{font:inherit;cursor:pointer;}

/* HERO */
.acx-hero{position:relative;overflow:hidden;border-bottom:1px solid #e5e7eb;background:linear-gradient(135deg,#1a1740 0%,#2b1d63 45%,#1e2a5e 100%);color:#fff;border-radius:0 0 24px 24px;margin:0 -16px 24px;}
.acx-hero-inner{display:grid;grid-template-columns:1fr;gap:32px;max-width:1280px;margin:0 auto;padding:56px 24px;}
@media(min-width:768px){.acx-hero-inner{grid-template-columns:1fr 1fr;padding:80px 24px;}}
.acx-hero-eyebrow{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.05);padding:6px 12px;border-radius:999px;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:rgba(255,255,255,.85);width:fit-content;}
.acx-hero h1{font-size:42px;font-weight:600;letter-spacing:-.02em;line-height:1.05;margin:18px 0 0;color:#fff;}
@media(min-width:640px){.acx-hero h1{font-size:54px;}}
.acx-hero p{margin:18px 0 0;max-width:560px;color:rgba(255,255,255,.78);font-size:17px;}
.acx-hero-cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:24px;}
.acx-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:11px 22px;border-radius:10px;font-weight:600;font-size:14px;border:1px solid transparent;transition:all .2s ease;}
.acx-btn-white{background:#fff;color:#1a1740;}
.acx-btn-white:hover{background:#f1f5f9;}
.acx-btn-ghost{border-color:rgba(255,255,255,.3);color:#fff;background:rgba(255,255,255,.05);}
.acx-btn-ghost:hover{background:rgba(255,255,255,.12);}
.acx-hero-dots{display:flex;align-items:center;gap:10px;margin-top:32px;}
.acx-hero-dots .nav{border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.05);padding:6px;border-radius:999px;color:rgba(255,255,255,.9);width:30px;height:30px;display:inline-flex;align-items:center;justify-content:center;}
.acx-hero-dots .dot{height:6px;border-radius:999px;background:rgba(255,255,255,.3);width:12px;transition:all .25s;}
.acx-hero-dots .dot.on{background:#fff;width:32px;}
.acx-hero-card{position:relative;aspect-ratio:4/5;max-width:420px;margin:0 auto;border-radius:18px;overflow:hidden;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);box-shadow:0 30px 70px -20px rgba(0,0,0,.5);}
.acx-hero-card img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;animation:acxFade .8s ease;}
.acx-hero-card .grad{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.88),rgba(0,0,0,.2) 40%,transparent);}
.acx-hero-card .info{position:absolute;left:20px;right:20px;bottom:20px;color:#fff;}
.acx-hero-card .info .n{font-size:22px;font-weight:700;letter-spacing:-.01em;}
.acx-hero-card .info .m{font-size:13px;opacity:.85;margin-top:2px;}
.acx-hero-card .pill{position:absolute;top:14px;left:14px;background:#F7B500;color:#000;padding:4px 10px;border-radius:6px;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;}
@keyframes acxFade{from{opacity:0}to{opacity:1}}

/* DIRECTORY HEADER CARD */
.acx-bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px;border:1px solid #e5e7eb;background:#fff;padding:16px 20px;border-radius:14px;margin-top:8px;}
.acx-bar h2{font-size:22px;font-weight:700;letter-spacing:-.01em;margin:0;color:#0f172a;}
.acx-bar p{font-size:13px;color:#64748b;margin:2px 0 0;}
.acx-bar .cta{background:#F7B500;color:#000;padding:10px 18px;border-radius:10px;font-weight:600;font-size:14px;display:inline-flex;align-items:center;gap:6px;}
.acx-bar .cta:hover{background:#e0a200;}

/* SECTION HEADS */
.acx-section{margin-top:48px;}
.acx-eyebrow{display:inline-flex;align-items:center;gap:6px;font-size:11px;letter-spacing:.22em;text-transform:uppercase;font-weight:700;color:#9a6b00;background:rgba(247,181,0,.12);border:1px solid rgba(247,181,0,.4);padding:5px 12px;border-radius:999px;}
.acx-eyebrow.feat{color:#1e3a8a;background:#eef2ff;border-color:#c7d2fe;}
.acx-h2{font-size:32px;font-weight:700;letter-spacing:-.02em;margin:14px 0 4px;color:#0f172a;line-height:1.15;}
.acx-sub{margin:0;color:#64748b;font-size:14px;}

/* VIP CAROUSEL */
.acx-vip-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:18px;margin-top:20px;}
.acx-vip-card{position:relative;background:#fff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;box-shadow:0 1px 0 rgba(0,0,0,.02);transition:transform .25s ease,box-shadow .25s ease;outline:1px solid rgba(247,181,0,.4);outline-offset:-1px;}
.acx-vip-card:hover{transform:translateY(-3px);box-shadow:0 18px 35px -18px rgba(0,0,0,.22);}
.acx-vip-photo{position:relative;aspect-ratio:3/4;background:#f1f5f9;overflow:hidden;}
.acx-vip-photo img{width:100%;height:100%;object-fit:cover;transition:transform .6s ease;}
.acx-vip-card:hover .acx-vip-photo img{transform:scale(1.06);}
.acx-vip-photo .grad{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.78),rgba(0,0,0,.2) 35%,transparent);}
.acx-vip-photo .vip-pill{position:absolute;top:12px;left:12px;display:inline-flex;align-items:center;gap:4px;background:#F7B500;color:#000;padding:5px 10px;border-radius:999px;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;box-shadow:0 4px 10px rgba(247,181,0,.4);}
.acx-vip-photo .info{position:absolute;left:14px;right:14px;bottom:12px;color:#fff;}
.acx-vip-photo .info .n{font-size:18px;font-weight:700;line-height:1.1;letter-spacing:-.01em;text-shadow:0 2px 8px rgba(0,0,0,.4);}
.acx-vip-photo .info .m{font-size:12px;opacity:.88;margin-top:2px;}
.acx-vip-foot{padding:14px;display:flex;flex-direction:column;gap:10px;}
.acx-pills{display:flex;flex-wrap:wrap;gap:6px;}
.acx-pill{background:#eef2ff;color:#1e3a8a;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:500;}
.acx-pill.muted{background:#f1f5f9;color:#475569;}
.acx-row-btns{display:flex;gap:8px;}
.acx-btn-blue{background:#1e6ef5;color:#fff;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:600;display:inline-flex;align-items:center;justify-content:center;gap:5px;flex:1;}
.acx-btn-blue:hover{background:#1857c9;}
.acx-btn-outline{border:1px solid #e2e8f0;background:#fff;color:#0f172a;padding:8px 12px;border-radius:8px;font-size:12px;font-weight:500;display:inline-flex;align-items:center;justify-content:center;}
.acx-btn-outline:hover{background:#f8fafc;}

/* DIRECTORY LAYOUT */
.acx-dir-wrap{display:grid;grid-template-columns:1fr;gap:24px;margin-top:24px;}
@media(min-width:1024px){.acx-dir-wrap{grid-template-columns:260px 1fr;}}
.acx-side{background:#fff;border:1px solid #e5e7eb;border-radius:14px;height:fit-content;}
.acx-side-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #e5e7eb;}
.acx-side-head h3{margin:0;font-size:15px;font-weight:700;color:#0f172a;}
.acx-side-head .clr{font-size:11px;color:#64748b;text-decoration:underline;background:none;border:none;padding:0;}
.acx-fs{border-bottom:1px solid #e5e7eb;}
.acx-fs:last-child{border-bottom:none;}
.acx-fs-btn{display:flex;width:100%;align-items:center;justify-content:space-between;background:none;border:none;padding:12px 16px;font-size:13px;font-weight:600;color:#0f172a;text-align:left;}
.acx-fs-btn:hover{background:#f8fafc;}
.acx-fs-btn .chev{transition:transform .2s;}
.acx-fs[data-open="true"] .acx-fs-btn .chev{transform:rotate(180deg);}
.acx-fs-body{display:none;padding:0 16px 14px;}
.acx-fs[data-open="true"] .acx-fs-body{display:block;}
.acx-flabel{font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#64748b;margin:10px 0 4px;}
.acx-fchk{display:flex;align-items:center;gap:8px;padding:5px 4px;border-radius:6px;cursor:pointer;font-size:13px;}
.acx-fchk:hover{background:#f8fafc;}
.acx-fchk input{accent-color:#1e6ef5;}

.acx-chips{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;}
.acx-chip{cursor:pointer;padding:7px 14px;border:1px solid #e2e8f0;border-radius:999px;background:#fff;color:#0f172a;font-size:13px;font-weight:500;transition:all .15s ease;}
.acx-chip:hover{border-color:#0f172a;}
.acx-chip[aria-pressed="true"]{background:#0f172a;color:#fff;border-color:#0f172a;}
.acx-chip.vip[aria-pressed="true"]{background:#F7B500;border-color:#F7B500;color:#000;}

.acx-input{width:100%;padding:9px 12px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;color:#0f172a;font:inherit;font-size:13px;}
.acx-input:focus{outline:none;border-color:#1e6ef5;box-shadow:0 0 0 3px rgba(30,110,245,.15);}

.acx-toolbar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;}
.acx-count{font-size:14px;font-weight:600;color:#0f172a;}
.acx-sort{display:flex;align-items:center;gap:6px;font-size:12px;color:#64748b;}

/* HORIZONTAL TALENT CARDS */
.acx-list{display:grid;gap:14px;grid-template-columns:1fr;}
@media(min-width:640px){.acx-list{grid-template-columns:1fr 1fr;}}
.acx-tcard{display:flex;gap:14px;background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:14px;transition:border-color .2s,box-shadow .2s;}
.acx-tcard:hover{border-color:rgba(30,110,245,.4);box-shadow:0 8px 20px -10px rgba(0,0,0,.1);}
.acx-tcard.vip{outline:1px solid rgba(247,181,0,.5);outline-offset:-1px;}
.acx-tphoto{position:relative;width:110px;height:130px;flex-shrink:0;border-radius:10px;overflow:hidden;background:#f1f5f9;}
.acx-tphoto img{width:100%;height:100%;object-fit:cover;transition:transform .5s;}
.acx-tcard:hover .acx-tphoto img{transform:scale(1.05);}
.acx-tphoto .badges{position:absolute;top:6px;left:6px;display:flex;flex-direction:column;gap:4px;}
.acx-tphoto .b{font-size:9px;font-weight:700;padding:2px 6px;border-radius:3px;text-transform:none;letter-spacing:0;}
.acx-tphoto .b.feat{background:#F7B500;color:#000;}
.acx-tphoto .b.vip{background:rgba(0,0,0,.82);color:#fff;}
.acx-tinfo{flex:1;min-width:0;display:flex;flex-direction:column;}
.acx-tname{font-size:17px;font-weight:600;letter-spacing:-.01em;color:#0f172a;line-height:1.15;}
.acx-tname:hover{text-decoration:underline;}
.acx-tmeta{font-size:12px;color:#64748b;margin-top:2px;}
.acx-tbtns{margin-top:auto;display:flex;flex-wrap:wrap;gap:8px;padding-top:10px;}

/* APPLY CTA */
.acx-apply{margin-top:64px;border:1px solid #e5e7eb;border-radius:18px;background:linear-gradient(135deg,rgba(30,110,245,.08),#fff 70%);padding:48px 32px;text-align:center;}
.acx-apply .e{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#1e6ef5;}
.acx-apply h3{font-size:28px;font-weight:700;letter-spacing:-.02em;margin:10px 0 6px;color:#0f172a;}
.acx-apply p{color:#475569;margin:0 auto 22px;max-width:540px;font-size:14px;}
.acx-apply .btns{display:inline-flex;gap:10px;flex-wrap:wrap;justify-content:center;}
.acx-apply .b1{background:#0f172a;color:#fff;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px;}
.acx-apply .b1:hover{background:#1e293b;}
.acx-apply .b2{border:1px solid #e2e8f0;color:#0f172a;background:#fff;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px;}
.acx-apply .b2:hover{background:#f8fafc;}

.acx-state{text-align:center;padding:36px;color:#64748b;font-size:14px;grid-column:1/-1;}
.acx-error{text-align:center;padding:36px;color:#b91c1c;font-size:14px;grid-column:1/-1;}
</style>
<div class="acx-root">
  <!-- HERO -->
  <section class="acx-hero">
    <div class="acx-hero-inner">
      <div>
        <span class="acx-hero-eyebrow">&#10026; Art City Casting</span>
        <h1>Talent Gallery</h1>
        <p>Browse our represented actors, actresses, models, voice talents, and performers — for films, series, commercials, music videos, and branded productions. All casting requests are handled directly through Art City.</p>
        <div class="acx-hero-cta">
          <a class="acx-btn acx-btn-white" href="#acx-directory">Browse the roster &rarr;</a>
          <a class="acx-btn acx-btn-ghost" href="${base}/casting-request" target="_blank" rel="noopener">Submit a casting request</a>
        </div>
        <div class="acx-hero-dots" id="acx-hero-dots"></div>
      </div>
      <div class="acx-hero-card" id="acx-hero-card"></div>
    </div>
  </section>

  <!-- DIRECTORY HEADER BAR -->
  <div class="acx-bar">
    <div>
      <h2>Casting Directory</h2>
      <p>All inquiries, negotiations, and bookings are managed exclusively through Art City Casting.</p>
    </div>
    <a class="cta" href="${base}/casting-request" target="_blank" rel="noopener">&#128227; Post a Casting Call</a>
  </div>

  <!-- VIP -->
  <section class="acx-section" id="acx-vip-section">
    <div class="acx-eyebrow">&#9819; VIP Talent</div>
    <h2 class="acx-h2">Premium roster</h2>
    <p class="acx-sub">Highly requested talents handpicked by Art City Casting.</p>
    <div id="acx-vip" class="acx-vip-row"><div class="acx-state">Loading VIP talents…</div></div>
  </section>

  <!-- DIRECTORY -->
  <main id="acx-directory" class="acx-section">
    <div class="acx-dir-wrap">
      <aside class="acx-side">
        <div class="acx-side-head">
          <h3>Filters</h3>
          <button type="button" class="clr" id="acx-clear">Clear all</button>
        </div>
        <div class="acx-fs" data-open="true">
          <button type="button" class="acx-fs-btn">Basic<span class="chev">&#9662;</span></button>
          <div class="acx-fs-body">
            <div class="acx-flabel">Search</div>
            <input id="acx-q" class="acx-input" placeholder="Name or stage name"/>
            <div class="acx-flabel">Category</div>
            <select id="acx-cat" class="acx-input">
              <option value="">All categories</option><option value="actor">Actor</option><option value="actress">Actress</option><option value="model">Model</option><option value="performer">Performer</option><option value="voice_talent">Voice talent</option>
            </select>
            <div class="acx-flabel">Gender</div>
            <select id="acx-gender" class="acx-input">
              <option value="">All genders</option><option value="male">Male</option><option value="female">Female</option><option value="non_binary">Non-binary</option><option value="other">Other</option>
            </select>
          </div>
        </div>
        <div class="acx-fs">
          <button type="button" class="acx-fs-btn">Physical<span class="chev">&#9662;</span></button>
          <div class="acx-fs-body">
            <div class="acx-flabel">Location</div>
            <input id="acx-loc" class="acx-input" placeholder="City / region"/>
            <div class="acx-flabel">Nationality</div>
            <input id="acx-nat" class="acx-input" placeholder="Nationality"/>
          </div>
        </div>
        <div class="acx-fs">
          <button type="button" class="acx-fs-btn">Languages<span class="chev">&#9662;</span></button>
          <div class="acx-fs-body">
            <div class="acx-flabel">Native or spoken</div>
            <input id="acx-lang" class="acx-input" placeholder="e.g. Kurdish, Arabic"/>
          </div>
        </div>
        <div class="acx-fs">
          <button type="button" class="acx-fs-btn">Availability<span class="chev">&#9662;</span></button>
          <div class="acx-fs-body">
            <label class="acx-fchk"><input type="checkbox" id="acx-vipOnly"/> VIP only</label>
            <label class="acx-fchk"><input type="checkbox" id="acx-featOnly"/> Featured only</label>
          </div>
        </div>
      </aside>

      <div>
        <div class="acx-chips" role="group" aria-label="Quick filters">
          <button type="button" class="acx-chip" data-filter="all" aria-pressed="true">All</button>
          <button type="button" class="acx-chip vip" data-filter="vip" aria-pressed="false">&#9819; VIP</button>
          <button type="button" class="acx-chip" data-filter="featured" aria-pressed="false">&#10026; Featured</button>
        </div>
        <div class="acx-toolbar">
          <div class="acx-count" id="acx-count">Loading…</div>
          <div class="acx-sort">
            <label>Sort:</label>
            <select id="acx-sort" class="acx-input" style="width:auto;">
              <option value="featured">Best Match</option><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="name_asc">Name A-Z</option><option value="name_desc">Name Z-A</option>
            </select>
          </div>
        </div>
        <div id="acx-dir" class="acx-list"></div>
      </div>
    </div>
  </main>

  <!-- APPLY -->
  <section class="acx-apply">
    <div class="e">&#10026; Join the roster</div>
    <h3>Apply to Join Art City Casting</h3>
    <p>Actors, actresses, models, voice talents, and performers can submit their information for review. Approved applicants may be added to the Art City Casting talent database.</p>
    <div class="btns">
      <a class="b1" href="${base}/register" target="_blank" rel="noopener">Start your application</a>
      <a class="b2" href="${base}/login" target="_blank" rel="noopener">Sign in</a>
    </div>
  </section>
</div>
<script>(function(){
${FETCH_HELPER(base, profilePattern)}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function cap(s){s=String(s||'');return s.charAt(0).toUpperCase()+s.slice(1);}
function lbl(s){return String(s||'').replace(/_/g,' ').replace(/\\b\\w/g,function(c){return c.toUpperCase();});}
function langChips(t){var o=[];if(t.native_language)o.push(cap(t.native_language));var more=t&&t.skills&&t.skills.languages;if(Array.isArray(more)){for(var i=0;i<more.length;i++){var v=typeof more[i]==='string'?more[i]:(more[i]&&more[i].name);if(v&&o.indexOf(v)===-1)o.push(cap(v));}}return o.slice(0,3);}
function castReq(t){return '${base}/casting-request?talent='+encodeURIComponent(t.id||'')+'&name='+encodeURIComponent(t.stage_name||t.full_name||'');}

/* HERO SLIDESHOW */
(function(){
  var card=document.getElementById('acx-hero-card'),dots=document.getElementById('acx-hero-dots');
  var items=[],idx=0,timer=null;
  function render(){
    if(!items.length){card.innerHTML='<div class="grad"></div>';return;}
    var t=items[idx%items.length],img=t.headshot_url||t.headshot_thumb_url||'';
    var meta=[t.age?t.age+' yrs':null,t.gender?lbl(t.gender):null,t.location].filter(Boolean).join(' \u2022 ');
    card.innerHTML='<a href="'+esc(acProfileUrl(t.slug))+'" rel="noopener">'+
      (img?'<img src="'+esc(img)+'" alt=""/>':'')+
      (t.vip?'<span class="pill">&#9819; VIP</span>':(t.featured?'<span class="pill" style="background:#fff;color:#0f172a;">FEATURED</span>':''))+
      '<div class="grad"></div><div class="info"><div class="n">'+esc(t.stage_name||t.full_name||'Talent')+'</div>'+(meta?'<div class="m">'+esc(meta)+'</div>':'')+'</div></a>';
    if(items.length>1){
      var html='<button type="button" class="nav" data-d="-1">&#9664;</button>';
      for(var i=0;i<items.length;i++)html+='<span class="dot'+(i===idx%items.length?' on':'')+'"></span>';
      html+='<button type="button" class="nav" data-d="1">&#9654;</button>';
      dots.innerHTML=html;
      Array.prototype.forEach.call(dots.querySelectorAll('.nav'),function(b){b.addEventListener('click',function(){idx+=parseInt(b.getAttribute('d')||b.getAttribute('data-d')||'1',10);render();reset();});});
    }
  }
  function reset(){if(timer)clearInterval(timer);timer=setInterval(function(){idx++;render();},6000);}
  acFetchTalents({featured_only:'true',limit:6}).then(function(r){
    if(r&&r.length){items=r;}else{return acFetchTalents({limit:6}).then(function(x){items=x;});}
  }).then(function(){render();reset();}).catch(function(){});
})();

/* VIP STRIP */
function vipCardHtml(t){
  var img=t.headshot_url||t.headshot_thumb_url||'';
  var name=esc(t.stage_name||t.full_name||'Talent');
  var meta=[t.age?t.age+' yrs':null,t.gender?lbl(t.gender):null,t.location].filter(Boolean).map(esc).join(' \u2022 ');
  var cats=(t.categories||[]).slice(0,2).map(function(c){return '<span class="acx-pill">'+esc(lbl(c))+'</span>';}).join('');
  var langs=langChips(t).slice(0,2).map(function(l){return '<span class="acx-pill muted">'+esc(l)+'</span>';}).join('');
  return '<div class="acx-vip-card">'+
    '<a class="acx-vip-photo" href="'+esc(acProfileUrl(t.slug))+'" rel="noopener">'+
      (img?'<img src="'+esc(img)+'" alt="'+name+'" loading="lazy" decoding="async"/>':'')+
      '<div class="grad"></div><span class="vip-pill">&#9819; VIP</span>'+
      '<div class="info"><div class="n">'+name+'</div>'+(meta?'<div class="m">'+meta+'</div>':'')+'</div>'+
    '</a>'+
    '<div class="acx-vip-foot">'+
      (cats||langs?'<div class="acx-pills">'+cats+langs+'</div>':'')+
      '<div class="acx-row-btns">'+
        '<a class="acx-btn-blue" href="'+esc(acProfileUrl(t.slug))+'" rel="noopener">&#128100; View Profile</a>'+
        '<a class="acx-btn-outline" href="'+esc(castReq(t))+'" target="_blank" rel="noopener" aria-label="Contact">&#9993;</a>'+
      '</div>'+
    '</div>'+
  '</div>';
}
(function(){
  var el=document.getElementById('acx-vip');
  acFetchTalents({vip_only:'true',limit:8}).then(function(items){
    if(!items.length){document.getElementById('acx-vip-section').style.display='none';return;}
    el.innerHTML=items.map(vipCardHtml).join('');
  }).catch(function(e){el.innerHTML='<p class="acx-error">'+esc(e.message)+'</p>';});
})();

/* DIRECTORY */
function tCardHtml(t){
  var img=t.headshot_thumb_url||t.headshot_url||'';
  var name=esc(t.stage_name||t.full_name||'Talent');
  var meta=[t.age,t.gender?lbl(t.gender):null,t.location].filter(Boolean).map(esc).join(', ');
  var cats=(t.categories||[]).slice(0,3).map(function(c){return '<span class="acx-pill">'+esc(lbl(c))+'</span>';}).join('');
  var langs=langChips(t).map(function(l){return '<span class="acx-pill muted">'+esc(l)+'</span>';}).join('');
  var badges='';
  if(t.featured)badges+='<span class="b feat">Featured</span>';
  if(t.vip)badges+='<span class="b vip">VIP</span>';
  return '<div class="acx-tcard'+(t.vip?' vip':'')+'">'+
    '<a class="acx-tphoto" href="'+esc(acProfileUrl(t.slug))+'" rel="noopener">'+
      (img?'<img src="'+esc(img)+'" alt="'+name+'" loading="lazy" decoding="async"/>':'')+
      (badges?'<div class="badges">'+badges+'</div>':'')+
    '</a>'+
    '<div class="acx-tinfo">'+
      '<a class="acx-tname" href="'+esc(acProfileUrl(t.slug))+'" rel="noopener">'+name+'</a>'+
      '<div class="acx-tmeta">'+(meta||'\u2014')+'</div>'+
      (cats?'<div class="acx-pills" style="margin-top:8px;">'+cats+'</div>':'')+
      (langs?'<div class="acx-pills" style="margin-top:6px;">'+langs+'</div>':'')+
      '<div class="acx-tbtns">'+
        '<a class="acx-btn-blue" style="flex:0 0 auto;padding:7px 12px;" href="'+esc(acProfileUrl(t.slug))+'" rel="noopener">&#128100; View Profile</a>'+
        '<a class="acx-btn-outline" style="padding:7px 12px;" href="'+esc(castReq(t))+'" target="_blank" rel="noopener">&#9993; Contact me</a>'+
      '</div>'+
    '</div>'+
  '</div>';
}
(function(){
  var grid=document.getElementById('acx-dir'),count=document.getElementById('acx-count');
  var activeFilter='all',reqId=0,debounceT;
  var fields=['acx-q','acx-cat','acx-gender','acx-loc','acx-nat','acx-lang','acx-sort'];
  var checks=['acx-vipOnly','acx-featOnly'];
  function load(){
    var myReq=++reqId;
    count.textContent='Loading…';
    var p={
      q:document.getElementById('acx-q').value,
      category:document.getElementById('acx-cat').value,
      gender:document.getElementById('acx-gender').value,
      location:document.getElementById('acx-loc').value,
      nationality:document.getElementById('acx-nat').value,
      language:document.getElementById('acx-lang').value,
      sort:document.getElementById('acx-sort').value,
      limit:100
    };
    if(document.getElementById('acx-vipOnly').checked||activeFilter==='vip')p.vip_only='true';
    if(document.getElementById('acx-featOnly').checked||activeFilter==='featured')p.featured_only='true';
    acFetchTalents(p).then(function(items){
      if(myReq!==reqId)return;
      count.textContent=items.length+' '+(items.length===1?'Talent':'Talents');
      grid.innerHTML=items.length?items.map(tCardHtml).join(''):'<p class="acx-state">No talents found.</p>';
    }).catch(function(e){if(myReq!==reqId)return;count.textContent='';grid.innerHTML='<p class="acx-error">'+esc(e.message)+'</p>';});
  }
  function debLoad(){clearTimeout(debounceT);debounceT=setTimeout(load,250);}
  fields.forEach(function(id){var el=document.getElementById(id);if(!el)return;if(el.tagName==='SELECT')el.addEventListener('change',load);else el.addEventListener('input',debLoad);});
  checks.forEach(function(id){var el=document.getElementById(id);if(el)el.addEventListener('change',load);});
  /* Chip filters */
  Array.prototype.forEach.call(document.querySelectorAll('.acx-chip'),function(b){b.addEventListener('click',function(){activeFilter=b.getAttribute('data-filter');Array.prototype.forEach.call(document.querySelectorAll('.acx-chip'),function(x){x.setAttribute('aria-pressed',x===b?'true':'false');});load();});});
  /* Collapsible sections */
  Array.prototype.forEach.call(document.querySelectorAll('.acx-fs-btn'),function(b){b.addEventListener('click',function(){var fs=b.parentNode;fs.setAttribute('data-open',fs.getAttribute('data-open')==='true'?'false':'true');});});
  /* Clear */
  var clr=document.getElementById('acx-clear');if(clr)clr.addEventListener('click',function(){fields.forEach(function(id){var el=document.getElementById(id);if(el)el.value=id==='acx-sort'?'featured':'';});checks.forEach(function(id){var el=document.getElementById(id);if(el)el.checked=false;});activeFilter='all';Array.prototype.forEach.call(document.querySelectorAll('.acx-chip'),function(x){x.setAttribute('aria-pressed',x.getAttribute('data-filter')==='all'?'true':'false');});load();});
  load();
})();
})();</script>`;
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