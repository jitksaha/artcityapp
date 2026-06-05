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
  build: (base: string) => string;
};

/* =========================================================================
   Reusable JS fragments (string-built so we can drop them into <script>)
   ========================================================================= */

const FETCH_HELPER = (base: string) => `var BASE=${JSON.stringify(base)};
function acFetchTalents(params){
  var qs=Object.keys(params||{}).filter(function(k){return params[k]!==''&&params[k]!=null;})
    .map(function(k){return encodeURIComponent(k)+'='+encodeURIComponent(params[k]);}).join('&');
  return fetch(BASE+'/api/public/talents'+(qs?'?'+qs:''))
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
  return '<a class="ac-card" href="'+BASE+'/talents/'+(t.slug||'')+'" target="_blank" rel="noopener" style="'+ring+'">'
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

function buildHero(base: string) {
  return `${AC_RESET_CSS}
<div class="ac-wrap"><div id="ac-hero" style="position:relative;border-radius:18px;overflow:hidden;aspect-ratio:21/9;background:#111;">
  <div id="ac-hero-slides" style="position:absolute;inset:0;"></div>
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.1),rgba(0,0,0,.7));"></div>
  <div id="ac-hero-meta" style="position:absolute;left:0;right:0;bottom:0;padding:32px;color:#fff;"></div>
</div></div>
<script>(function(){${FETCH_HELPER(base)}
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
    +'<a href="'+BASE+'/talents/'+(t.slug||'')+'" target="_blank" rel="noopener" style="display:inline-block;margin-top:14px;background:#fff;color:#111;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;">View profile &rarr;</a>';
}
acFetchTalents({featured_only:'true',limit:8}).then(function(r){items=r.length?r:[];if(!items.length){return acFetchTalents({limit:6}).then(function(x){items=x;render();setInterval(function(){idx++;render();},5000);});}render();setInterval(function(){idx++;render();},5000);});
})();</script>`;
}

function buildVip(base: string) {
  return `${AC_RESET_CSS}
<section class="ac-wrap ac-section" id="ac-vip">
  <div style="margin-bottom:20px;">
    <div class="ac-eyebrow" style="color:#c9a14a;">&#9819; VIP Talent</div>
    <h2>Premium roster</h2>
    <p>Highly requested talents selected by Art City Casting.</p>
  </div>
  <div id="ac-vip-grid" class="ac-grid"></div>
</section>
<script>(function(){${FETCH_HELPER(base)}
var el=document.getElementById('ac-vip-grid');
acFetchTalents({vip_only:'true',limit:8}).then(function(items){
  if(!items.length){el.innerHTML='<p style="color:#666;">No VIP talents yet.</p>';return;}
  el.innerHTML=items.map(function(t){return acCard(t,{vip:true});}).join('');
}).catch(function(e){el.innerHTML='<p style="color:#c00;">'+e.message+'</p>';});
})();</script>`;
}

function buildFeatured(base: string) {
  return `${AC_RESET_CSS}
<section class="ac-wrap ac-section" id="ac-featured">
  <div style="margin-bottom:20px;">
    <div class="ac-eyebrow">&#10026; Featured</div>
    <h2>Featured talents</h2>
  </div>
  <div id="ac-featured-grid" class="ac-grid"></div>
</section>
<script>(function(){${FETCH_HELPER(base)}
var el=document.getElementById('ac-featured-grid');
acFetchTalents({featured_only:'true',limit:8}).then(function(items){
  if(!items.length){el.innerHTML='<p style="color:#666;">No featured talents yet.</p>';return;}
  el.innerHTML=items.map(function(t){return acCard(t);}).join('');
}).catch(function(e){el.innerHTML='<p style="color:#c00;">'+e.message+'</p>';});
})();</script>`;
}

function buildDirectory(base: string) {
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
<script>(function(){${FETCH_HELPER(base)}
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

function buildApplyCta(base: string) {
  return `${AC_RESET_CSS}
<section class="ac-wrap" style="padding:48px 32px;background:linear-gradient(135deg,#fafafa,#f0e9d6);border-radius:20px;text-align:center;">
  <div class="ac-eyebrow" style="color:#c9a14a;">&#10026; Join the roster</div>
  <h2 style="font-size:28px!important;margin:10px 0 0!important;">Apply to Join Art City Casting</h2>
  <p style="margin:10px auto 0!important;max-width:540px;color:#555;font-size:15px;">Actors, actresses, models, voice talents, and performers can submit their information for review. Approved applicants may be added to the Art City Casting talent database.</p>
  <p style="margin:8px 0 0;color:#888;font-size:12px;">You must create an account or sign in before submitting the application form.</p>
  <div style="margin-top:20px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
    <a href="${base}/dashboard" target="_blank" rel="noopener" style="background:#111;color:#fff!important;padding:12px 22px;border-radius:999px;text-decoration:none!important;font-weight:600;font-size:14px;display:inline-block;">Start your application</a>
    <a href="${base}/login" target="_blank" rel="noopener" style="background:#fff;color:#111!important;padding:12px 22px;border-radius:999px;text-decoration:none!important;font-weight:600;font-size:14px;border:1px solid #111;display:inline-block;">Sign in</a>
  </div>
</section>`;
}

function buildCastingForm(base: string) {
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
    fetch(BASE+'/api/public/casting-requests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})
      .then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j};});})
      .then(function(x){if(x.ok){m.textContent='Request sent. We will contact you shortly.';m.style.color='#0a0';f.reset();}else{m.textContent=(x.j&&x.j.error)||'Failed to send';m.style.color='#c00';}})
      .catch(function(e){m.textContent=e.message;m.style.color='#c00';});
  });
})();</script>`;
}

function buildAllInOne(base: string) {
  return `<!-- Art City — Full Talents experience -->
<div class="ac-wrap" style="padding:24px 0;display:grid;gap:32px;">
${buildHero(base)}
${buildVip(base)}
${buildFeatured(base)}
${buildDirectory(base)}
${buildApplyCta(base)}
</div>`;
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
        <CardContent className="space-y-2">
          <label className="text-xs font-medium">Your published site URL</label>
          <Input
            value={base}
            onChange={(e) => setBase(e.target.value.replace(/\/$/, ""))}
            placeholder="https://acbe.lovable.app"
            className="font-mono text-xs"
          />
          {isPreview && (
            <p className="text-xs text-amber-600">
              Preview URLs require Lovable auth. Keep this set to your live
              domain (e.g. <code>https://acbe.lovable.app</code>).
            </p>
          )}
        </CardContent>
      </Card>

      {SNIPPETS.map((s) => (
        <SnippetCard key={s.id} snippet={s} base={base} />
      ))}
    </div>
  );
}

function SnippetCard({ snippet, base }: { snippet: Snippet; base: string }) {
  const code = useMemo(() => snippet.build(base), [snippet, base]);
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