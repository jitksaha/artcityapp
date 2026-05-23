import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  listApplications,
  reviewApplication,
  toggleFlag,
  listCastingRequests,
  updateCastingRequest,
  getApplicationDetail,
  addAdminNote,
  deleteAdminNote,
  importDemoTalents,
  getAppSettings,
  updateAppSettings,
  getAdminAnalytics,
  listUsersWithRoles,
  setUserRole,
} from "@/lib/admin.functions";
import { DEMO_TALENTS_SAMPLE_CSV, DEMO_TALENTS_CSV_HEADERS } from "@/lib/demo-talents-csv";
import { Download, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  pushTalentsToWordPress,
  checkWordPressConnection,
  getWordPressSettings,
  saveWordPressSettings,
} from "@/lib/wordpress.functions";
import {
  getEmbedSecurity,
  updateEmbedSecurity,
  rotateEmbedSecret,
  mintEmbedToken,
} from "@/lib/embed-security.functions";
import { Copy, ExternalLink, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/superadmin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Super Admin — Art City" }] }),
});

function AdminPage() {
  const { isStaff, isAdmin, loading } = useAuth();
  if (loading) return <AdminSkeleton />;
  if (!isStaff) return <Navigate to="/dashboard" replace />;
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Super Admin</h1>
      {isAdmin && <ImportDemoTalentsCard />}
      <Tabs defaultValue="applications">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="casting">Casting Requests</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          {isAdmin && <TabsTrigger value="users">Users & Roles</TabsTrigger>}
          {isAdmin && <TabsTrigger value="settings">Settings</TabsTrigger>}
        </TabsList>
        <TabsContent value="overview" className="mt-4"><OverviewTab /></TabsContent>
        <TabsContent value="applications" className="mt-4"><ApplicationsTab /></TabsContent>
        <TabsContent value="casting" className="mt-4"><CastingTab /></TabsContent>
        <TabsContent value="integrations" className="mt-4"><IntegrationsTab isAdmin={isAdmin} /></TabsContent>
        {isAdmin && (
          <TabsContent value="users" className="mt-4"><UsersTab /></TabsContent>
        )}
        {isAdmin && (
          <TabsContent value="settings" className="mt-4"><SettingsTab /></TabsContent>
        )}
      </Tabs>
    </main>
  );
}

function CopyBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      <pre className="bg-muted text-foreground/90 p-3 rounded-md text-xs overflow-x-auto border">
        <code>{code}</code>
      </pre>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="absolute top-2 right-2 h-7 px-2"
        onClick={() => {
          navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      </Button>
    </div>
  );
}

