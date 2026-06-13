import { useEffect, useState } from "react";
import { useFieldArray, useFormContext, Control } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle2, AlertCircle, FileText, Loader2, Music, Plus, RotateCw, Trash2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FieldLabel, SectionTitle } from "./FieldLabel";
import type { RegisterFormValues } from "./schema";
import { useUploads } from "./upload-context";
import type { UploadKind } from "@/lib/upload-constraints";
import { validateUpload, UPLOAD_RULES } from "@/lib/upload-constraints";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type FC = Control<RegisterFormValues>;

function TextField({
  name, en, ku, required, type = "text", placeholder,
}: {
  name: any; en: string; ku?: string; required?: boolean; type?: string; placeholder?: string;
}) {
  const { control } = useFormContext<RegisterFormValues>();
  const ph = placeholder ?? `Enter ${en.toLowerCase()}`;
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FieldLabel en={en} ku={ku} required={required} />
          <FormControl>
            <Input type={type} placeholder={ph} {...field} value={field.value ?? ""} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function TextAreaField({ name, en, ku, placeholder }: any) {
  const { control } = useFormContext<RegisterFormValues>();
  const ph = placeholder ?? `Enter ${String(en).toLowerCase()}`;
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FieldLabel en={en} ku={ku} />
          <FormControl>
            <Textarea rows={3} placeholder={ph} {...field} value={field.value ?? ""} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function SelectField({
  name, en, ku, options, required, placeholder = "Select…",
}: {
  name: any; en: string; ku?: string; required?: boolean; placeholder?: string;
  options: { value: string; label: string }[];
}) {
  const { control } = useFormContext<RegisterFormValues>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FieldLabel en={en} ku={ku} required={required} />
          <FormControl>
            <select
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
              className={cn(
                "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm",
                "focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                !field.value && "text-muted-foreground",
              )}
            >
              <option value="" disabled>{placeholder}</option>
              {options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function CheckboxGroupField({
  name, en, ku, options,
}: {
  name: any; en: string; ku?: string;
  options: { value: string; label: string }[];
}) {
  const { control } = useFormContext<RegisterFormValues>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FieldLabel en={en} ku={ku} />
          <div className="flex flex-wrap gap-3">
            {options.map((o) => {
              const checked = Array.isArray(field.value) && field.value.includes(o.value);
              return (
                <label
                  key={o.value}
                  className={cn(
                    "flex items-center gap-2 rounded-md border border-input px-3 py-2 cursor-pointer transition-colors",
                    checked && "border-primary bg-accent",
                  )}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(c) => {
                      const arr = Array.isArray(field.value) ? [...field.value] : [];
                      if (c) arr.push(o.value);
                      else arr.splice(arr.indexOf(o.value), 1);
                      field.onChange(arr);
                    }}
                  />
                  <span className="text-sm">{o.label}</span>
                </label>
              );
            })}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function RadioField({
  name, en, ku, options, required,
}: {
  name: any; en: string; ku?: string; required?: boolean;
  options: { value: string; label: string }[];
}) {
  const { control } = useFormContext<RegisterFormValues>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FieldLabel en={en} ku={ku} required={required} />
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value ?? ""}
              className="flex flex-wrap gap-2"
            >
              {options.map((o) => {
                const checked = field.value === o.value;
                return (
                  <label
                    key={o.value}
                    className={cn(
                      "flex items-center gap-2 rounded-md border border-input px-3 py-2 cursor-pointer transition-colors",
                      checked && "border-primary bg-accent",
                    )}
                  >
                    <RadioGroupItem value={o.value} />
                    <span className="text-sm">{o.label}</span>
                  </label>
                );
              })}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function DateField({ name, en, ku, required }: any) {
  const { control } = useFormContext<RegisterFormValues>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FieldLabel en={en} ku={ku} required={required} />
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "pl-3 text-left font-normal",
                    !field.value && "text-muted-foreground",
                  )}
                >
                  {field.value ? format(field.value as Date, "PPP") : <span>Pick a date</span>}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value as Date | undefined}
                onSelect={field.onChange}
                disabled={(d) => d > new Date() || d < new Date("1900-01-01")}
                initialFocus
                captionLayout="dropdown"
                defaultMonth={(field.value as Date | undefined) ?? new Date(2000, 0)}
                startMonth={new Date(1900, 0)}
                endMonth={new Date()}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function ImagePreview({ file, className }: { file: File; className?: string }) {
  const [url, setUrl] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    setErr(null);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  if (err) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md border border-destructive/40 bg-destructive/5 p-2 text-[10px] text-destructive",
          className,
        )}
        role="alert"
      >
        Preview failed
      </div>
    );
  }
  if (!url) return null;
  return (
    <img
      src={url}
      alt={file.name}
      className={cn("rounded-md border border-border object-cover", className)}
      onError={() => {
        const msg = `Couldn't generate a preview for ${file.name}.`;
        setErr(msg);
        toast.error(msg);
      }}
    />
  );
}

