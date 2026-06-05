import { createFileRoute } from "@tanstack/react-router";
import { CORS_HEADERS } from "@/lib/cors";

const SCRIPT = String.raw`(function(){
  var current = document.currentScript;
  if (!current) { var s = document.getElementsByTagName('script'); current = s[s.length-1]; }
  var widget = (current.getAttribute('data-widget') || 'directory').toLowerCase();
  function attr(n,d){ var v=current.getAttribute('data-'+n); return v==null?d:v; }
  var src = current.src || '';
  var API = src.replace(/\/api\/public\/embed\.js.*/, '');
  // Optional signed embed token (data-token="...") — appended to every fetch
  var EMBED_TOKEN = current.getAttribute('data-token') || '';
  function withTok(url){
    if (!EMBED_TOKEN) return url;
    return url + (url.indexOf('?')>-1?'&':'?') + 'token=' + encodeURIComponent(EMBED_TOKEN);
  }
  function tokHeaders(h){ h = h || {}; if (EMBED_TOKEN) h['X-Embed-Token'] = EMBED_TOKEN; return h; }

  // mount target
  var targetId = current.getAttribute('data-target');
  var mount;
  if (targetId) mount = document.getElementById(targetId);
  if (!mount) { mount = document.createElement('div'); current.parentNode.insertBefore(mount, current.nextSibling); }

  // styles (scoped via .acw root class)
  if (!document.getElementById('acw-styles')) {
    var st = document.createElement('style'); st.id='acw-styles';
    st.textContent = ".acw{font-family:'Inter',system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;max-width:100%;box-sizing:border-box}.acw *{box-sizing:border-box}.acw h2{font-size:28px;margin:0 0 16px;font-weight:700;font-family:Georgia,'Times New Roman',serif;letter-spacing:-.01em}.acw label{display:block;font-size:13px;font-weight:500;margin:8px 0 4px}.acw input,.acw textarea,.acw select{width:100%;padding:10px 12px;border:1px solid #e5e7eb;border-radius:8px;font-size:14px;background:#fff;color:#0f172a}.acw input:focus,.acw select:focus,.acw textarea:focus{outline:none;border-color:#0f172a;box-shadow:0 0 0 3px rgba(15,23,42,.08)}.acw textarea{min-height:80px;resize:vertical}.acw button{background:#0f172a;color:#fff;border:0;padding:10px 16px;border-radius:8px;font-size:14px;cursor:pointer;font-weight:500}.acw button:disabled{opacity:.6;cursor:not-allowed}.acw .acw-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}.acw .acw-msg{padding:10px;border-radius:8px;font-size:14px;margin-top:10px}.acw .acw-ok{background:#dcfce7;color:#14532d}.acw .acw-err{background:#fee2e2;color:#7f1d1d}.acw .acw-grid{display:grid;gap:20px}.acw .acw-card{border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;background:#fff;transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease;cursor:pointer;display:flex;flex-direction:column}.acw .acw-card:hover{transform:translateY(-3px);box-shadow:0 10px 25px rgba(0,0,0,.08);border-color:#cbd5e1}.acw .acw-card .acw-photo{position:relative;width:100%;aspect-ratio:3/4;overflow:hidden;background:#f1f5f9}.acw .acw-card .acw-photo img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s ease}.acw .acw-card:hover .acw-photo img{transform:scale(1.04)}.acw .acw-card .acw-body{padding:14px 16px 16px}.acw .acw-card .acw-name{font-weight:600;font-size:16px;margin:0;color:#0f172a;letter-spacing:-.01em}.acw .acw-card .acw-meta{font-size:13px;color:#64748b;margin:4px 0 0;line-height:1.4}.acw .acw-card .acw-badges{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}.acw .acw-badge{font-size:10px;padding:3px 8px;border-radius:4px;background:#fef3c7;color:#92400e;font-weight:700;text-transform:uppercase;letter-spacing:.06em}.acw .acw-badge.vip{background:#fce7f3;color:#9d174d}.acw .acw-filters{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-bottom:20px}.acw .acw-count{font-size:13px;color:#64748b;margin:0 0 14px}@media(max-width:520px){.acw .acw-row{grid-template-columns:1fr}}.acw .acw-back{background:transparent;color:#374151;border:1px solid #e5e7eb;padding:6px 12px;font-size:13px;margin-bottom:14px;border-radius:8px}.acw .acw-back:hover{background:#f8fafc}.acw .acw-profile{display:grid;grid-template-columns:320px 1fr;gap:32px}.acw .acw-profile .acw-hero{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:10px;background:#f1f5f9}.acw .acw-profile h1{font-size:32px;margin:0 0 6px;font-weight:700;font-family:Georgia,'Times New Roman',serif;letter-spacing:-.02em}.acw .acw-profile .acw-sub{color:#64748b;font-size:14px;margin:0 0 12px}.acw .acw-chips{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}.acw .acw-chip{font-size:12px;padding:4px 10px;border-radius:999px;background:#f1f5f9;color:#334155}.acw .acw-section{margin-top:22px}.acw .acw-section h3{font-size:15px;font-weight:600;margin:0 0 10px;color:#0f172a;text-transform:uppercase;letter-spacing:.06em}.acw .acw-section p{font-size:14px;color:#334155;line-height:1.65;margin:0}.acw .acw-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-top:8px}.acw .acw-gallery img{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:8px;cursor:zoom-in;background:#f1f5f9}.acw .acw-lightbox{position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;cursor:zoom-out}.acw .acw-lightbox img{max-width:100%;max-height:100%;object-fit:contain}@media(max-width:640px){.acw .acw-profile{grid-template-columns:1fr}}";
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
    var registerUrl = attr('register-url', API + '/register');
    var loginUrl = attr('login-url', API + '/login');
    var form = h('form',{class:'acw'},[
      h('h2',null,['Apply as Talent']),
      field('Full name','full_name',{required:'true'}),
      field('Email','email',{type:'email',required:'true'}),
      field('Password','password',{type:'password',required:'true','minlength':'6'}),
      h('div',{style:'margin-top:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap'},[
        h('button',{type:'submit'},['Create account & continue']),
        h('a',{href:loginUrl,style:'font-size:13px;color:#6b7280;text-decoration:underline'},['Already have an account? Sign in']),
      ]),
      h('p',{style:'font-size:12px;color:#6b7280;margin-top:8px'},['After creating your account you will continue to the full talent application (photos, skills, experience, agreements).']),
    ]);
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var btn = form.querySelector('button'); btn.disabled=true; btn.textContent='Creating…';
      var payload = {
        full_name: form.full_name.value,
        email: form.email.value,
        password: form.password.value,
        redirect_to: registerUrl,
      };
      fetch(withTok(API+'/api/public/signup'),{method:'POST',headers:tokHeaders({'Content-Type':'application/json'}),body:JSON.stringify(payload)})
        .then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j}})})
        .then(function(res){
          if(res.ok){
            msg(form,'Account created. Redirecting you to complete your talent profile…',true);
            // Hand off to the app's full multi-step register flow.
            // The app's /register route uses the active Supabase session; the user
            // will be prompted to log in there if email confirmation is required.
            var email = encodeURIComponent(payload.email);
            setTimeout(function(){
              window.location.href = registerUrl + (registerUrl.indexOf('?')>-1?'&':'?') + 'email=' + email;
            }, 900);
          } else {
            btn.disabled=false; btn.textContent='Create account & continue';
            msg(form, res.j.error || 'Failed to sign up', false);
          }
        })
        .catch(function(err){ btn.disabled=false; btn.textContent='Create account & continue'; msg(form, err.message, false); });
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
      fetch(withTok(API+'/api/public/casting-request'),{method:'POST',headers:tokHeaders({'Content-Type':'application/json'}),body:JSON.stringify(data)})
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
    // When 'true' (default), profile opens inline inside the same widget.
    // When 'false', clicking a card opens the external app profile page.
    var inlineProfile = attr('inline-profile','true') !== 'false';

    var wrap = h('div',{class:'acw'},[]);
    if (title) wrap.appendChild(h('h2',null,[title]));
    var filters;
    if (showFilters){
      filters = h('div',{class:'acw-filters'},[
        h('input',{type:'search',placeholder:'Search by name...',id:'acw-q'}),
        (function(){var s=h('select',{id:'acw-gender'},[]);[['','Any gender'],['male','Male'],['female','Female'],['non_binary','Non-binary'],['other','Other']].forEach(function(g){var o=h('option',{value:g[0]},[g[1]]);s.appendChild(o)});return s;})(),
        h('input',{type:'text',placeholder:'Location',id:'acw-location',value:fixedLocation||''}),
        h('input',{type:'text',placeholder:'Language',id:'acw-language',value:fixedLanguage||''}),
      ]);
      wrap.appendChild(filters);
    }
    var gridStyle = columns ? 'grid-template-columns:repeat('+columns+',minmax(0,1fr))' : 'grid-template-columns:repeat(auto-fill,minmax(200px,1fr))';
    var grid = h('div',{class:'acw-grid',style:gridStyle},[]);
    var count = h('p',{class:'acw-count'},['']);
    wrap.appendChild(count);
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
      fetch(withTok(API+'/api/public/talents?'+qs.toString()),{headers:tokHeaders()})
        .then(function(r){return r.json()})
        .then(function(res){
          grid.innerHTML='';
          var list = res.talents||[];
          count.textContent = list.length + (list.length===1?' result':' results');
          if (!list.length){ grid.appendChild(h('p',{style:'grid-column:1/-1;color:#6b7280'},['No talents found.'])); return; }
          list.forEach(function(t){
            var ageStr = t.playing_age || (t.age ? String(t.age) : '');
            var meta = [t.gender, ageStr, t.location].filter(Boolean).join(' · ');
            var badges = [];
            if (t.featured) badges.push(h('span',{class:'acw-badge'},['Featured']));
            if (t.vip) badges.push(h('span',{class:'acw-badge vip'},['VIP']));
            var cardAttrs = inlineProfile
              ? {class:'acw-card', role:'button', tabindex:'0', style:'text-decoration:none;color:inherit'}
              : {class:'acw-card', href:linkBase+'/talents/'+t.slug, target:'_blank', rel:'noopener', style:'text-decoration:none;color:inherit'};
            var card = h(inlineProfile?'div':'a', cardAttrs, [
              h('div',{class:'acw-photo'},[
                t.headshot_url ? h('img',{src:t.headshot_url,alt:t.stage_name||'',loading:'lazy'}) : null,
              ]),
              h('div',{class:'acw-body'},[
                h('p',{class:'acw-name'},[t.stage_name||t.full_name||'Untitled']),
                h('p',{class:'acw-meta'},[meta]),
                badges.length ? h('div',{class:'acw-badges'},badges) : null,
              ]),
            ]);
            if (inlineProfile) {
              card.addEventListener('click', function(){ openProfile(t.slug); });
              card.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); openProfile(t.slug); } });
            }
            grid.appendChild(card);
          });
        })
        .catch(function(err){ grid.innerHTML=''; grid.appendChild(h('p',{style:'grid-column:1/-1;color:#7f1d1d'},[err.message])); });
    }
    if (filters) filters.addEventListener('input', function(){ clearTimeout(timer); timer=setTimeout(load,300); });
    if (refreshSec > 0) setInterval(load, refreshSec*1000);
    load();

    // Shareable URLs: ?talent=<slug> opens that profile inline.
    var URL_PARAM = attr('url-param','talent');
    function getSlugFromUrl(){
      try { return new URLSearchParams(window.location.search).get(URL_PARAM) || ''; } catch(_){ return ''; }
    }
    function setUrlSlug(slug, push){
      try {
        var u = new URL(window.location.href);
        if (slug) u.searchParams.set(URL_PARAM, slug); else u.searchParams.delete(URL_PARAM);
        var method = push ? 'pushState' : 'replaceState';
        window.history[method]({acwSlug:slug||null}, '', u.toString());
      } catch(_){}
    }

    // Inline profile navigation — preserve directory state and restore on back.
    var directoryDom = wrap;
    var currentProfileWrap = null;
    function openProfile(slug, fromPopstate){
      if (!slug) return;
      if (currentProfileWrap) { currentProfileWrap.remove(); currentProfileWrap = null; }
      // Hide directory, render profile in its place.
      directoryDom.style.display = 'none';
      var profileWrap = h('div',{class:'acw','data-acw-profile':'1'},[]);
      mount.appendChild(profileWrap);
      currentProfileWrap = profileWrap;
      if (!fromPopstate) setUrlSlug(slug, true);
      // Smooth scroll to top of widget.
      try { mount.scrollIntoView({behavior:'smooth', block:'start'}); } catch(_){}
      renderProfileInto(profileWrap, slug, function(){
        profileWrap.remove();
        currentProfileWrap = null;
        directoryDom.style.display = '';
        // Prefer real history back so URL clears naturally; fall back to manual clear.
        if (window.history.state && window.history.state.acwSlug) { window.history.back(); }
        else { setUrlSlug('', false); }
        try { mount.scrollIntoView({behavior:'smooth', block:'start'}); } catch(_){}
      });
    }

    // Browser back/forward + initial deep-link.
    window.addEventListener('popstate', function(){
      var slug = getSlugFromUrl();
      if (slug) { openProfile(slug, true); }
      else if (currentProfileWrap) {
        currentProfileWrap.remove(); currentProfileWrap = null;
        directoryDom.style.display = '';
      }
    });
    var initialSlug = getSlugFromUrl();
    if (initialSlug) openProfile(initialSlug, true);
  }

  // ============ PROFILE ============
  function renderProfileInto(parent, slug, onBack){
    parent.innerHTML = '';
    if (onBack) {
      parent.appendChild(h('button',{class:'acw-back',type:'button',onclick:onBack},['← Back to directory']));
    }
    var status = h('p',{style:'color:#6b7280'},['Loading profile…']);
    parent.appendChild(status);
    fetch(withTok(API+'/api/public/talent/'+encodeURIComponent(slug)),{headers:tokHeaders()})
      .then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j}})})
      .then(function(res){
        status.remove();
        if (!res.ok){ parent.appendChild(h('p',{class:'acw-msg acw-err'},[res.j.error||'Failed to load profile'])); return; }
        var t = res.j.talent || {};
        var media = res.j.media || [];
        var heroSrc = t.headshot_url || (media[0] && media[0].url) || '';
        var meta = [t.gender, t.playing_age, t.location, t.nationality].filter(Boolean).join(' · ');
        var chips = [];
        (t.categories||[]).forEach(function(c){ chips.push(h('span',{class:'acw-chip'},[String(c)])); });
        if (t.native_language) chips.push(h('span',{class:'acw-chip'},['Speaks: '+t.native_language]));

        var sections = [];
        if (t.bio) sections.push(h('div',{class:'acw-section'},[h('h3',null,['About']), h('p',null,[t.bio])]));

        function kvSection(title, obj){
          if (!obj || typeof obj !== 'object') return null;
          var keys = Object.keys(obj).filter(function(k){ return obj[k] != null && obj[k] !== '' && !(Array.isArray(obj[k]) && obj[k].length===0); });
          if (!keys.length) return null;
          var rows = keys.map(function(k){
            var v = obj[k]; if (Array.isArray(v)) v = v.join(', '); else if (typeof v === 'object') v = JSON.stringify(v);
            return h('div',{style:'display:flex;gap:8px;font-size:14px;padding:4px 0;border-bottom:1px solid #f4f4f5'},[
              h('span',{style:'color:#6b7280;min-width:140px;text-transform:capitalize'},[k.replace(/_/g,' ')]),
              h('span',{style:'color:#111'},[String(v)]),
            ]);
          });
          return h('div',{class:'acw-section'},[h('h3',null,[title])].concat(rows));
        }
        var phys = kvSection('Physical', t.physical); if (phys) sections.push(phys);
        var skl = kvSection('Skills', t.skills); if (skl) sections.push(skl);
        var lang = kvSection('Languages', t.languages); if (lang) sections.push(lang);
        var exp = kvSection('Experience', t.experience); if (exp) sections.push(exp);

        if (media.length){
          var gallery = h('div',{class:'acw-gallery'},
            media.map(function(m){
              var img = h('img',{src:m.url, alt:(t.stage_name||t.full_name||'Talent'), loading:'lazy'});
              img.addEventListener('click', function(){ openLightbox(m.url); });
              return img;
            })
          );
          sections.push(h('div',{class:'acw-section'},[h('h3',null,['Gallery']), gallery]));
        }

        if (t.showreel_link){
          sections.push(h('div',{class:'acw-section'},[h('h3',null,['Showreel']), h('p',null,[h('a',{href:t.showreel_link,target:'_blank',rel:'noopener',style:'color:#2563eb;text-decoration:underline'},[t.showreel_link])])]));
        }

        var profile = h('div',{class:'acw-profile'},[
          h('div',null,[ heroSrc ? h('img',{class:'acw-hero',src:heroSrc,alt:(t.stage_name||t.full_name||'Talent')}) : h('div',{class:'acw-hero'}) ]),
          h('div',null,[
            h('h1',null,[t.stage_name||t.full_name||'Untitled']),
            h('p',{class:'acw-sub'},[meta]),
            chips.length ? h('div',{class:'acw-chips'},chips) : null,
          ].concat(sections)),
        ]);
        parent.appendChild(profile);
      })
      .catch(function(err){ status.remove(); parent.appendChild(h('p',{class:'acw-msg acw-err'},[err.message])); });
  }

  function openLightbox(src){
    var box = h('div',{class:'acw-lightbox'},[h('img',{src:src,alt:''})]);
    box.addEventListener('click', function(){ box.remove(); });
    document.body.appendChild(box);
  }

  // ============ PROFILE WIDGET (standalone) ============
  function renderProfileWidget(){
    var slug = attr('slug','');
    if (!slug){ mount.appendChild(h('div',{class:'acw acw-msg acw-err'},['Missing data-slug attribute.'])); return; }
    var wrap = h('div',{class:'acw'},[]); mount.appendChild(wrap);
    renderProfileInto(wrap, slug, null);
  }

  if (widget==='signup') renderSignup();
  else if (widget==='casting' || widget==='casting-request') renderCasting();
  else if (widget==='profile' || widget==='talent') renderProfileWidget();
  else renderDirectory(); // accepts 'talents' | 'directory' | default
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