function IntegrationsTab({ isAdmin }: { isAdmin: boolean }) {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://acbe.lovable.app";

  const scriptDirectory = `<!-- Talent Directory (live, auto-syncs) -->
<script async src="${origin}/api/public/embed.js"
  data-widget="directory"
  data-columns="4"
  data-limit="12"
  data-featured="true"
  data-refresh="60"></script>`;

  const scriptDirectoryFull = `<!-- Filterable directory -->
<script async src="${origin}/api/public/embed.js"
  data-widget="directory"
  data-title="Our Talent"
  data-columns="3"
  data-category="actor"
  data-location="Paris"
  data-language="French"
  data-vip="false"
  data-featured="false"
  data-limit="24"
  data-filters="true"
  data-refresh="120"></script>`;

  const scriptSignup = `<!-- Talent Signup Form -->
<script async src="${origin}/api/public/embed.js"
  data-widget="signup"></script>`;

  const scriptCasting = `<!-- Casting Request Form -->
<script async src="${origin}/api/public/embed.js"
  data-widget="casting"></script>`;

  const iframeDirectory = `<iframe
  src="${origin}/embed/directory?columns=4&limit=12&featured=true"
  style="width:100%;min-height:800px;border:0"
  loading="lazy"
  title="Talent Directory"></iframe>`;

  const wpShortcode = `[html]
<script async src="${origin}/api/public/embed.js"
  data-widget="directory" data-columns="4" data-limit="12"></script>
[/html]`;

  const apiExamples = `# List approved talents (JSON)
curl "${origin}/api/public/talents?category=actor&location=Paris&limit=20"

# Submit a casting request
curl -X POST "${origin}/api/public/casting-request" \\
  -H "Content-Type: application/json" \\
  -d '{"production_title":"My Film","contact_person":"Jane","email":"jane@x.com"}'

# Talent signup
curl -X POST "${origin}/api/public/signup" \\
  -H "Content-Type: application/json" \\
  -d '{"full_name":"John","email":"john@x.com","password":"secret123"}'`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Embed on any website</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Paste these snippets into any HTML page, WordPress Custom HTML block,
            Webflow Embed, Squarespace Code block, Shopify section, etc. The
            content syncs <strong>live</strong> with your platform via the public API.
          </p>

          <div className="space-y-2">
            <Label className="text-base font-semibold">1. Directory grid (recommended)</Label>
            <p className="text-xs text-muted-foreground">Auto-refreshes every 60s. Drop on a homepage or "Our Talent" page.</p>
            <CopyBlock code={scriptDirectory} />
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold">2. Directory with filters (advanced)</Label>
            <p className="text-xs text-muted-foreground">
              Available data-attributes: <code className="text-xs">data-widget</code>,
              <code className="text-xs"> data-category</code>,
              <code className="text-xs"> data-location</code>,
              <code className="text-xs"> data-language</code>,
              <code className="text-xs"> data-vip</code>,
              <code className="text-xs"> data-featured</code>,
              <code className="text-xs"> data-limit</code>,
              <code className="text-xs"> data-columns</code>,
              <code className="text-xs"> data-title</code>,
              <code className="text-xs"> data-filters</code> (true/false),
              <code className="text-xs"> data-refresh</code> (seconds),
              <code className="text-xs"> data-link-base</code>.
            </p>
            <CopyBlock code={scriptDirectoryFull} />
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold">3. Talent signup form</Label>
            <CopyBlock code={scriptSignup} />
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold">4. Casting request form</Label>
            <CopyBlock code={scriptCasting} />
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold">5. iframe (for themes that strip JS)</Label>
            <p className="text-xs text-muted-foreground">
              Use this if your CMS blocks third-party scripts. Same filter params via query string.
            </p>
            <CopyBlock code={iframeDirectory} />
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold">6. WordPress.com shortcode</Label>
            <p className="text-xs text-muted-foreground">
              Paste inside a Custom HTML block, or wrap in <code>[html]</code> if your theme requires it.
            </p>
            <CopyBlock code={wpShortcode} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Public REST API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            CORS-enabled. No auth required for public reads. Use these to build your own integrations.
          </p>
          <CopyBlock code={apiExamples} />
          <a
            href={`${origin}/api/public/talents?limit=3`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Open live JSON sample <ExternalLink className="h-3 w-3" />
          </a>
        </CardContent>
      </Card>

      {isAdmin && <WordPressPushCard origin={origin} />}
      {isAdmin && <EmbedSecurityCard origin={origin} />}
    </div>
  );
}