function PdfThumbnail({ file, className }: { file: File; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    setErr(null);
    (async () => {
      try {
        const { renderPdfThumbnail } = await import("@/lib/pdf-thumbnail");
        const data = await renderPdfThumbnail(file);
        if (!cancelled) setUrl(data);
      } catch (e) {
        if (cancelled) return;
        const msg = `Couldn't generate a PDF preview for ${file.name}.`;
        setErr(msg);
        toast.error(msg);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file]);
  if (err) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md border border-destructive/40 bg-destructive/5 p-2 text-[10px] text-destructive",
          className,
        )}
        role="alert"
      >
        Preview failed
      </div>
    );
  }
  if (!url) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md border border-border bg-muted/40",
          className,
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={`Preview of ${file.name}`}
      className={cn("rounded-md border border-border bg-white object-contain", className)}
    />
  );
}

function AudioPreview({ file }: { file: File }) {
  const [url, setUrl] = useState<string>("");
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  if (!url) return null;
  return <audio controls src={url} className="mt-2 w-full" />;
}

function FilePreview({ file }: { file: File }) {
  const isImage = file.type.startsWith("image/");
  const isAudio = file.type.startsWith("audio/");
  const isPdf = file.type === "application/pdf";
  if (isImage) {
    return (
      <div className="mt-2 flex items-center gap-3">
        <ImagePreview file={file} className="h-24 w-24" />
        <div className="text-xs text-muted-foreground">
          <p className="font-medium text-foreground truncate max-w-[200px]">{file.name}</p>
          <p>{formatBytes(file.size)}</p>
        </div>
      </div>
    );
  }
  if (isPdf) {
    return (
      <div className="mt-2 flex items-center gap-3">
        <PdfThumbnail file={file} className="h-24 w-24" />
        <div className="text-xs text-muted-foreground">
          <p className="font-medium text-foreground truncate max-w-[200px]">{file.name}</p>
          <p>{formatBytes(file.size)}</p>
        </div>
      </div>
    );
  }
  if (isAudio) {
    return (
      <div className="mt-2 space-y-1">
        <div className="flex items-center gap-2 text-xs">
          <Music className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium truncate">{file.name}</span>
          <span className="text-muted-foreground">· {formatBytes(file.size)}</span>
        </div>
        <AudioPreview file={file} />
      </div>
    );
  }
  return (
    <div className="mt-2 flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs">
      <FileText className="h-4 w-4 text-muted-foreground" />
      <span className="font-medium truncate">{file.name}</span>
      <span className="text-muted-foreground">· {formatBytes(file.size)}</span>
      <span className="ml-auto text-emerald-600 dark:text-emerald-400">Ready</span>
    </div>
  );
}

