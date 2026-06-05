import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Endpoint = {
  id: string;
  name: string;
  method: "GET" | "POST";
  path: string;
  description: string;
  auth: "none" | "admin";
  query?: string;
  body?: string;
  embed?: (base: string) => string;
};

const ENDPOINTS: Endpoint[] = [
  {
    id: "talents-list",
    name: "Talents — List",
    method: "GET",
    path: "/api/public/talents",
    description:
      "Returns published, approved, publicly visible talents. Supports filters and sort.",
    auth: "none",
    query:
      "?q=&gender=&category=&language=&location=&nationality=&playing_age=&age_min=&age_max=&vip_only=true&featured_only=true&sort=featured&limit=50",
    embed: (base) => buildTalentsListEmbed(base),
  },
  {
    id: "talents-get",
    name: "Talents — Get by slug",
    method: "GET",
    path: "/api/public/talents/{slug}",
    description: "Returns a single talent (with media) by slug.",
    auth: "none",
    embed: (base) => buildTalentBySlugEmbed(base),
  },
  {
    id: "casting",
    name: "Casting Requests — Submit",
    method: "POST",
    path: "/api/public/casting-requests",
    description: "Submits a casting request for a talent or general inquiry.",
    auth: "none",
    body: JSON.stringify(
      {
        production_title: "Brand Campaign 2026",
        production_type: "commercial",
        role_description: "Lead model, 25-35.",
        shooting_dates: "Q1 2026",
        shooting_location: "Stockholm",
        budget_range: "10-20k EUR",
        company_name: "Acme Studios",
        contact_person: "Jane Doe",
        phone: "+46 70 000 0000",
        email: "jane@example.com",
        message: "Looking forward to it.",
        talent_id: null,
        requested_talent_name: "",
      },
      null,
      2,
    ),
    embed: (base) => buildCastingFormEmbed(base),
  },
  {
    id: "applications",
    name: "Applications — Submit",
    method: "POST",
    path: "/api/public/applications",
    description:
      "Creates an applicant account + talent draft profile. Set submit:true to submit for review.",
    auth: "none",
    body: JSON.stringify(
      {
        email: "new.talent@example.com",
        password: "a-strong-password",
        full_name: "New Talent",
        stage_name: "NT",
        gender: "female",
        age: 27,
        playing_age: "25-32",
        location: "Stockholm",
        nationality: "Swedish",
        native_language: "Swedish",
        bio: "Short bio.",
        categories: ["model"],
        submit: false,
      },
      null,
      2,
    ),
    embed: (base) => buildApplicationFormEmbed(base),
  },
  {
    id: "login",
    name: "Auth — Login",
    method: "POST",
    path: "/api/public/auth/login",
    description:
      "Sign in with email + password. Returns Supabase session tokens.",
    auth: "none",
    body: JSON.stringify(
      { email: "user@example.com", password: "password" },
      null,
      2,
    ),
    embed: (base) => buildLoginFormEmbed(base),
  },
];

