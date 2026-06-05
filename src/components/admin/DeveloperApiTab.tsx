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

const SNIPPETS: Snippet[] = [
  {
    id: "link",
    title: "Link to the Talents page (simplest)",
    description:
      "Just send users to the full branded Talents page. No CORS, no maintenance.",
    build: (base) => `<a href="${base}/talents" class="button">Browse Talents</a>`,
  },
  {
    id: "iframe",
    title: "Embed the Talents page (iframe)",
    description:
      "Drops the full Talents page (search, filters, grid) into any WordPress page.",
    build: (base) =>
      `<iframe src="${base}/talents" style="width:100%;height:1200px;border:0;" loading="lazy"></iframe>`,
  },
  {
    id: "grid",
    title: "Talents grid widget",
    description: "Lightweight talent cards with search + gender filter.",
    build: (base) => `<div id="ac-talents" style="font-family:system-ui,sans-serif;max-width:1200px;margin:0 auto;">
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
    <input id="ac-q" placeholder="Search…" style="flex:1;min-width:180px;padding:10px;border:1px solid #ddd;border-radius:8px;" />
    <select id="ac-gender" style="padding:10px;border:1px solid #ddd;border-radius:8px;">
      <option value="">All genders</option><option>male</option><option>female</option><option>other</option>
    </select>
    <button id="ac-go" style="padding:10px 16px;border:0;background:#111;color:#fff;border-radius:8px;cursor:pointer;">Search</button>
  </div>
  <div id="ac-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;"></div>
</div>
<script>
(function(){
  var BASE="${base}";
  var grid=document.getElementById('ac-grid');
  function load(){
    var q=encodeURIComponent(document.getElementById('ac-q').value||'');
    var g=encodeURIComponent(document.getElementById('ac-gender').value||'');
    grid.innerHTML='<p>Loading…</p>';
    fetch(BASE+'/api/public/talents?q='+q+'&gender='+g+'&limit=50')
      .then(function(r){return r.json();})
      .then(function(res){
        var items=(res&&(res.data||res))||[];
        if(!items.length){grid.innerHTML='<p>No talents found.</p>';return;}
        grid.innerHTML=items.map(function(t){
          var img=t.headshot_url||'';
          var name=t.stage_name||t.full_name||'Talent';
          return '<a href="'+BASE+'/talents/'+(t.slug||'')+'" target="_blank" style="display:block;text-decoration:none;color:inherit;border:1px solid #eee;border-radius:12px;overflow:hidden;background:#fff;">'
            +(img?'<img src="'+img+'" alt="'+name+'" style="width:100%;aspect-ratio:3/4;object-fit:cover;display:block;" loading="lazy"/>':'<div style="aspect-ratio:3/4;background:#f4f4f5;"></div>')
            +'<div style="padding:10px 12px;"><div style="font-weight:600;">'+name+'</div>'
            +'<div style="font-size:12px;color:#666;">'+(t.location||'')+'</div></div></a>';
        }).join('');
      })
      .catch(function(e){grid.innerHTML='<p style="color:#c00;">Error: '+e.message+'</p>';});
  }
  document.getElementById('ac-go').addEventListener('click',load);
  load();
})();
</script>`,
  },
  {
    id: "casting",
    title: "Casting request form",
    description: "Lets producers submit casting requests directly from WordPress.",
    build: (base) => `<form id="ac-casting" style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;display:grid;gap:10px;">
  <input name="company_name" placeholder="Company / Production *" required style="padding:10px;border:1px solid #ddd;border-radius:8px;" />
  <input name="contact_name" placeholder="Your name *" required style="padding:10px;border:1px solid #ddd;border-radius:8px;" />
  <input name="contact_email" type="email" placeholder="Email *" required style="padding:10px;border:1px solid #ddd;border-radius:8px;" />
  <input name="project_title" placeholder="Project title" style="padding:10px;border:1px solid #ddd;border-radius:8px;" />
  <textarea name="brief" placeholder="Describe the role / brief *" required rows="5" style="padding:10px;border:1px solid #ddd;border-radius:8px;"></textarea>
  <button type="submit" style="padding:12px;background:#111;color:#fff;border:0;border-radius:8px;cursor:pointer;">Send request</button>
  <p id="ac-casting-msg" style="margin:0;font-size:14px;"></p>
</form>
<script>
(function(){
  var BASE="${base}";
  var f=document.getElementById('ac-casting'),m=document.getElementById('ac-casting-msg');
  f.addEventListener('submit',function(e){
    e.preventDefault();m.textContent='Sending…';m.style.color='#666';
    var d=Object.fromEntries(new FormData(f).entries());
    fetch(BASE+'/api/public/casting-requests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})
      .then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j};});})
      .then(function(x){if(x.ok){m.textContent='Request sent. We will contact you shortly.';m.style.color='#0a0';f.reset();}else{m.textContent=(x.j&&x.j.error)||'Failed to send';m.style.color='#c00';}})
      .catch(function(e){m.textContent=e.message;m.style.color='#c00';});
  });
})();
</script>`,
  },
];

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
            Copy any snippet and paste it into a WordPress Custom HTML block.
            No API keys required — these endpoints are public.
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
              Tip: preview URLs need Lovable auth and won't work from WordPress.
              Keep this set to your live domain (e.g. <code>https://acbe.lovable.app</code>).
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
            {snippet.id === "link" || snippet.id === "iframe" ? (
              <Button variant="outline" size="sm" asChild>
                <a href={`${base}/talents`} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open
                </a>
              </Button>
            ) : null}
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
          className="font-mono text-xs h-40 resize-y"
          onClick={(e) => (e.target as HTMLTextAreaElement).select()}
        />
      </CardContent>
    </Card>
  );
}