function UploadStatusBar({
  kind, bucket, file, position,
}: {
  kind: UploadKind;
  bucket: "talent-media" | "talent-docs";
  file: File;
  position?: number;
}) {
  const ctx = useUploads();
  if (!ctx) return null;
  const key = ctx.uploadKey(kind, file, position);
  const st = ctx.getStatus(key);
  const status = st?.status ?? "pending";
  const busy = status === "uploading";
  const success = status === "success";
  const failed = status === "error";
  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1.5">
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          {success && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
          {failed && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
          <span className={failed ? "text-destructive" : "text-muted-foreground"}>
            {success ? "Uploaded" : failed ? "Failed" : busy ? `${st?.progress ?? 0}%` : "Not uploaded"}
          </span>
        </span>
        {!success && (
          <Button
            type="button"
            size="sm"
            variant={failed ? "outline" : "ghost"}
            className="h-7 px-2 text-xs"
            disabled={busy}
            onClick={() => ctx.uploadOne({ kind, bucket, file, position })}
          >
            {failed ? (
              <><RotateCw className="mr-1 h-3 w-3" /> Retry</>
            ) : (
              <><UploadCloud className="mr-1 h-3 w-3" /> {busy ? "Uploading…" : "Upload now"}</>
            )}
          </Button>
        )}
      </div>
      {(busy || failed) && (
        <Progress value={failed ? 0 : st?.progress ?? 0} className="h-1.5" />
      )}
      {failed && st?.error && <p className="text-xs text-destructive">{st.error}</p>}
    </div>
  );
}

function FileField({
  name, en, ku, accept, required, hint,
  uploadKind, uploadBucket, uploadPosition,
}: {
  name: any; en: string; ku?: string; accept?: string; required?: boolean; hint?: string;
  uploadKind?: UploadKind;
  uploadBucket?: "talent-media" | "talent-docs";
  uploadPosition?: number;
}) {
  const { control } = useFormContext<RegisterFormValues>();
  const uploads = useUploads();
  const [localError, setLocalError] = useState<string | null>(null);
  const rule = uploadKind ? UPLOAD_RULES[uploadKind] : null;
  return (
    <FormField
      control={control}
      name={name}
      render={({ field: { onChange, value, ...rest } }) => (
        <FormItem>
          <FieldLabel en={en} ku={ku} required={required} />
          <FormControl>
            <Input
              type="file"
              accept={accept}
              onChange={(e) => {
                const f = e.target.files?.[0];
                setLocalError(null);
                if (!f) { onChange(undefined); return; }
                if (uploadKind) {
                  const err = validateUpload(uploadKind, f);
                  if (err) {
                    setLocalError(err);
                    toast.error(err);
                    onChange(undefined);
                    e.target.value = "";
                    return;
                  }
                }
                onChange(f);
                if (uploadKind && uploadBucket && uploads) {
                  uploads
                    .uploadOne({ kind: uploadKind, bucket: uploadBucket, file: f, position: uploadPosition })
                    .catch((err) => toast.error(err?.message ?? "Upload failed"));
                }
              }}
              {...rest}
            />
          </FormControl>
          {value instanceof File && (
            <>
              <FilePreview file={value} />
              {uploadKind && uploadBucket && (
                <UploadStatusBar
                  kind={uploadKind}
                  bucket={uploadBucket}
                  file={value}
                  position={uploadPosition}
                />
              )}
              <div className="mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    onChange(undefined);
                    setLocalError(null);
                  }}
                >
                  <Trash2 className="mr-1 h-3 w-3" /> Remove & re-upload
                </Button>
              </div>
            </>
          )}
          {localError ? (
            <p className="text-xs text-destructive">{localError}</p>
          ) : hint ? (
            <p className="text-xs text-muted-foreground">{hint}</p>
          ) : rule ? (
            <p className="text-xs text-muted-foreground">{rule.accept}</p>
          ) : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function MultiFileField({
  name, en, ku, accept, max = 4, required, hint,
  uploadKind, uploadBucket, uploadPositionStart = 0,
}: {
  name: any; en: string; ku?: string; accept?: string; max?: number; required?: boolean; hint?: string;
  uploadKind?: UploadKind;
  uploadBucket?: "talent-media" | "talent-docs";
  uploadPositionStart?: number;
}) {
  const { control } = useFormContext<RegisterFormValues>();
  const uploads = useUploads();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => {
        const files: File[] = Array.isArray(value) ? value : [];
        return (
          <FormItem>
            <FieldLabel en={en} ku={ku} required={required} />
            <FormControl>
              <Input
                type="file"
                accept={accept}
                multiple
                onChange={(e) => {
                  const incoming = Array.from(e.target.files ?? []);
                  const accepted: File[] = [];
                  for (const f of incoming) {
                    if (uploadKind) {
                      const err = validateUpload(uploadKind, f);
                      if (err) { toast.error(err); continue; }
                    }
                    accepted.push(f);
                  }
                  const merged = [...files, ...accepted].slice(0, max);
                  if (merged.length < files.length + accepted.length) {
                    toast.error(`Only ${max} files allowed. Extra files were ignored.`);
                  }
                  onChange(merged);
                  if (uploadKind && uploadBucket && uploads) {
                    accepted.forEach((f, idx) => {
                      const pos = uploadPositionStart + files.length + idx;
                      uploads
                        .uploadOne({ kind: uploadKind, bucket: uploadBucket, file: f, position: pos })
                        .catch((err) => toast.error(err?.message ?? "Upload failed"));
                    });
                  }
                  e.target.value = "";
                }}
              />
            </FormControl>
            {files.length > 0 && (
              <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {files.map((f, i) => {
                  const isImage = f.type.startsWith("image/");
                  const isPdf = f.type === "application/pdf";
                  return (
                    <li
                      key={`${f.name}-${i}`}
                      className="relative rounded-md border border-border bg-muted/40 p-1 text-xs"
                    >
                      {isImage ? (
                        <ImagePreview file={f} className="h-24 w-full" />
                      ) : isPdf ? (
                        <PdfThumbnail file={f} className="h-24 w-full" />
                      ) : (
                        <div className="flex h-24 items-center justify-center">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="mt-1 flex items-center justify-between gap-1">
                        <span className="truncate" title={f.name}>{f.name}</span>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              aria-label={`Remove ${f.name}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove this file?</AlertDialogTitle>
                              <AlertDialogDescription>
                                <span className="font-medium text-foreground">{f.name}</span> will be removed from your selection. You can add it again before submitting.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  const next = files.slice();
                                  next.splice(i, 1);
                                  onChange(next);
                                }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      {uploadKind && uploadBucket && (
                        <UploadStatusBar
                          kind={uploadKind}
                          bucket={uploadBucket}
                          file={f}
                          position={uploadPositionStart + i}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="text-xs text-muted-foreground">
              {files.length}/{max} selected{hint ? ` · ${hint}` : ""}
            </p>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

// -------------------- Steps --------------------

export function Step1() {
  return (
    <div className="space-y-6">
      <SectionTitle sub="Basic Information / زانیاری بنەڕەتی">Step 1</SectionTitle>
      <div className="grid gap-4 md:grid-cols-3">
        <TextField name="firstName" en="First Name" ku="ناوی یەکەم" required />
        <TextField name="middleName" en="Middle Name" />
        <TextField name="lastName" en="Last Name" ku="ناوی دووەم" required />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField name="stageName" en="Stage Name" ku="ناوی هونەری" />
        <SelectField
          name="gender" en="Gender" ku="ڕەگەز" required
          options={[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
            { value: "non_binary", label: "Non Binary" },
            { value: "other", label: "Other" },
          ]}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <TextField name="age" en="Age" ku="تەمەن" type="number" required />
        <TextField name="playingAge" en="Playing Age" ku="تەمەنی نواندن" placeholder="e.g. 25-32" />
        <DateField name="dateOfBirth" en="Date of Birth" ku="ڕێکەوتی لەدایکبوون" required />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField name="phone" en="Phone" ku="ژمارەی تەلەفۆن" type="tel" required />
        <TextField name="email" en="Email" ku="ئیمەیڵ" type="email" required />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          name="password"
          en="Password (optional)"
          ku="وشەی نهێنی (ئارەزوومەندانە)"
          type="password"
          placeholder="Leave empty to auto-generate"
        />
        <div className="flex items-end text-xs text-muted-foreground">
          If left empty we'll generate a strong password and show it once after you submit. Save it to sign in later.
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField name="location" en="Location" ku="شوێن" required />
        <TextField name="nationality" en="Nationality" ku="نەتەوە" required />
      </div>
    </div>
  );
}

export function Step2() {
  return (
    <div className="space-y-6">
      <SectionTitle sub="Physical Details / تایبەتمەندیە جەستەییەکان">Step 2</SectionTitle>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField name="height" en="Height" ku="بەرزی" placeholder="e.g. 178 cm" />
        <TextField name="weight" en="Weight" ku="کێش" placeholder="e.g. 72 kg" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          name="eyeColor" en="Eye Color" ku="ڕەنگی چاو"
          options={[
            { value: "black", label: "Black" },
            { value: "brown", label: "Brown" },
            { value: "blonde", label: "Blonde" },
            { value: "grey", label: "Grey" },
            { value: "red", label: "Red" },
          ]}
        />
        <SelectField
          name="hairColor" en="Hair Color" ku="ڕەنگی قژ"
          options={[
            { value: "blonde_fair", label: "Blonde / Fair" },
            { value: "brown", label: "Brown" },
            { value: "dark_brown_black", label: "Dark Brown / Black" },
            { value: "red_auburn", label: "Red / Auburn" },
            { value: "grey_white", label: "Grey / White" },
            { value: "other", label: "Other" },
          ]}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <RadioField
          name="hairLength" en="Hair Length" ku="درێژی قژ"
          options={[
            { value: "long", label: "Long" },
            { value: "shoulder", label: "Shoulder-length" },
            { value: "short", label: "Short" },
            { value: "bald", label: "Bald" },
          ]}
        />
        <RadioField
          name="skinTone" en="Skin Tone" ku="ڕەنگی پێست"
          options={[
            { value: "fair", label: "Fair" },
            { value: "medium", label: "Medium" },
            { value: "dark", label: "Dark" },
          ]}
        />
        <RadioField
          name="bodyType" en="Body Type" ku="جۆری جەستە"
          options={[
            { value: "slim", label: "Slim" },
            { value: "athletic", label: "Athletic" },
            { value: "average", label: "Average" },
            { value: "heavy", label: "Heavy" },
          ]}
        />
      </div>
      <TextAreaField name="distinguishingFeatures" en="Distinguishing Features" ku="تایبەتمەندیەکان" />
    </div>
  );
}

export function Step3() {
  const { watch } = useFormContext<RegisterFormValues>();
  const license = watch("drivingLicense");
  const showUpload = license && license !== "none";
  return (
    <div className="space-y-6">
      <SectionTitle sub="Skills & Abilities / لێهاتوویەکان">Step 3</SectionTitle>
      <RadioField
        name="actingLevel" en="Acting Level" ku="ئاستی ئەکتینگ"
        options={[
          { value: "none", label: "None" },
          { value: "beginner", label: "Beginner" },
          { value: "intermediate", label: "Intermediate" },
          { value: "professional", label: "Professional" },
        ]}
      />
      <CheckboxGroupField
        name="dance" en="Dance" ku="سەما"
        options={[
          { value: "hiphop", label: "Hiphop" },
          { value: "ballet", label: "Ballet" },
          { value: "folk", label: "Folk" },
          { value: "contemporary", label: "Contemporary" },
        ]}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <TextField name="danceCategory" en="Dance Category" placeholder="Please write your dance category" />
        <TextField name="skills" en="Skills" />
      </div>
      <RadioField
        name="singing" en="Singing" ku="گۆرانی"
        options={[
          { value: "none", label: "None" },
          { value: "basic", label: "Basic" },
          { value: "trained", label: "Trained" },
        ]}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <TextField name="lowestNote" en="Lowest Note" ku="نزمترین نۆت" />
        <TextField name="highestNote" en="Highest Note" ku="بەرزترین نۆت" />
        <TextField name="vocalTechniques" en="Vocal Techniques" ku="تەکنیکەکانی دەنگ" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <RadioField
          name="stunts" en="Stunts" ku="ستۆنتەکان"
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
        />
        <CheckboxGroupField
          name="instruments" en="Instruments" ku="ئامرازە مۆسیقیەکان"
          options={[
            { value: "guitar", label: "Guitar" },
            { value: "piano", label: "Piano" },
            { value: "saz", label: "Saz" },
            { value: "daf", label: "Daf" },
          ]}
        />
      </div>
      <TextField name="sports" en="Sports" ku="وەرزش" />
      <div className="grid gap-4 md:grid-cols-2">
        <RadioField
          name="drivingLicense" en="Driving License" ku="مۆڵەتی شۆفێری"
          options={[
            { value: "none", label: "None" },
            { value: "car", label: "Car" },
            { value: "bike", label: "Bike" },
            { value: "both", label: "Both" },
          ]}
        />
        {showUpload && (
          <FileField
            name="drivingLicenseFile"
            en="Driving License Upload"
            ku="مۆڵەتی شۆفێری"
            accept="image/*,application/pdf"
            hint="Optional · Image or PDF, max 5MB"
            uploadKind="driving_license"
            uploadBucket="talent-docs"
          />
        )}
      </div>
      <TextField name="profession" en="Profession" ku="پیشە" />
    </div>
  );
}

export function Step4() {
  return (
    <div className="space-y-6">
      <SectionTitle sub="Languages / زمانەکان">Step 4</SectionTitle>
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          name="nativeLanguage" en="Native Language" ku="زمانی دایک"
          options={[
            { value: "kurdish", label: "Kurdish" },
            { value: "arabic", label: "Arabic" },
            { value: "english", label: "English" },
          ]}
        />
        <TextField name="otherLanguages" en="Other Languages" ku="زمانەکانی تر" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          name="fluency" en="Fluency" ku="ئاستی زمان"
          options={[
            { value: "basic", label: "Basic" },
            { value: "good", label: "Good" },
            { value: "fluent", label: "Fluent" },
            { value: "native", label: "Native" },
          ]}
        />
        <SelectField
          name="kurdishDialect" en="Kurdish Dialect" ku="زاراوەی کوردی"
          options={[
            { value: "kurmanji", label: "Kurmanji" },
            { value: "sorani", label: "Sorani" },
            { value: "both", label: "Both" },
          ]}
        />
      </div>
      <TextField name="accents" en="Accents" ku="شێوەزار" />
    </div>
  );
}

function CreditsRepeater({
  name, title, ku,
}: { name: "filmCredits" | "tvCredits" | "theatreCredits" | "commercialCredits"; title: string; ku?: string }) {
  const { control } = useFormContext<RegisterFormValues>();
  const { fields, append, remove } = useFieldArray({ control: control as any, name });
  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{title}</h3>
          {ku && <p dir="rtl" className="text-xs text-muted-foreground">{ku}</p>}
        </div>
        <Button
          type="button" variant="outline" size="sm"
          onClick={() => append({ projectName: "", role: "", director: "", year: "", productionCompany: "" })}
        >
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
      {fields.length === 0 && <p className="text-sm text-muted-foreground">No entries yet.</p>}
      {fields.map((f, i) => (
        <div key={f.id} className="space-y-3 rounded-md bg-muted/40 p-3">
          <div className="grid gap-3 md:grid-cols-2">
            <TextField name={`${name}.${i}.projectName` as any} en="Project Name" ku="ناوی پرۆژە" />
            <TextField name={`${name}.${i}.role` as any} en="Character / Role" ku="ڕۆڵ" />
            <TextField name={`${name}.${i}.director` as any} en="Director" ku="دەرهێنەر" />
            <TextField name={`${name}.${i}.year` as any} en="Year" ku="ساڵ" />
          </div>
          <TextField name={`${name}.${i}.productionCompany` as any} en="Production Company" ku="کۆمپانیای وەبەرهێنان" />
          <div className="flex justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)}>
              <Trash2 className="h-4 w-4 mr-1" /> Remove
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function TrainingRepeater() {
  const { control } = useFormContext<RegisterFormValues>();
  const { fields, append, remove } = useFieldArray({ control: control as any, name: "training" });
  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Training</h3>
        <Button
          type="button" variant="outline" size="sm"
          onClick={() => append({ institution: "", yearGraduated: "", productionCompany: "" })}
        >
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
      {fields.length === 0 && <p className="text-sm text-muted-foreground">No entries yet.</p>}
      {fields.map((f, i) => (
        <div key={f.id} className="space-y-3 rounded-md bg-muted/40 p-3">
          <div className="grid gap-3 md:grid-cols-3">
            <TextField name={`training.${i}.institution` as any} en="Institution Name" ku="ناوی دامەزراوە" />
            <TextField name={`training.${i}.yearGraduated` as any} en="Year Graduated" ku="ساڵی دەرچوون" />
            <TextField name={`training.${i}.productionCompany` as any} en="Production Company" ku="کۆمپانیای وەبەرهێنان" />
          </div>
          <div className="flex justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)}>
              <Trash2 className="h-4 w-4 mr-1" /> Remove
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Step5() {
  return (
    <div className="space-y-6">
      <SectionTitle sub="Experience & Training / ئەزموون و ڕاهێنان">Step 5</SectionTitle>
      <TextField name="yearsOfExperience" en="Years of Experience" ku="ئەزموونی ساڵانی" type="number" />
      <CreditsRepeater name="filmCredits" title="Film Credits" ku="فیلم" />
      <CreditsRepeater name="tvCredits" title="TV Credits" ku="تەلەفزیۆن" />
      <CreditsRepeater name="theatreCredits" title="Theatre Credits" ku="شانۆ" />
      <CreditsRepeater name="commercialCredits" title="Commercial Ads" ku="ڕیکلام" />
      <TrainingRepeater />
      <TextAreaField name="workshops" en="Workshops" ku="وۆرکشۆپ" />
    </div>
  );
}

export function Step6() {
  return (
    <div className="space-y-6">
      <SectionTitle sub="Agent Information / زانیاری ئەجێنت (Optional)">Step 6</SectionTitle>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField name="agentName" en="Agent Name" ku="ناوی ئەجێنت" />
        <TextField name="agency" en="Agency" ku="ناوی ئەجەنسی" />
        <TextField name="agentEmail" en="Agent Email" type="email" />
        <TextField name="agentPhone" en="Agent Phone Number" type="tel" />
      </div>
    </div>
  );
}

export function Step7() {
  return (
    <div className="space-y-6">
      <SectionTitle sub="Media Uploads / بارکردنی میدیا">Step 7</SectionTitle>
      <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
        <p>
          Before submitting, make sure you have these files ready. Items marked{" "}
          <span className="text-destructive font-medium">Required</span> must be
          uploaded; <span className="font-medium">Optional</span> items
          strengthen your application.
        </p>
        <p>
          Accepted: images (JPG, PNG, WEBP) up to 5MB · audio (MP3, WAV, M4A) up
          to 15MB · documents (PDF, DOC, DOCX) up to 5MB.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FileField
          name="headshot"
          en="Headshot"
          ku="وێنەی سەروشانە"
          accept="image/jpeg,image/png,image/webp"
          required
          hint="Required · Clear face shot, JPG/PNG/WEBP, max 5MB"
          uploadKind="headshot"
          uploadBucket="talent-media"
          uploadPosition={0}
        />
        <FileField
          name="fullBodyPhoto"
          en="Full-Body Photo"
          ku="وێنەی تەواوی جەستە"
          accept="image/jpeg,image/png,image/webp"
          required
          hint="Required · Head-to-toe photo, JPG/PNG/WEBP, max 5MB"
          uploadKind="full_body"
          uploadBucket="talent-media"
          uploadPosition={1}
        />
      </div>
      <MultiFileField
        name="mediumShots"
        en="Medium Shots (up to 4)"
        ku="وێنەی مامناوەند"
        accept="image/jpeg,image/png,image/webp"
        max={4}
        hint="Optional · Waist-up shots, JPG/PNG/WEBP, max 5MB each"
        uploadKind="medium_shot"
        uploadBucket="talent-media"
        uploadPositionStart={10}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <FileField
          name="voiceReel"
          en="Voice Reel"
          ku="نموونەی دەنگ"
          accept="audio/*"
          hint="Optional · MP3/WAV/M4A, max 15MB"
          uploadKind="voice_reel"
          uploadBucket="talent-media"
        />
        <FileField
          name="cv"
          en="CV / Resume"
          ku="سی ڤی"
          accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          hint="Optional · PDF or DOC/DOCX, max 5MB"
          uploadKind="cv"
          uploadBucket="talent-docs"
        />
      </div>
      <TextField
        name="showreelLink"
        en="Showreel Link"
        ku="بەستەری شۆڕیڵ"
        placeholder="https://youtube.com/... or https://vimeo.com/..."
      />
    </div>
  );
}

export function Step8() {
  return (
    <div className="space-y-6">
      <SectionTitle sub="Availability / بەردەستی">Step 8</SectionTitle>
      <RadioField
        name="availableForWork"
        en="Available for Work"
        options={[
          { value: "yes", label: "Yes" },
          { value: "limited", label: "Limited" },
          { value: "no", label: "Not currently" },
        ]}
      />
      <RadioField
        name="travelAvailability"
        en="Travel Availability"
        options={[
          { value: "local", label: "Local only" },
          { value: "national", label: "National" },
          { value: "international", label: "International" },
          { value: "none", label: "None" },
        ]}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <RadioField
          name="passport"
          en="Passport"
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
        />
        <RadioField
          name="workPermit"
          en="Work Permit"
          options={[
            { value: "yes", label: "Yes" },
            { value: "pending", label: "Pending" },
            { value: "no", label: "No" },
          ]}
        />
        <RadioField
          name="willingToTravel"
          en="Willing to Travel"
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
        />
      </div>
    </div>
  );
}

export function Step9() {
  return (
    <div className="space-y-6">
      <SectionTitle sub="Special Skills & Notes / لێهاتووییە تایبەتەکان">Step 9</SectionTitle>
      <TextAreaField name="specialSkills" en="Special Skills" placeholder="e.g. archery, horse riding, martial arts…" />
      <TextAreaField name="awards" en="Awards" placeholder="Recognitions, festival selections, prizes…" />
      <TextAreaField name="notes" en="Notes" placeholder="Anything else casting should know" />
      <TextAreaField name="languageNotes" en="Language Notes" placeholder="Dialect specifics, accent training…" />
      <TextAreaField name="castingNotes" en="Casting Notes" placeholder="Roles you are best suited for…" />
    </div>
  );
}

function AgreementCheckbox({
  name, label,
}: { name: any; label: string }) {
  const { control } = useFormContext<RegisterFormValues>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <label
            className={cn(
              "flex items-start gap-3 rounded-md border border-input p-3 cursor-pointer transition-colors",
              field.value && "border-primary bg-accent",
            )}
          >
            <FormControl>
              <Checkbox
                checked={!!field.value}
                onCheckedChange={(c) => field.onChange(c === true)}
                className="mt-0.5"
              />
            </FormControl>
            <span className="text-sm leading-relaxed">{label}</span>
          </label>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function Step10() {
  return (
    <div className="space-y-6">
      <SectionTitle sub="Agreements / ڕێککەوتنەکان">Step 10</SectionTitle>
      <p className="text-sm text-muted-foreground">
        Please confirm the following before submitting your application.
      </p>
      <div className="space-y-3">
        <AgreementCheckbox
          name="personalDataAccepted"
          label="I accept that Art City may collect and process my personal data for casting and representation purposes."
        />
        <AgreementCheckbox
          name="mediaUsageAccepted"
          label="I accept that the photos, voice reels, and showreel I upload may be used by Art City for casting submissions and promotion."
        />
        <AgreementCheckbox
          name="termsAccepted"
          label="I have read and accept the Art City Casting terms and conditions."
        />
        <AgreementCheckbox
          name="publishAcknowledged"
          label="I understand that submitting this form does not automatically publish my profile. My profile will only appear in the Art City Casting talent directory after review, approval, and publishing by Art City admin."
        />
      </div>
    </div>
  );
}
