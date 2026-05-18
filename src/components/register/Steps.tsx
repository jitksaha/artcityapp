import { useFieldArray, useFormContext, Control } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
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

type FC = Control<RegisterFormValues>;

function TextField({
  name, en, ku, required, type = "text", placeholder,
}: {
  name: any; en: string; ku?: string; required?: boolean; type?: string; placeholder?: string;
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
            <Input type={type} placeholder={placeholder} {...field} value={field.value ?? ""} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function TextAreaField({ name, en, ku, placeholder }: any) {
  const { control } = useFormContext<RegisterFormValues>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FieldLabel en={en} ku={ku} />
          <FormControl>
            <Textarea rows={3} placeholder={placeholder} {...field} value={field.value ?? ""} />
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
          <Select onValueChange={field.onChange} value={field.value ?? ""}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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

function FileField({ name, en, ku, accept }: any) {
  const { control } = useFormContext<RegisterFormValues>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field: { onChange, value, ...rest } }) => (
        <FormItem>
          <FieldLabel en={en} ku={ku} />
          <FormControl>
            <Input
              type="file"
              accept={accept}
              onChange={(e) => onChange(e.target.files?.[0])}
              {...rest}
            />
          </FormControl>
          {value instanceof File && (
            <p className="text-xs text-muted-foreground">{value.name}</p>
          )}
          <FormMessage />
        </FormItem>
      )}
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
