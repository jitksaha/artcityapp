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
      </CardContent>
    </Card>
  );
}