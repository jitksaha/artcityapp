import { createFileRoute } from "@tanstack/react-router";
import { CORS_HEADERS } from "@/lib/cors";

const SCRIPT = String.raw`(function(){
  var current = document.currentScript;
  if (!current) { var s = document.getElementsByTagName('script'); current = s[s.length-1]; }
  var widget = (current.getAttribute('data-widget') || 'directory').toLowerCase();
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
    st.textContent = ".acw{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111;max-width:100%;box-sizing:border-box}.acw *{box-sizing:border-box}.acw h2{font-size:20px;margin:0 0 12px}.acw label{display:block;font-size:13px;font-weight:500;margin:8px 0 4px}.acw input,.acw textarea,.acw select{width:100%;padding:8px 10px;border:1px solid #d4d4d8;border-radius:6px;font-size:14px;background:#fff}.acw textarea{min-height:80px;resize:vertical}.acw button{background:#111;color:#fff;border:0;padding:10px 16px;border-radius:6px;font-size:14px;cursor:pointer;font-weight:500}.acw button:disabled{opacity:.6;cursor:not-allowed}.acw .acw-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}.acw .acw-msg{padding:10px;border-radius:6px;font-size:14px;margin-top:10px}.acw .acw-ok{background:#dcfce7;color:#14532d}.acw .acw-err{background:#fee2e2;color:#7f1d1d}.acw .acw-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px}.acw .acw-card{border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;background:#fff}.acw .acw-card img{width:100%;aspect-ratio:3/4;object-fit:cover;display:block;background:#f4f4f5}.acw .acw-card .acw-body{padding:8px 10px}.acw .acw-card .acw-name{font-weight:600;font-size:14px;margin:0}.acw .acw-card .acw-meta{font-size:12px;color:#6b7280;margin:2px 0 0}.acw .acw-filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}.acw .acw-filters input,.acw .acw-filters select{flex:1;min-width:140px}@media(max-width:520px){.acw .acw-row{grid-template-columns:1fr}}";
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
    var wrap = h('div',{class:'acw'},[h('h2',null,['Actor Directory'])]);
    var filters = h('div',{class:'acw-filters'},[
      h('input',{type:'search',placeholder:'Search by name…',id:'acw-q'}),
      (function(){var s=h('select',{id:'acw-gender'},[]);['','male','female','other'].forEach(function(g){var o=h('option',{value:g},[g||'Any gender']);s.appendChild(o)});return s;})(),
      h('input',{type:'text',placeholder:'Location',id:'acw-location'}),
    ]);
    var grid = h('div',{class:'acw-grid'},[]);
    wrap.appendChild(filters); wrap.appendChild(grid); mount.appendChild(wrap);

    var timer;
    function load(){
      grid.innerHTML = '<p style="grid-column:1/-1;color:#6b7280">Loading…</p>';
      var qs = new URLSearchParams();
      if (filters.querySelector('#acw-q').value) qs.set('q', filters.querySelector('#acw-q').value);
      if (filters.querySelector('#acw-gender').value) qs.set('gender', filters.querySelector('#acw-gender').value);
      if (filters.querySelector('#acw-location').value) qs.set('location', filters.querySelector('#acw-location').value);
      fetch(API+'/api/public/talents?'+qs.toString())
        .then(function(r){return r.json()})
        .then(function(res){
          grid.innerHTML='';
          var list = res.talents||[];
          if (!list.length){ grid.appendChild(h('p',{style:'grid-column:1/-1;color:#6b7280'},['No talents found.'])); return; }
          list.forEach(function(t){
            var meta = [t.gender,t.playing_age,t.location].filter(Boolean).join(' · ');
            var card = h('a',{class:'acw-card',href:API+'/talents/'+t.slug,target:'_blank',rel:'noopener',style:'text-decoration:none;color:inherit'},[
              t.headshot_url ? h('img',{src:t.headshot_url,alt:t.stage_name||'',loading:'lazy'}) : h('div',{style:'aspect-ratio:3/4;background:#f4f4f5'}),
              h('div',{class:'acw-body'},[
                h('p',{class:'acw-name'},[t.stage_name||t.full_name||'Untitled']),
                h('p',{class:'acw-meta'},[meta]),
              ]),
            ]);
            grid.appendChild(card);
          });
        })
        .catch(function(err){ grid.innerHTML=''; grid.appendChild(h('p',{style:'grid-column:1/-1;color:#7f1d1d'},[err.message])); });
    }
    filters.addEventListener('input', function(){ clearTimeout(timer); timer=setTimeout(load,300); });
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