function EmbedSecurityCard({ origin }: { origin: string }) {
  const get = useServerFn(getEmbedSecurity);
  const save = useServerFn(updateEmbedSecurity);
  const rotate = useServerFn(rotateEmbedSecret);
  const mint = useServerFn(mintEmbedToken);
  const { data: settings, refetch } = useQuery({
    queryKey: ["embed-security"],
    queryFn: () => get(),
  });

  const [requireToken, setRequireToken] = useState(false);
  const [originsText, setOriginsText] = useState("");
  const [ttlHours, setTtlHours] = useState(24);
  const [saving, setSaving] = useState(false);
  const [tokenOrigin, setTokenOrigin] = useState("");
  const [mintedToken, setMintedToken] = useState<string | null>(null);
  const [minting, setMinting] = useState(false);

  useEffect(() => {
    if (settings) {
      setRequireToken(!!settings.require_token);
      setOriginsText((settings.allowed_origins ?? []).join("\n"));
      setTtlHours(Math.max(1, Math.round((settings.token_ttl_seconds ?? 86400) / 3600)));
    }
  }, [settings]);

  const parsedOrigins = originsText
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Embed security
          {requireToken ? (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">Token required</Badge>
          ) : (
            <Badge variant="outline">Open</Badge>
          )}
          {parsedOrigins.length > 0 && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-900">
              {parsedOrigins.length} allowed origin{parsedOrigins.length === 1 ? "" : "s"}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Lock down <code>/api/public/talents</code>, <code>/api/public/signup</code>,{" "}
          <code>/api/public/casting-request</code> and the embed widget so only your
          approved websites can call them. Use an origin allowlist, a signed token,
          or both.
        </p>

        <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/40 px-3 py-2">
          <div className="space-y-0.5">
            <Label htmlFor="emb-tok" className="text-sm font-medium">Require signed embed token</Label>
            <p className="text-xs text-muted-foreground">
              When on, every public embed request must include a valid <code>token</code>{" "}
              query param or <code>X-Embed-Token</code> header you mint below.
            </p>
          </div>
          <Switch id="emb-tok" checked={requireToken} onCheckedChange={setRequireToken} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="emb-origins" className="text-sm">Allowed origins</Label>
          <Textarea
            id="emb-origins"
            rows={4}
            placeholder={"https://example.com\nhttps://www.example.com"}
            value={originsText}
            onChange={(e) => setOriginsText(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            One per line (scheme + host). Leave empty to allow any origin.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <Label htmlFor="emb-ttl" className="text-xs">Token lifetime (hours)</Label>
            <Input
              id="emb-ttl"
              type="number"
              min={1}
              max={24 * 365}
              value={ttlHours}
              onChange={(e) => setTtlHours(parseInt(e.target.value || "1", 10))}
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs">Signing secret</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded bg-muted px-2 py-2 text-xs">
                {settings?.signing_secret_masked || "—"}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (!confirm("Rotate signing secret? All previously issued tokens will stop working.")) return;
                  try {
                    await rotate();
                    toast.success("Signing secret rotated");
                    refetch();
                  } catch (e: any) {
                    toast.error(e?.message ?? "Rotate failed");
                  }
                }}
              >
                Rotate
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await save({
                  data: {
                    require_token: requireToken,
                    allowed_origins: parsedOrigins,
                    token_ttl_seconds: Math.max(60, ttlHours * 3600),
                  },
                });
                toast.success("Embed security updated");
                refetch();
              } catch (e: any) {
                toast.error(e?.message ?? "Save failed");
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save settings
          </Button>
        </div>

        <div className="space-y-2 rounded-md border bg-muted/30 p-3">
          <Label className="text-sm font-semibold">Mint an embed token</Label>
          <p className="text-xs text-muted-foreground">
            Bind a token to one origin (recommended) so it can only be used from that
            website. Use <code>*</code> for any origin.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              className="flex-1 min-w-[220px]"
              placeholder="https://example.com"
              value={tokenOrigin}
              onChange={(e) => setTokenOrigin(e.target.value)}
            />
            <Button
              variant="secondary"
              disabled={minting || !tokenOrigin}
              onClick={async () => {
                setMinting(true);
                setMintedToken(null);
                try {
                  const r = await mint({
                    data: { origin: tokenOrigin, ttl_seconds: Math.max(60, ttlHours * 3600) },
                  });
                  setMintedToken(r.token);
                } catch (e: any) {
                  toast.error(e?.message ?? "Mint failed");
                } finally {
                  setMinting(false);
                }
              }}
            >
              {minting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Generate token
            </Button>
          </div>
          {mintedToken && (
            <div className="space-y-2">
              <div>
                <Label className="text-xs">Token</Label>
                <CopyBlock code={mintedToken} />
              </div>
              <div>
                <Label className="text-xs">Snippet (script tag)</Label>
                <CopyBlock
                  code={`<script async src="${origin}/api/public/embed.js"\n  data-widget="directory"\n  data-token="${mintedToken}"\n  data-columns="4" data-limit="12"></script>`}
                />
              </div>
              <div>
                <Label className="text-xs">Snippet (iframe)</Label>
                <CopyBlock
                  code={`<iframe src="${origin}/embed/directory?columns=4&limit=12&token=${encodeURIComponent(mintedToken)}" style="width:100%;min-height:800px;border:0" loading="lazy"></iframe>`}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function WordPressPushCard({ origin: _origin }: { origin: string }) {
  const check = useServerFn(checkWordPressConnection);
  const push = useServerFn(pushTalentsToWordPress);
  const getSettings = useServerFn(getWordPressSettings);
  const saveSettings = useServerFn(saveWordPressSettings);
  const { data: status, refetch } = useQuery({
    queryKey: ["wp-connection"],
    queryFn: () => check(),
  });
  const { data: settings, refetch: refetchSettings } = useQuery({
    queryKey: ["wp-settings"],
    queryFn: () => getSettings(),
  });
  const [siteId, setSiteId] = useState("");
  const [postStatus, setPostStatus] = useState<"publish" | "draft">("publish");
  const [autoSync, setAutoSync] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [result, setResult] = useState<{ pushed: number; updated: number; failed: number; skipped: number } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (settings) {
      setSiteId(settings.site_id ?? "");
      setPostStatus(settings.default_status ?? "publish");
      setAutoSync(!!settings.auto_sync);
    }
  }, [settings]);

  const webhookUrl = `${_origin}/api/public/hooks/wordpress-sync`;
  const anonKey =
    (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ??
    "YOUR_SUPABASE_ANON_KEY";
  const curlSnippet = `curl -X POST "${webhookUrl}" \\\n  -H "Content-Type: application/json" \\\n  -H "apikey: ${anonKey}" \\\n  -d '{"onlyUnsynced": true}'`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          WordPress.com sync
          {status?.connected ? (
            <Badge variant="secondary" className="bg-green-100 text-green-800">Connected</Badge>
          ) : (
            <Badge variant="outline">Not connected</Badge>
          )}
          {autoSync && status?.connected && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">Auto-sync on</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!status?.connected ? (
          <p className="text-sm text-muted-foreground">
            Ask Lovable to <em>"connect WordPress.com"</em> in chat — the connector picker will appear.
            After connecting, refresh this tab.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Mirrors your approved & public roster to WordPress.com. Posts are created the first time
            and updated on subsequent syncs (tracked by WordPress post ID per talent).
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="sm:col-span-2">
            <Label htmlFor="wp-site" className="text-xs">Site ID or domain</Label>
            <Input
              id="wp-site"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              placeholder="example.wordpress.com"
              disabled={!status?.connected}
            />
          </div>
          <div>
            <Label htmlFor="wp-status" className="text-xs">Default post status</Label>
            <select
              id="wp-status"
              className="w-full h-10 rounded-md border px-3 text-sm bg-background"
              value={postStatus}
              onChange={(e) => setPostStatus(e.target.value as "publish" | "draft")}
              disabled={!status?.connected}
            >
              <option value="publish">Publish</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/40 px-3 py-2">
          <div className="space-y-0.5">
            <Label htmlFor="wp-auto" className="text-sm font-medium">Auto-sync on approval/publish</Label>
            <p className="text-xs text-muted-foreground">
              When an admin approves or publishes a talent, push it to WordPress.com immediately.
            </p>
          </div>
          <Switch
            id="wp-auto"
            checked={autoSync}
            onCheckedChange={setAutoSync}
            disabled={!status?.connected}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            disabled={savingSettings || !status?.connected}
            onClick={async () => {
              setSavingSettings(true);
              try {
                await saveSettings({
                  data: { site_id: siteId, auto_sync: autoSync, default_status: postStatus },
                });
                toast.success("Settings saved");
                refetchSettings();
              } catch (e: any) {
                toast.error(e?.message ?? "Save failed");
              } finally {
                setSavingSettings(false);
              }
            }}
          >
            {savingSettings ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save settings
          </Button>
          <Button
            disabled={!status?.connected || !siteId || pushing}
            onClick={async () => {
              setPushing(true);
              setResult(null);
              try {
                const r = await push({
                  data: { siteId, status: postStatus, onlyUnsynced: true },
                });
                setResult({ pushed: r.pushed, updated: r.updated, failed: r.failed, skipped: r.skipped });
                toast.success(
                  `Synced ${r.pushed + r.updated} talent(s)${r.failed ? `, ${r.failed} failed` : ""}`,
                );
                refetchSettings();
              } catch (e: any) {
                toast.error(e?.message ?? "Push failed");
              } finally {
                setPushing(false);
              }
            }}
          >
            {pushing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Run sync now
          </Button>
          <Button variant="ghost" onClick={() => refetch()}>Re-check connection</Button>
        </div>
        {result && (
          <p className="text-sm">
            ✅ {result.pushed} new · 🔄 {result.updated} updated · ⏭️ {result.skipped} unchanged
            {result.failed ? ` · ❌ ${result.failed} failed` : ""}
          </p>
        )}
        {settings?.last_run_at && (
          <p className="text-xs text-muted-foreground">
            Last run: {new Date(settings.last_run_at).toLocaleString()}
            {settings.last_run_summary
              ? ` — ${(settings.last_run_summary as any).pushed ?? 0} new, ${(settings.last_run_summary as any).updated ?? 0} updated, ${(settings.last_run_summary as any).failed ?? 0} failed`
              : ""}
          </p>
        )}

        <div className="space-y-2 rounded-md border bg-muted/30 p-3">
          <Label className="text-sm font-semibold">Webhook / cron endpoint</Label>
          <p className="text-xs text-muted-foreground">
            Call this URL with the <code className="rounded bg-muted px-1">apikey</code> header to trigger a sync
            from anywhere — external automations, GitHub Actions, or a pg_cron schedule.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-background px-2 py-1 text-xs">{webhookUrl}</code>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(webhookUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Show curl example
            </summary>
            <pre className="mt-2 overflow-x-auto rounded bg-background p-2 text-xs">{curlSnippet}</pre>
            <p className="mt-2 text-muted-foreground">
              To schedule it via Supabase pg_cron (e.g. every 15 minutes), run a SQL snippet using
              <code className="mx-1 rounded bg-muted px-1">net.http_post</code> targeting this URL with the same
              <code className="mx-1 rounded bg-muted px-1">apikey</code> header.
            </p>
          </details>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminSkeleton() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-24" />
      </div>
      <ListSkeleton rows={6} />
    </main>
  );
}

function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-md border border-border p-4 flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

function SettingsTab() {
  const getFn = useServerFn(getAppSettings);
  const updFn = useServerFn(updateAppSettings);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["app-settings"],
    queryFn: () => getFn(),
  });
  const [email, setEmail] = useState("");
  useEffect(() => {
    if (data?.casting_notification_email) setEmail(data.casting_notification_email);
  }, [data?.casting_notification_email]);

  const mut = useMutation({
    mutationFn: () =>
      updFn({
        data: { casting_notification_email: email.trim() ? email.trim() : null },
      }),
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["app-settings"] });
    },
    onError: (e: any) => toast.error(e?.message || "Save failed"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Site settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 max-w-md">
          <Label htmlFor="cne">Casting notification email</Label>
          <Input
            id="cne"
            type="email"
            placeholder="casting@artcity.example"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            New applications and resubmissions will be emailed to this address
            once email sending is enabled.
          </p>
        </div>
        <Button
          size="sm"
          disabled={mut.isPending || isLoading}
          onClick={() => mut.mutate()}
        >
          {mut.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
          Save settings
        </Button>
      </CardContent>
    </Card>
  );
}

function ImportDemoTalentsCard() {
  const importFn = useServerFn(importDemoTalents);
  const qc = useQueryClient();
  const [csv, setCsv] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [lastResult, setLastResult] = useState<{
    created: number;
    skipped: number;
    failed: number;
    results: Array<{ email: string; ok: boolean; error?: string }>;
  } | null>(null);

  const mut = useMutation({
    mutationFn: () => importFn({ data: csv.trim() ? { csv } : {} }),
    onSuccess: (res) => {
      setLastResult(res);
      toast.success(
        `Imported ${res.created} talent${res.created === 1 ? "" : "s"}` +
          (res.skipped ? ` · ${res.skipped} skipped` : "") +
          (res.failed ? ` · ${res.failed} failed` : ""),
      );
      qc.invalidateQueries({ queryKey: ["admin-applications"] });
    },
    onError: (e: any) => toast.error(e?.message || "Import failed"),
  });

  const downloadSample = () => {
    const blob = new Blob([DEMO_TALENTS_SAMPLE_CSV], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "demo-talents-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (file: File) => {
    const text = await file.text();
    setCsv(text);
    setOpen(true);
  };

  return (
    <Card className="mb-6 border-dashed">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="text-base">Import demo talents</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Admin only · seeds auth users + published profiles from a CSV file.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={downloadSample}>
            <Download className="size-4 mr-2" /> Sample CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCsv("");
              setOpen(true);
            }}
          >
            <Upload className="size-4 mr-2" /> Paste / upload CSV
          </Button>
          <Button
            size="sm"
            disabled={mut.isPending}
            onClick={() => mut.mutate()}
          >
            {mut.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
            Seed 3 demo talents
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Expected columns:</span>{" "}
          <code className="text-[11px]">{DEMO_TALENTS_CSV_HEADERS.join(", ")}</code>.
          Categories use <code>;</code> separator (allowed: actor, actress, model,
          performer, voice_talent). Existing emails are skipped.
        </div>
        {lastResult && (
          <div className="rounded-md border bg-muted/40 p-3 text-xs space-y-1 max-h-48 overflow-auto">
            <p className="font-medium">
              Result: {lastResult.created} created · {lastResult.skipped} skipped ·{" "}
              {lastResult.failed} failed
            </p>
            <ul className="space-y-0.5">
              {lastResult.results.map((r, i) => (
                <li key={i} className={r.ok ? "" : "text-destructive"}>
                  {r.ok ? (r.error ? "↺" : "✓") : "✕"} {r.email}
                  {r.error ? ` — ${r.error}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import talents from CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
            <Textarea
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              rows={10}
              placeholder={DEMO_TALENTS_SAMPLE_CSV}
              className="font-mono text-xs"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setOpen(false);
                  mut.mutate();
                }}
                disabled={mut.isPending || csv.trim().length === 0}
              >
                Import
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function ApplicationsTab() {
  const fn = useServerFn(listApplications);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-applications", statusFilter],
    queryFn: () => fn({ data: statusFilter ? { status: statusFilter } : undefined }),
  });
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {["all", "submitted", "under_review", "needs_revision", "approved", "published", "rejected"].map((s) => (
          <Button
            key={s}
            variant={(statusFilter ?? "all") === s ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(s === "all" ? undefined : s)}
          >
            {s}
          </Button>
        ))}
      </div>
      {isLoading && <ListSkeleton rows={5} />}
      <div className="grid gap-3">
        {(data ?? []).map((t: any) => (
          <Card key={t.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium">{t.stage_name || t.full_name || "Untitled"}</p>
                <p className="text-xs text-muted-foreground">{t.gender ?? "—"} · {t.location ?? "—"}</p>
              </div>
              <div className="flex items-center gap-2">
                {t.vip && <Badge>VIP</Badge>}
                {t.featured && <Badge variant="secondary">Featured</Badge>}
                <Badge variant="outline">{t.status}</Badge>
                <Button size="sm" variant="outline" onClick={() => setOpenId(t.id)}>Review</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {openId && <ReviewDialog id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function ReviewDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const detailFn = useServerFn(getApplicationDetail);
  const reviewFn = useServerFn(reviewApplication);
  const flagFn = useServerFn(toggleFlag);
  const addNoteFn = useServerFn(addAdminNote);
  const deleteNoteFn = useServerFn(deleteAdminNote);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-app", id], queryFn: () => detailFn({ data: { id } }) });
  const [feedback, setFeedback] = useState("");
  const [noteText, setNoteText] = useState("");
  const [noteVisible, setNoteVisible] = useState(false);
  const [orderInput, setOrderInput] = useState<string>("");

  const mut = useMutation({
    mutationFn: (action: any) => reviewFn({ data: { id, action, feedback: feedback || undefined } }),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin-applications"] });
      qc.invalidateQueries({ queryKey: ["admin-app", id] });
      setFeedback("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const flagMut = useMutation({
    mutationFn: (vars: { flag: "vip" | "featured" | "visible_publicly"; value: boolean }) =>
      flagFn({ data: { id, ...vars } }),
    onSuccess: () => {
      toast.success("Flag updated");
      qc.invalidateQueries({ queryKey: ["admin-applications"] });
      qc.invalidateQueries({ queryKey: ["admin-app", id] });
    },
  });

  const orderMut = useMutation({
    mutationFn: (order: number) =>
      flagFn({ data: { id, flag: "featured", value: true, order } }),
    onSuccess: () => {
      toast.success("Featured order saved");
      qc.invalidateQueries({ queryKey: ["admin-applications"] });
      qc.invalidateQueries({ queryKey: ["admin-app", id] });
    },
  });

  const noteMut = useMutation({
    mutationFn: () =>
      addNoteFn({ data: { talent_id: id, note: noteText, visible_to_applicant: noteVisible } }),
    onSuccess: () => {
      toast.success("Note added");
      setNoteText("");
      qc.invalidateQueries({ queryKey: ["admin-app", id] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const noteDelMut = useMutation({
    mutationFn: (noteId: string) => deleteNoteFn({ data: { id: noteId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-app", id] }),
  });

  const t = data?.talent;

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{t?.stage_name || t?.full_name || "Application"}</DialogTitle></DialogHeader>
        {!data && (
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}
        {t && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Status" value={t.status} />
              <Field label="Gender" value={t.gender} />
              <Field label="Age" value={t.age} />
              <Field label="Location" value={t.location} />
              <Field label="Nationality" value={t.nationality} />
              <Field label="Native Language" value={t.native_language} />
            </div>
            {t.bio && <p className="text-sm">{t.bio}</p>}

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant={t.vip ? "default" : "outline"}
                onClick={() => flagMut.mutate({ flag: "vip", value: !t.vip })}>VIP</Button>
              <Button size="sm" variant={t.featured ? "default" : "outline"}
                onClick={() => flagMut.mutate({ flag: "featured", value: !t.featured })}>Featured</Button>
              <Button size="sm" variant={t.visible_publicly ? "default" : "outline"}
                onClick={() => flagMut.mutate({ flag: "visible_publicly", value: !t.visible_publicly })}>
                Visible
              </Button>
              {t.featured && (
                <div className="ml-2 flex items-center gap-1">
                  <Input
                    type="number"
                    placeholder="order"
                    className="h-8 w-20"
                    defaultValue={t.featured_order ?? ""}
                    onChange={(e) => setOrderInput(e.target.value)}
                  />
                  <Button size="sm" variant="outline" onClick={() => {
                    const n = parseInt(orderInput || String(t.featured_order ?? 0), 10);
                    if (!Number.isNaN(n)) orderMut.mutate(n);
                  }}>Save order</Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Textarea
                placeholder="Admin feedback (visible to applicant)…"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => mut.mutate("under_review")}>Mark Under Review</Button>
                <Button size="sm" variant="outline" onClick={() => mut.mutate("needs_revision")}>Needs Revision</Button>
                <Button size="sm" variant="default" onClick={() => mut.mutate("approve")}>Approve</Button>
                <Button size="sm" onClick={() => mut.mutate("publish")}>Publish</Button>
                <Button size="sm" variant="outline" onClick={() => mut.mutate("unpublish")}>Unpublish</Button>
                <Button size="sm" variant="destructive" onClick={() => mut.mutate("reject")}>Reject</Button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-2">Media ({data.media.length})</h3>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {data.media.map((m: any) => {
                  const isImg = m.mime_type?.startsWith("image/");
                  const url = m.bucket === "talent-media"
                    ? supabase.storage.from("talent-media").getPublicUrl(m.path).data.publicUrl
                    : null;
                  return (
                    <div key={m.id} className="overflow-hidden rounded-md border border-border bg-muted">
                      {isImg && url ? (
                        <img src={url} alt={m.kind} className="aspect-square w-full object-cover" />
                      ) : (
                        <div className="flex aspect-square items-center justify-center p-2 text-center text-[10px] text-muted-foreground">
                          {m.kind}
                        </div>
                      )}
                      <p className="truncate px-2 py-1 text-[10px] capitalize">{m.kind.replace(/_/g, " ")}</p>
                    </div>
                  );
                })}
                {data.media.length === 0 && (
                  <p className="col-span-full text-xs text-muted-foreground">No media uploaded.</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Admin Notes ({data.notes.length})</h3>
              <div className="space-y-2">
                <Textarea
                  placeholder="Internal note or message…"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Switch id="note-vis" checked={noteVisible} onCheckedChange={setNoteVisible} />
                    <Label htmlFor="note-vis" className="text-xs">Visible to applicant</Label>
                  </div>
                  <Button size="sm" disabled={!noteText.trim() || noteMut.isPending} onClick={() => noteMut.mutate()}>
                    Add note
                  </Button>
                </div>
              </div>
              <ul className="space-y-2">
                {data.notes.map((n: any) => (
                  <li key={n.id} className="rounded-md border border-border p-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <p className="whitespace-pre-wrap">{n.note}</p>
                      <button
                        type="button"
                        onClick={() => noteDelMut.mutate(n.id)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Delete note"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{new Date(n.created_at).toLocaleString()}</span>
                      {n.visible_to_applicant ? <Badge variant="secondary" className="text-[9px]">Shared</Badge> : <span>Internal</span>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-2">Status History</h3>
              <ul className="text-xs space-y-1">
                {data.logs.map((l: any) => (
                  <li key={l.id} className="flex justify-between border-b border-border py-1 text-muted-foreground">
                    <span>{l.from_status ?? "—"} → {l.to_status}</span>
                    <span>{new Date(l.created_at).toLocaleString()}</span>
                  </li>
                ))}
                {data.logs.length === 0 && <li className="text-muted-foreground">No status changes yet.</li>}
              </ul>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p>{value ?? "—"}</p>
    </div>
  );
}

function CastingTab() {
  const fn = useServerFn(listCastingRequests);
  const updateFn = useServerFn(updateCastingRequest);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-casting"], queryFn: () => fn() });

  const mut = useMutation({
    mutationFn: (vars: { id: string; status: any }) => updateFn({ data: vars }),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-casting"] }); },
  });

  if (isLoading) return <ListSkeleton rows={4} />;
  return (
    <div className="space-y-3">
      {(data ?? []).map((r: any) => (
        <Card key={r.id}>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>{r.production_title}</span>
              <Badge variant="outline">{r.status}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Contact:</span> {r.contact_person} · {r.email} {r.phone && `· ${r.phone}`}</p>
            {r.company_name && <p><span className="text-muted-foreground">Company:</span> {r.company_name}</p>}
            {r.requested_talent_name && <p><span className="text-muted-foreground">Requested talent:</span> {r.requested_talent_name}</p>}
            {r.role_description && <p className="whitespace-pre-wrap">{r.role_description}</p>}
            {r.message && <p className="whitespace-pre-wrap text-muted-foreground">{r.message}</p>}
            <div className="flex gap-2 pt-2">
              {["new", "reviewed", "contacted", "closed"].map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={r.status === s ? "default" : "outline"}
                  onClick={() => mut.mutate({ id: r.id, status: s })}
                >
                  {s}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
      {(data ?? []).length === 0 && <p className="text-muted-foreground">No casting requests yet.</p>}
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function OverviewTab() {
  const fn = useServerFn(getAdminAnalytics);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => fn(),
  });

  if (isLoading || !data) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const t = data.totals;
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total talents" value={t.talents} hint={`+${t.newTalents30d} in 30 days`} />
        <StatCard label="Published" value={t.published} />
        <StatCard label="Pending review" value={t.pendingReview} />
        <StatCard label="VIP / Featured" value={`${t.vip} / ${t.featured}`} />
        <StatCard label="Casting requests" value={t.casting} hint={`+${t.newCasting30d} in 30 days`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Talents by status</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(data.byStatus).length === 0 && (
              <p className="text-xs text-muted-foreground">No talents yet.</p>
            )}
            {Object.entries(data.byStatus).map(([s, n]) => (
              <div key={s} className="flex items-center justify-between text-sm">
                <span className="capitalize">{s.replace(/_/g, " ")}</span>
                <Badge variant="outline">{n}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Casting by status</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(data.castingByStatus).length === 0 && (
              <p className="text-xs text-muted-foreground">No casting requests yet.</p>
            )}
            {Object.entries(data.castingByStatus).map(([s, n]) => (
              <div key={s} className="flex items-center justify-between text-sm">
                <span className="capitalize">{s}</span>
                <Badge variant="outline">{n}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Recent talents</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.recentTalents.length === 0 && (
              <p className="text-xs text-muted-foreground">Nothing yet.</p>
            )}
            {data.recentTalents.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span className="truncate">{r.stage_name || r.full_name || "Untitled"}</span>
                <Badge variant="outline">{r.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Recent casting requests</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.recentCasting.length === 0 && (
              <p className="text-xs text-muted-foreground">Nothing yet.</p>
            )}
            {data.recentCasting.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span className="truncate">{r.production_title}</span>
                <Badge variant="outline">{r.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function UsersTab() {
  const { user } = useAuth();
  const listFn = useServerFn(listUsersWithRoles);
  const setFn = useServerFn(setUserRole);
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", query],
    queryFn: () => listFn({ data: { query } }),
  });

  const mut = useMutation({
    mutationFn: (vars: { user_id: string; role: "admin" | "casting_manager" | "applicant"; grant: boolean }) =>
      setFn({ data: vars }),
    onSuccess: () => {
      toast.success("Roles updated");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed"),
  });

  const ROLES: Array<"admin" | "casting_manager" | "applicant"> = [
    "admin",
    "casting_manager",
    "applicant",
  ];

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by email or name…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm"
      />
      {isLoading && <ListSkeleton rows={5} />}
      <div className="grid gap-2">
        {(data ?? []).map((u: any) => (
          <Card key={u.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{u.email}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {u.full_name || "—"} · joined {new Date(u.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ROLES.map((role) => {
                  const active = u.roles.includes(role);
                  const disableSelfAdmin =
                    role === "admin" && active && u.id === user?.id;
                  return (
                    <Button
                      key={role}
                      size="sm"
                      variant={active ? "default" : "outline"}
                      disabled={mut.isPending || disableSelfAdmin}
                      onClick={() =>
                        mut.mutate({ user_id: u.id, role, grant: !active })
                      }
                      title={disableSelfAdmin ? "Cannot remove your own admin role" : undefined}
                    >
                      {active ? "✓ " : "+ "}
                      {role.replace("_", " ")}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
        {!isLoading && (data ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No users found.</p>
        )}
      </div>
    </div>
  );
}