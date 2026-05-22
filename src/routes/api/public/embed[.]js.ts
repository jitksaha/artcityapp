import { createFileRoute } from "@tanstack/react-router";
import { CORS_HEADERS } from "@/lib/cors";

const SCRIPT = String.raw`(function(){
  var current = document.currentScript;
  if (!current) { var s = document.getElementsByTagName('script'); current = s[s.length-1]; }
  var widget = (current.getAttribute('data-widget') || 'directory').toLowerCase();
  function attr(n,d){ var v=current.getAttribute('data-'+n); return v==null?d:v; }
  var src = current.src || '';
  var API = src.replace(/\/api\/public\/embed\.js.*/, '');

  // mount target
  var targetId = current.getAttribute('data-target');
  var mount;
  if (targetId) mount = document.getElementById(targetId);
  if (!mount) { mount = document.createElement('div'); current.parentNode.insertBefore(mount, current.nextSibling); }

  // styles (scoped via .acw root class)
  if (!document.getElementById('acw-styles')) {
    var st = document.createElement('style'); st.id='acw-styles';
    st.textContent = ".acw{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111;max-width:100%;box-sizing:border-box}.acw *{box-sizing:border-box}.acw h2{font-size:20px;margin:0 0 12px}.acw label{display:block;font-size:13px;font-weight:500;margin:8px 0 4px}.acw input,.acw textarea,.acw select{width:100%;padding:8px 10px;border:1px solid #d4d4d8;border-radius:6px;font-size:14px;background:#fff}.acw textarea{min-height:80px;resize:vertical}.acw button{background:#111;color:#fff;border:0;padding:10px 16px;border-radius:6px;font-size:14px;cursor:pointer;font-weight:500}.acw button:disabled{opacity:.6;cursor:not-allowed}.acw .acw-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}.acw .acw-msg{padding:10px;border-radius:6px;font-size:14px;margin-top:10px}.acw .acw-ok{background:#dcfce7;color:#14532d}.acw .acw-err{background:#fee2e2;color:#7f1d1d}.acw .acw-grid{display:grid;gap:14px}.acw .acw-card{border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;background:#fff;transition:transform .15s,box-shadow .15s}.acw .acw-card:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.08)}.acw .acw-card img{width:100%;aspect-ratio:3/4;object-fit:cover;display:block;background:#f4f4f5}.acw .acw-card .acw-body{padding:8px 10px}.acw .acw-card .acw-name{font-weight:600;font-size:14px;margin:0}.acw .acw-card .acw-meta{font-size:12px;color:#6b7280;margin:2px 0 0}.acw .acw-card .acw-badges{display:flex;gap:4px;margin-top:4px;flex-wrap:wrap}.acw .acw-badge{font-size:10px;padding:2px 6px;border-radius:4px;background:#fef3c7;color:#92400e;font-weight:600;text-transform:uppercase;letter-spacing:.04em}.acw .acw-badge.vip{background:#fce7f3;color:#9d174d}.acw .acw-filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}.acw .acw-filters input,.acw .acw-filters select{flex:1;min-width:140px}@media(max-width:520px){.acw .acw-row{grid-template-columns:1fr}}";
    document.head.appendChild(st);
  }

  function h(tag, attrs, children){
    var el = document.createElement(tag);
    if (attrs) for (var k in attrs){ if (k==='html') el.innerHTML=attrs[k]; else if (k.indexOf('on')===0) el[k]=attrs[k]; else el.setAttribute(k,attrs[k]); }
    (children||[]).forEach(function(c){ if(c==null)return; el.appendChild(typeof c==='string'?document.createTextNode(c):c); });
    return el;
  }

  function field(label, name, attrs){
    attrs = attrs || {}; attrs.name = name; attrs.id = 'acw-'+name;
    var input = h(attrs.tag==='textarea'?'textarea':'input', attrs);
    return h('div', null, [h('label',{for:attrs.id},[label]), input]);
  }

  function msg(parent, text, ok){
    var existing = parent.querySelector('.acw-msg'); if (existing) existing.remove();
    parent.appendChild(h('div',{class:'acw-msg '+(ok?'acw-ok':'acw-err')},[text]));
  }

  // ============ SIGNUP ============
  function renderSignup(){
    var form = h('form',{class:'acw'},[
      h('h2',null,['Apply as Talent']),
      field('Full name','full_name',{required:'true'}),
      field('Email','email',{type:'email',required:'true'}),
      field('Password','password',{type:'password',required:'true','minlength':'6'}),
      h('div',{style:'margin-top:12px'},[h('button',{type:'submit'},['Create account'])]),
    ]);
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var btn = form.querySelector('button'); btn.disabled=true; btn.textContent='Creating…';
      var payload = {
        full_name: form.full_name.value,
        email: form.email.value,
        password: form.password.value,
      };
      fetch(API+'/api/public/signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
        .then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j}})})
        .then(function(res){
          btn.disabled=false; btn.textContent='Create account';
          if(res.ok){ msg(form,'Account created. Check your email to verify.',true); form.reset(); }
          else msg(form, res.j.error || 'Failed to sign up', false);
        })
        .catch(function(err){ btn.disabled=false; btn.textContent='Create account'; msg(form, err.message, false); });
    });
    mount.appendChild(form);
  }

  // ============ CASTING REQUEST ============
  function renderCasting(){
    var form = h('form',{class:'acw'},[
      h('h2',null,['Casting Request']),
      h('div',{class:'acw-row'},[
        field('Production title *','production_title',{required:'true'}),
        field('Production type','production_type',{placeholder:'Film, TV, commercial…'}),
        field('Shooting dates','shooting_dates'),
        field('Shooting location','shooting_location'),
        field('Budget range','budget_range'),
        field('Company name','company_name'),
        field('Contact person *','contact_person',{required:'true'}),
        field('Email *','email',{type:'email',required:'true'}),
        field('Phone','phone'),
        field('Requested talent','requested_talent_name'),
      ]),
      field('Role description','role_description',{tag:'textarea'}),
      field('Message','message',{tag:'textarea'}),
      h('div',{style:'margin-top:12px'},[h('button',{type:'submit'},['Submit Request'])]),
    ]);
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var btn = form.querySelector('button'); btn.disabled=true; btn.textContent='Sending…';
      var data = {}; new FormData(form).forEach(function(v,k){ if(v) data[k]=v; });
      fetch(API+'/api/public/casting-request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
        .then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j}})})
        .then(function(res){
          btn.disabled=false; btn.textContent='Submit Request';
          if(res.ok){ msg(form,"Request submitted. We'll be in touch.",true); form.reset(); }
          else msg(form, res.j.error || 'Failed to submit', false);
        })
        .catch(function(err){ btn.disabled=false; btn.textContent='Submit Request'; msg(form,err.message,false); });
    });
    mount.appendChild(form);
  }

  // ============ DIRECTORY ============
  function renderDirectory(){
    var title = attr('title','Talent Directory');
    var showFilters = attr('filters','true') !== 'false';
    var columns = parseInt(attr('columns','0'),10) || 0;
    var limit = attr('limit','');
    var fixedCategory = attr('category','');
    var fixedLocation = attr('location','');
    var fixedLanguage = attr('language','');
    var vipOnly = attr('vip','') === 'true';
    var featuredOnly = attr('featured','') === 'true';
    var refreshSec = parseInt(attr('refresh','0'),10) || 0;
    var linkBase = attr('link-base', API);

    var wrap = h('div',{class:'acw'},[]);
    if (title) wrap.appendChild(h('h2',null,[title]));
    var filters;
    if (showFilters){
      filters = h('div',{class:'acw-filters'},[
        h('input',{type:'search',placeholder:'Search by name…',id:'acw-q'}),
        (function(){var s=h('select',{id:'acw-gender'},[]);['','male','female','other'].forEach(function(g){var o=h('option',{value:g},[g||'Any gender']);s.appendChild(o)});return s;})(),
        h('input',{type:'text',placeholder:'Location',id:'acw-location',value:fixedLocation||''}),
        h('input',{type:'text',placeholder:'Language',id:'acw-language',value:fixedLanguage||''}),
      ]);
      wrap.appendChild(filters);
    }
    var gridStyle = columns ? 'grid-template-columns:repeat('+columns+',minmax(0,1fr))' : 'grid-template-columns:repeat(auto-fill,minmax(180px,1fr))';
    var grid = h('div',{class:'acw-grid',style:gridStyle},[]);
    wrap.appendChild(grid); mount.appendChild(wrap);

    var timer;
    function load(){
      grid.innerHTML = '<p style="grid-column:1/-1;color:#6b7280">Loading…</p>';
      var qs = new URLSearchParams();
      if (filters){
        var qEl=filters.querySelector('#acw-q'); if(qEl&&qEl.value) qs.set('q',qEl.value);
        var gEl=filters.querySelector('#acw-gender'); if(gEl&&gEl.value) qs.set('gender',gEl.value);
        var lEl=filters.querySelector('#acw-location'); if(lEl&&lEl.value) qs.set('location',lEl.value);
        var langEl=filters.querySelector('#acw-language'); if(langEl&&langEl.value) qs.set('language',langEl.value);
      } else {
        if (fixedLocation) qs.set('location',fixedLocation);
        if (fixedLanguage) qs.set('language',fixedLanguage);
      }
      if (fixedCategory) qs.set('category',fixedCategory);
      if (vipOnly) qs.set('vip_only','true');
      if (featuredOnly) qs.set('featured_only','true');
      if (limit) qs.set('limit',limit);
      fetch(API+'/api/public/talents?'+qs.toString())
        .then(function(r){return r.json()})
        .then(function(res){
          grid.innerHTML='';
          var list = res.talents||[];
          if (!list.length){ grid.appendChild(h('p',{style:'grid-column:1/-1;color:#6b7280'},['No talents found.'])); return; }
          list.forEach(function(t){
            var meta = [t.gender,t.playing_age,t.location].filter(Boolean).join(' · ');
            var badges = [];
            if (t.featured) badges.push(h('span',{class:'acw-badge'},['Featured']));
            if (t.vip) badges.push(h('span',{class:'acw-badge vip'},['VIP']));
            var card = h('a',{class:'acw-card',href:linkBase+'/talents/'+t.slug,target:'_blank',rel:'noopener',style:'text-decoration:none;color:inherit'},[
              t.headshot_url ? h('img',{src:t.headshot_url,alt:t.stage_name||'',loading:'lazy'}) : h('div',{style:'aspect-ratio:3/4;background:#f4f4f5'}),
              h('div',{class:'acw-body'},[
                h('p',{class:'acw-name'},[t.stage_name||t.full_name||'Untitled']),
                h('p',{class:'acw-meta'},[meta]),
                badges.length ? h('div',{class:'acw-badges'},badges) : null,
              ]),
            ]);
            grid.appendChild(card);
          });
        })
        .catch(function(err){ grid.innerHTML=''; grid.appendChild(h('p',{style:'grid-column:1/-1;color:#7f1d1d'},[err.message])); });
    }
    if (filters) filters.addEventListener('input', function(){ clearTimeout(timer); timer=setTimeout(load,300); });
    if (refreshSec > 0) setInterval(load, refreshSec*1000);
    load();
  }

  if (widget==='signup') renderSignup();
  else if (widget==='casting' || widget==='casting-request') renderCasting();
  else renderDirectory();
})();`;

export const Route = createFileRoute("/api/public/embed.js")({
  server: {
    handlers: {
      GET: async () =>
        new Response(SCRIPT, {
          status: 200,
          headers: {
            "Content-Type": "application/javascript; charset=utf-8",
            "Cache-Control": "public, max-age=300",
            ...CORS_HEADERS,
          },
        }),
    },
  },
});