export function DeveloperApiTab() {
  const base = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Public API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Base URL: <code className="text-foreground">{base}</code>
          </p>
          <p>
            All endpoints live under <code>/api/public/*</code>, return JSON,
            and allow cross-origin requests (CORS <code>*</code>).
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue={ENDPOINTS[0].id} className="w-full">
        <TabsList className="flex flex-wrap h-auto">
          {ENDPOINTS.map((e) => (
            <TabsTrigger key={e.id} value={e.id} className="text-xs">
              {e.name}
            </TabsTrigger>
          ))}
        </TabsList>
        {ENDPOINTS.map((e) => (
          <TabsContent key={e.id} value={e.id} className="mt-4">
            <EndpointCard endpoint={e} base={base} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function EndpointCard({ endpoint, base }: { endpoint: Endpoint; base: string }) {
  const [pathOverride, setPathOverride] = useState(endpoint.path);
  const [query, setQuery] = useState(endpoint.query ?? "");
  const [body, setBody] = useState(endpoint.body ?? "");
  const [resp, setResp] = useState<{ status: number; body: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const fullUrl = useMemo(() => {
    const path = pathOverride.replace("{slug}", "example-slug");
    return `${base}${path}${endpoint.method === "GET" ? query : ""}`;
  }, [base, pathOverride, query, endpoint.method]);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  const run = async () => {
    setLoading(true);
    setResp(null);
    try {
      const init: RequestInit = {
        method: endpoint.method,
        headers: { "Content-Type": "application/json" },
      };
      if (endpoint.method === "POST" && body.trim()) init.body = body;
      const res = await fetch(fullUrl, init);
      const text = await res.text();
      let pretty = text;
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch {}
      setResp({ status: res.status, body: pretty });
    } catch (err: any) {
      setResp({ status: 0, body: String(err?.message || err) });
    } finally {
      setLoading(false);
    }
  };

  const curl = useMemo(() => {
    const lines = [`curl -X ${endpoint.method} '${fullUrl}'`];
    if (endpoint.method === "POST") {
      lines.push(`  -H 'Content-Type: application/json'`);
      if (body.trim()) lines.push(`  -d '${body.replace(/'/g, "'\\''")}'`);
    }
    return lines.join(" \\\n");
  }, [fullUrl, endpoint.method, body]);

  const embedCode = useMemo(
    () => (endpoint.embed ? endpoint.embed(base) : null),
    [endpoint, base],
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge
            variant={endpoint.method === "GET" ? "secondary" : "default"}
            className="font-mono"
          >
            {endpoint.method}
          </Badge>
          <CardTitle className="text-base font-mono">{endpoint.path}</CardTitle>
          <Badge variant="outline" className="ml-auto text-[10px]">
            auth: {endpoint.auth}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground pt-2">{endpoint.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs">Path</Label>
          <Input
            value={pathOverride}
            onChange={(e) => setPathOverride(e.target.value)}
            className="font-mono text-xs"
          />
        </div>

        {endpoint.method === "GET" && (
          <div className="space-y-2">
            <Label className="text-xs">Query string</Label>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="?key=value"
              className="font-mono text-xs"
            />
          </div>
        )}

        {endpoint.method === "POST" && (
          <div className="space-y-2">
            <Label className="text-xs">Request body (JSON)</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="font-mono text-xs"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={run} disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Play className="size-4 mr-2" />
            )}
            Send request
          </Button>
          <Button size="sm" variant="outline" onClick={() => copy(fullUrl)}>
            <Copy className="size-4 mr-2" /> Copy URL
          </Button>
          <Button size="sm" variant="outline" onClick={() => copy(curl)}>
            <Copy className="size-4 mr-2" /> Copy cURL
          </Button>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">cURL</Label>
          <pre className="text-[11px] bg-muted/40 p-3 rounded-md overflow-auto whitespace-pre">
            {curl}
          </pre>
        </div>

        {resp && (
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-2">
              Response
              <Badge
                variant={resp.status >= 200 && resp.status < 300 ? "default" : "destructive"}
                className="font-mono"
              >
                {resp.status || "ERR"}
              </Badge>
            </Label>
            <pre className="text-[11px] bg-muted/40 p-3 rounded-md overflow-auto whitespace-pre max-h-96">
              {resp.body}
            </pre>
          </div>
        )}

        {embedCode && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-xs">
                WordPress embed (paste into a Custom HTML block)
              </Label>
              <Button size="sm" variant="outline" onClick={() => copy(embedCode)}>
                <Copy className="size-4 mr-2" /> Copy embed code
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Self-contained HTML + JS. Renders UI and calls the API directly —
              no extra setup needed on the WordPress side.
            </p>
            <pre className="text-[11px] bg-muted/40 p-3 rounded-md overflow-auto whitespace-pre max-h-96">
              {embedCode}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ----------------------------- Embed builders ----------------------------- */

function buildTalentsListEmbed(base: string): string {
  return `<!-- Art City — Talents grid -->
<div id="ac-talents" style="font-family:system-ui,sans-serif;max-width:1200px;margin:0 auto;">
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
  var BASE = ${JSON.stringify(base)};
  var grid = document.getElementById('ac-grid');
  function load(){
    var q = encodeURIComponent(document.getElementById('ac-q').value || '');
    var g = encodeURIComponent(document.getElementById('ac-gender').value || '');
    grid.innerHTML = '<p>Loading…</p>';
    fetch(BASE + '/api/public/talents?q=' + q + '&gender=' + g + '&limit=50')
      .then(function(r){ return r.json(); })
      .then(function(res){
        var items = (res && (res.data || res)) || [];
        if(!items.length){ grid.innerHTML = '<p>No talents found.</p>'; return; }
        grid.innerHTML = items.map(function(t){
          var img = t.headshot_url || '';
          var name = t.stage_name || t.full_name || 'Talent';
          return '<a href="' + BASE + '/talents/' + (t.slug||'') + '" target="_blank" style="display:block;text-decoration:none;color:inherit;border:1px solid #eee;border-radius:12px;overflow:hidden;background:#fff;">'
            + (img ? '<img src="' + img + '" alt="' + name + '" style="width:100%;aspect-ratio:3/4;object-fit:cover;display:block;" loading="lazy"/>' : '<div style="aspect-ratio:3/4;background:#f4f4f5;"></div>')
            + '<div style="padding:10px 12px;"><div style="font-weight:600;">' + name + '</div>'
            + '<div style="font-size:12px;color:#666;">' + (t.location||'') + '</div></div></a>';
        }).join('');
      })
      .catch(function(e){ grid.innerHTML = '<p style="color:#c00;">Error: ' + e.message + '</p>'; });
  }
  document.getElementById('ac-go').addEventListener('click', load);
  load();
})();
</script>`;
}

function buildTalentBySlugEmbed(base: string): string {
  return `<!-- Art City — Single talent (set data-slug) -->
<div id="ac-talent" data-slug="example-slug" style="font-family:system-ui,sans-serif;max-width:900px;margin:0 auto;"></div>
<script>
(function(){
  var BASE = ${JSON.stringify(base)};
  var root = document.getElementById('ac-talent');
  var slug = root.getAttribute('data-slug');
  root.innerHTML = '<p>Loading…</p>';
  fetch(BASE + '/api/public/talents/' + encodeURIComponent(slug))
    .then(function(r){ return r.json(); })
    .then(function(res){
      var t = (res && (res.data || res)) || {};
      if(!t || !t.id){ root.innerHTML = '<p>Not found.</p>'; return; }
      var name = t.stage_name || t.full_name || 'Talent';
      var media = (t.media || []).map(function(m){
        return '<img src="' + m.url + '" style="width:100%;border-radius:8px;margin-bottom:8px;" loading="lazy"/>';
      }).join('');
      root.innerHTML =
        '<div style="display:grid;grid-template-columns:1fr 2fr;gap:24px;">'
        + '<div>' + (t.headshot_url ? '<img src="' + t.headshot_url + '" style="width:100%;border-radius:12px;"/>' : '') + '</div>'
        + '<div><h1 style="margin:0 0 8px;">' + name + '</h1>'
        + '<p style="color:#666;margin:0 0 12px;">' + (t.location||'') + ' · ' + (t.nationality||'') + '</p>'
        + '<p>' + (t.bio||'') + '</p>'
        + media + '</div></div>';
    })
    .catch(function(e){ root.innerHTML = '<p style="color:#c00;">Error: ' + e.message + '</p>'; });
})();
</script>`;
}

function buildCastingFormEmbed(base: string): string {
  return `<!-- Art City — Casting request form -->
<form id="ac-casting" style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;display:grid;gap:12px;">
  <h2 style="margin:0;">Submit a Casting Request</h2>
  <input name="production_title" placeholder="Production title *" required style="padding:10px;border:1px solid #ddd;border-radius:8px;"/>
  <input name="production_type" placeholder="Production type (commercial, film…)" style="padding:10px;border:1px solid #ddd;border-radius:8px;"/>
  <textarea name="role_description" placeholder="Role description" rows="3" style="padding:10px;border:1px solid #ddd;border-radius:8px;"></textarea>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
    <input name="shooting_dates" placeholder="Shooting dates" style="padding:10px;border:1px solid #ddd;border-radius:8px;"/>
    <input name="shooting_location" placeholder="Shooting location" style="padding:10px;border:1px solid #ddd;border-radius:8px;"/>
  </div>
  <input name="budget_range" placeholder="Budget range" style="padding:10px;border:1px solid #ddd;border-radius:8px;"/>
  <input name="company_name" placeholder="Company" style="padding:10px;border:1px solid #ddd;border-radius:8px;"/>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
    <input name="contact_person" placeholder="Contact person *" required style="padding:10px;border:1px solid #ddd;border-radius:8px;"/>
    <input name="phone" placeholder="Phone" style="padding:10px;border:1px solid #ddd;border-radius:8px;"/>
  </div>
  <input name="email" type="email" placeholder="Email *" required style="padding:10px;border:1px solid #ddd;border-radius:8px;"/>
  <input name="requested_talent_name" placeholder="Requested talent (optional)" style="padding:10px;border:1px solid #ddd;border-radius:8px;"/>
  <textarea name="message" placeholder="Message" rows="3" style="padding:10px;border:1px solid #ddd;border-radius:8px;"></textarea>
  <button type="submit" style="padding:12px 16px;border:0;background:#111;color:#fff;border-radius:8px;cursor:pointer;">Send request</button>
  <div id="ac-casting-msg" style="font-size:14px;"></div>
</form>
<script>
(function(){
  var BASE = ${JSON.stringify(base)};
  var form = document.getElementById('ac-casting');
  var msg = document.getElementById('ac-casting-msg');
  form.addEventListener('submit', function(e){
    e.preventDefault();
    msg.textContent = 'Sending…'; msg.style.color = '#666';
    var data = {}; new FormData(form).forEach(function(v,k){ if(v) data[k] = v; });
    fetch(BASE + '/api/public/casting-requests', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data)
    }).then(function(r){ return r.json().then(function(j){ return {status:r.status, body:j}; }); })
      .then(function(res){
        if(res.status >= 200 && res.status < 300){
          msg.textContent = 'Thanks! Your request was sent.'; msg.style.color = '#0a0'; form.reset();
        } else { msg.textContent = 'Error: ' + (res.body.error || 'Could not submit'); msg.style.color = '#c00'; }
      })
      .catch(function(err){ msg.textContent = 'Error: ' + err.message; msg.style.color = '#c00'; });
  });
})();
</script>`;
}

function buildApplicationFormEmbed(base: string): string {
  return `<!-- Art City — Talent application form -->
<form id="ac-app" style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;display:grid;gap:12px;">
  <h2 style="margin:0;">Apply as a Talent</h2>
  <input name="full_name" placeholder="Full name *" required style="padding:10px;border:1px solid #ddd;border-radius:8px;"/>
  <input name="stage_name" placeholder="Stage name" style="padding:10px;border:1px solid #ddd;border-radius:8px;"/>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
    <input name="email" type="email" placeholder="Email *" required style="padding:10px;border:1px solid #ddd;border-radius:8px;"/>
    <input name="password" type="password" placeholder="Password (min 8) *" minlength="8" required style="padding:10px;border:1px solid #ddd;border-radius:8px;"/>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
    <select name="gender" style="padding:10px;border:1px solid #ddd;border-radius:8px;">
      <option value="">Gender</option><option>male</option><option>female</option><option>other</option>
    </select>
    <input name="age" type="number" min="0" max="120" placeholder="Age" style="padding:10px;border:1px solid #ddd;border-radius:8px;"/>
    <input name="playing_age" placeholder="Playing age" style="padding:10px;border:1px solid #ddd;border-radius:8px;"/>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
    <input name="location" placeholder="Location" style="padding:10px;border:1px solid #ddd;border-radius:8px;"/>
    <input name="nationality" placeholder="Nationality" style="padding:10px;border:1px solid #ddd;border-radius:8px;"/>
    <input name="native_language" placeholder="Native language" style="padding:10px;border:1px solid #ddd;border-radius:8px;"/>
  </div>
  <textarea name="bio" placeholder="Short bio" rows="3" style="padding:10px;border:1px solid #ddd;border-radius:8px;"></textarea>
  <label style="font-size:14px;display:flex;align-items:center;gap:8px;">
    <input type="checkbox" name="submit_now"/> Submit for review now (otherwise saved as draft)
  </label>
  <button type="submit" style="padding:12px 16px;border:0;background:#111;color:#fff;border-radius:8px;cursor:pointer;">Create profile</button>
  <div id="ac-app-msg" style="font-size:14px;"></div>
</form>
<script>
(function(){
  var BASE = ${JSON.stringify(base)};
  var form = document.getElementById('ac-app');
  var msg = document.getElementById('ac-app-msg');
  form.addEventListener('submit', function(e){
    e.preventDefault();
    msg.textContent = 'Sending…'; msg.style.color = '#666';
    var fd = new FormData(form); var data = {};
    fd.forEach(function(v,k){ if(v) data[k] = v; });
    if(data.age) data.age = Number(data.age);
    data.submit = !!data.submit_now; delete data.submit_now;
    fetch(BASE + '/api/public/applications', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data)
    }).then(function(r){ return r.json().then(function(j){ return {status:r.status, body:j}; }); })
      .then(function(res){
        if(res.status >= 200 && res.status < 300){
          msg.textContent = 'Profile created! Check your email.'; msg.style.color = '#0a0'; form.reset();
        } else { msg.textContent = 'Error: ' + (res.body.error || 'Could not submit'); msg.style.color = '#c00'; }
      })
      .catch(function(err){ msg.textContent = 'Error: ' + err.message; msg.style.color = '#c00'; });
  });
})();
</script>`;
}

function buildLoginFormEmbed(base: string): string {
  return `<!-- Art City — Login form -->
<form id="ac-login" style="font-family:system-ui,sans-serif;max-width:380px;margin:0 auto;display:grid;gap:12px;">
  <h2 style="margin:0;">Sign in</h2>
  <input name="email" type="email" placeholder="Email" required style="padding:10px;border:1px solid #ddd;border-radius:8px;"/>
  <input name="password" type="password" placeholder="Password" required style="padding:10px;border:1px solid #ddd;border-radius:8px;"/>
  <button type="submit" style="padding:12px 16px;border:0;background:#111;color:#fff;border-radius:8px;cursor:pointer;">Sign in</button>
  <div id="ac-login-msg" style="font-size:14px;"></div>
</form>
<script>
(function(){
  var BASE = ${JSON.stringify(base)};
  var form = document.getElementById('ac-login');
  var msg = document.getElementById('ac-login-msg');
  form.addEventListener('submit', function(e){
    e.preventDefault();
    msg.textContent = 'Signing in…'; msg.style.color = '#666';
    var fd = new FormData(form);
    var data = { email: fd.get('email'), password: fd.get('password') };
    fetch(BASE + '/api/public/auth/login', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data)
    }).then(function(r){ return r.json().then(function(j){ return {status:r.status, body:j}; }); })
      .then(function(res){
        if(res.status >= 200 && res.status < 300){
          try { localStorage.setItem('ac_session', JSON.stringify(res.body.data.session)); } catch(_){}
          msg.textContent = 'Signed in.'; msg.style.color = '#0a0';
        } else { msg.textContent = 'Error: ' + (res.body.error || 'Invalid credentials'); msg.style.color = '#c00'; }
      })
      .catch(function(err){ msg.textContent = 'Error: ' + err.message; msg.style.color = '#c00'; });
  });
})();
</script>`;
}