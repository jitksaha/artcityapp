import { z } from "zod";

export const creditSchema = z.object({
  projectName: z.string().trim().max(150).optional().or(z.literal("")),
  role: z.string().trim().max(150).optional().or(z.literal("")),
  director: z.string().trim().max(150).optional().or(z.literal("")),
  year: z.string().trim().max(4).optional().or(z.literal("")),
  productionCompany: z.string().trim().max(150).optional().or(z.literal("")),
});

export const trainingSchema = z.object({
  institution: z.string().trim().max(150).optional().or(z.literal("")),
  yearGraduated: z.string().trim().max(4).optional().or(z.literal("")),
  productionCompany: z.string().trim().max(150).optional().or(z.literal("")),
});

export const registerSchema = z.object({
  // Step 1
  firstName: z.string().trim().min(1, "Required").max(80),
  middleName: z.string().trim().max(80).optional().or(z.literal("")),
  lastName: z.string().trim().min(1, "Required").max(80),
  stageName: z.string().trim().max(80).optional().or(z.literal("")),
  gender: z.enum(["male", "female", "non_binary", "other"], {
    required_error: "Select gender",
  }),
  age: z.coerce.number().int().min(1).max(120),
  playingAge: z.string().trim().max(40).optional().or(z.literal("")),
  dateOfBirth: z.date({ required_error: "Pick a date" }),
  phone: z.string().trim().min(5, "Required").max(30),
  email: z.string().trim().email("Invalid email").max(255),
  location: z.string().trim().min(1, "Required").max(150),
  nationality: z.string().trim().min(1, "Required").max(80),

  // Step 2
  height: z.string().trim().max(20).optional().or(z.literal("")),
  weight: z.string().trim().max(20).optional().or(z.literal("")),
  eyeColor: z.enum(["black", "brown", "blonde", "grey", "red"]).optional(),
  hairColor: z
    .enum(["blonde_fair", "brown", "dark_brown_black", "red_auburn", "grey_white", "other"])
    .optional(),
  hairLength: z.enum(["long", "shoulder", "short", "bald"]).optional(),
  skinTone: z.enum(["fair", "medium", "dark"]).optional(),
  bodyType: z.enum(["slim", "athletic", "average", "heavy"]).optional(),
  distinguishingFeatures: z.string().trim().max(500).optional().or(z.literal("")),

  // Step 3
  actingLevel: z.enum(["none", "beginner", "intermediate", "professional"]).optional(),
  dance: z.array(z.enum(["hiphop", "ballet", "folk", "contemporary"])).default([]),
  danceCategory: z.string().trim().max(150).optional().or(z.literal("")),
  skills: z.string().trim().max(500).optional().or(z.literal("")),
  singing: z.enum(["none", "basic", "trained"]).optional(),
  lowestNote: z.string().trim().max(20).optional().or(z.literal("")),
  highestNote: z.string().trim().max(20).optional().or(z.literal("")),
  vocalTechniques: z.string().trim().max(300).optional().or(z.literal("")),
  stunts: z.enum(["yes", "no"]).optional(),
  instruments: z.array(z.enum(["guitar", "piano", "saz", "daf"])).default([]),
  sports: z.string().trim().max(300).optional().or(z.literal("")),
  drivingLicense: z.enum(["none", "car", "bike", "both"]).optional(),
  drivingLicenseFile: z
    .any()
    .optional()
    .refine(
      (f) => !f || (f instanceof File && f.size <= 5 * 1024 * 1024),
      "Max 5MB",
    ),
  profession: z.string().trim().max(150).optional().or(z.literal("")),

  // Step 4
  nativeLanguage: z.enum(["kurdish", "arabic", "english"]).optional(),
  otherLanguages: z.string().trim().max(300).optional().or(z.literal("")),
  fluency: z.enum(["basic", "good", "fluent", "native"]).optional(),
  kurdishDialect: z.enum(["kurmanji", "sorani", "both"]).optional(),
  accents: z.string().trim().max(300).optional().or(z.literal("")),

  // Step 5
  yearsOfExperience: z.coerce.number().int().min(0).max(80).optional(),
  filmCredits: z.array(creditSchema).default([]),
  tvCredits: z.array(creditSchema).default([]),
  theatreCredits: z.array(creditSchema).default([]),
  commercialCredits: z.array(creditSchema).default([]),
  training: z.array(trainingSchema).default([]),
  workshops: z.string().trim().max(500).optional().or(z.literal("")),

  // Step 6
  agentName: z.string().trim().max(120).optional().or(z.literal("")),
  agency: z.string().trim().max(120).optional().or(z.literal("")),
  agentEmail: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  agentPhone: z.string().trim().max(30).optional().or(z.literal("")),
}).superRefine((val, ctx) => {
  if (val.drivingLicense && val.drivingLicense !== "none" && !val.drivingLicenseFile) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["drivingLicenseFile"],
      message: "Upload your driving license",
    });
  }
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const STEP_FIELDS: (keyof RegisterFormValues)[][] = [
  [
    "firstName", "middleName", "lastName", "stageName", "gender", "age",
    "playingAge", "dateOfBirth", "phone", "email", "location", "nationality",
  ],
  [
    "height", "weight", "eyeColor", "hairColor", "hairLength", "skinTone",
    "bodyType", "distinguishingFeatures",
  ],
  [
    "actingLevel", "dance", "danceCategory", "skills", "singing", "lowestNote",
    "highestNote", "vocalTechniques", "stunts", "instruments", "sports",
    "drivingLicense", "drivingLicenseFile", "profession",
  ],
  ["nativeLanguage", "otherLanguages", "fluency", "kurdishDialect", "accents"],
  ["yearsOfExperience", "filmCredits", "tvCredits", "theatreCredits", "commercialCredits", "training", "workshops"],
  ["agentName", "agency", "agentEmail", "agentPhone"],
];
