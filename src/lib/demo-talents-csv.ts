// Client-safe CSV utilities for the admin "Import demo talents" action.

export const DEMO_TALENTS_CSV_HEADERS = [
  "email",
  "password",
  "full_name",
  "stage_name",
  "slug",
  "gender",
  "age",
  "playing_age",
  "location",
  "nationality",
  "native_language",
  "categories",
  "bio",
  "headshot_url",
] as const;

export type DemoTalentRow = Record<(typeof DEMO_TALENTS_CSV_HEADERS)[number], string>;

export const DEMO_TALENTS_SAMPLE_CSV = `email,password,full_name,stage_name,slug,gender,age,playing_age,location,nationality,native_language,categories,bio,headshot_url
demo.aisha@example.com,DemoPass123!,Aisha Khan,Aisha K,aisha-khan,female,28,25-32,"Dubai, UAE",Pakistani,Urdu,actress;model,"Experienced model and actress based in Dubai with 6+ years on set.",https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600
demo.omar@example.com,DemoPass123!,Omar Said,Omar S,omar-said,male,34,30-40,"Abu Dhabi, UAE",Emirati,Arabic,actor;performer,"Bilingual actor (Arabic/English) — theatre, TV, commercials.",https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600
demo.lara@example.com,DemoPass123!,Lara Costa,Lara C,lara-costa,female,24,20-28,"Dubai, UAE",Brazilian,Portuguese,model,"Editorial and runway model, fluent in EN/PT/ES.",https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600
`;

// Minimal RFC-4180-ish CSV parser supporting quoted fields and escaped quotes.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += c;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

export function rowsToObjects(rows: string[][]): DemoTalentRow[] {
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj: any = {};
    headers.forEach((h, idx) => (obj[h] = (r[idx] ?? "").trim()));
    return obj as DemoTalentRow;
  });
}
