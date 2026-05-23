
DO $migration$
DECLARE
  i int;
  fn text; ln text; full_name text; stage text; slug_v text;
  gender_v text; age_v int; play_low int; play_high int;
  loc text; nat text; native_v text;
  cats text[]; cat_arr public.talent_category[];
  uid uuid;
  first_m text[] := ARRAY['Arjun','Rahim','Karim','Imran','Tariq','Sami','Faisal','Omar','Yusuf','Bilal','Hassan','Asif','Rohit','Vikram','Aditya','Rajiv','Sanjay','Kabir','Aryan','Dev','Ishan','Nikhil','Pranav','Siddharth','Arif'];
  first_f text[] := ARRAY['Aisha','Maya','Zara','Priya','Anaya','Diya','Sara','Layla','Nadia','Fatima','Rhea','Neha','Pooja','Sneha','Tara','Anika','Ishita','Kavya','Meera','Riya','Ananya','Saanvi','Aarohi','Myra','Kiara'];
  last_n text[] := ARRAY['Khan','Ahmed','Rahman','Hossain','Islam','Chowdhury','Sharma','Patel','Verma','Reddy','Iyer','Nair','Singh','Kapoor','Mehta','Joshi','Das','Ghosh','Bose','Roy','Sen','Mitra','Banerjee','Choudhury','Malik'];
  locs text[] := ARRAY['Dhaka, Bangladesh','Mumbai, India','Kolkata, India','Delhi, India','Bangalore, India','Chittagong, Bangladesh','Karachi, Pakistan','Lahore, Pakistan','Colombo, Sri Lanka','Kathmandu, Nepal','Dubai, UAE','London, UK','New York, USA','Toronto, Canada','Sydney, Australia'];
  nats text[] := ARRAY['Bangladeshi','Indian','Pakistani','Sri Lankan','Nepali','British','American','Canadian','Australian','Emirati'];
  langs text[] := ARRAY['Bengali','Hindi','English','Urdu','Tamil','Telugu','Punjabi','Arabic','Marathi','Gujarati'];
  eyes text[] := ARRAY['Brown','Black','Hazel','Green','Blue','Grey'];
  hairs text[] := ARRAY['Black','Brown','Dark Brown','Blonde','Auburn'];
  builds text[] := ARRAY['Slim','Athletic','Average','Muscular','Curvy','Petite'];
  skins text[] := ARRAY['Fair','Wheatish','Olive','Brown','Dark'];
  skills_pool text[] := ARRAY['Horse Riding','Swimming','Martial Arts','Dancing','Singing','Yoga','Cricket','Football','Boxing','Driving','Stage Combat','Improvisation','Stunt Work','Archery','Cycling'];
  accents_pool text[] := ARRAY['Neutral','British','American','Indian','Bengali','Australian','South Asian'];
  prod_types text[] := ARRAY['Feature Film','Web Series','TV Drama','TVC','Short Film','Theatre','Music Video','Documentary','Print Campaign'];
  roles_pool text[] := ARRAY['Lead','Supporting','Cameo','Recurring','Ensemble','Voice Lead'];
  agencies text[] := ARRAY['Stellar Talent Co.','Spotlight Agency','Prime Casting','Apex Talent','Lumen Artists',NULL,NULL];
  city_v text; country_v text;
  is_vip bool; is_feat bool; feat_order int;
  height_v int; weight_v int;
BEGIN
  PERFORM set_config('app.bypass_talent_guard','on', true);

  FOR i IN 1..100 LOOP
    gender_v := CASE (i % 3) WHEN 0 THEN 'male' WHEN 1 THEN 'female' ELSE 'non_binary' END;
    IF gender_v = 'female' THEN
      fn := first_f[1 + (i % array_length(first_f,1))];
    ELSE
      fn := first_m[1 + (i % array_length(first_m,1))];
    END IF;
    ln := last_n[1 + ((i*7) % array_length(last_n,1))];
    full_name := fn || ' ' || ln;
    stage := fn || ' ' || last_n[1 + ((i*3+1) % array_length(last_n,1))];
    slug_v := lower(regexp_replace(stage, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || lpad(i::text,3,'0');
    age_v := 18 + (i*13 % 38);
    play_low := GREATEST(16, age_v - 3);
    play_high := age_v + 4;
    loc := locs[1 + (i % array_length(locs,1))];
    nat := nats[1 + ((i*5) % array_length(nats,1))];
    native_v := langs[1 + ((i*11) % array_length(langs,1))];
    city_v := split_part(loc, ',', 1);
    country_v := btrim(split_part(loc, ',', 2));

    IF gender_v = 'female' THEN
      cats := ARRAY['actress','model'];
    ELSIF gender_v = 'male' THEN
      cats := ARRAY['actor','model'];
    ELSE
      cats := ARRAY['performer','voice_talent'];
    END IF;
    IF (i % 4) = 0 AND NOT ('voice_talent' = ANY(cats)) THEN cats := cats || ARRAY['voice_talent']; END IF;
    IF (i % 5) = 0 AND NOT ('performer' = ANY(cats)) THEN cats := cats || ARRAY['performer']; END IF;
    cat_arr := cats::public.talent_category[];

    is_vip := i <= 8;
    is_feat := i <= 15;
    feat_order := CASE WHEN is_feat THEN i - 1 ELSE NULL END;
    uid := gen_random_uuid();
    height_v := 150 + (i*7 % 45);
    weight_v := 45 + (i*3 % 50);

    INSERT INTO public.talent_profiles (
      user_id, slug, stage_name, full_name, gender, age, playing_age,
      location, nationality, native_language, categories, bio, headshot_url, showreel_link,
      basic_info, physical, skills, languages, experience, agent, availability, agreements, extra_notes,
      status, approved, published, visible_publicly, vip, featured, featured_order,
      approved_at, published_at, submitted_at, reviewed_at
    ) VALUES (
      uid, slug_v, stage, full_name, gender_v, age_v, play_low || '-' || play_high,
      loc, nat, native_v, cat_arr,
      stage || ' is a ' || age_v || '-year-old ' || array_to_string(cats, '/') || ' based in ' || loc ||
        '. With ' || (2 + (i % 18)) || '+ years across ' || prod_types[1 + (i % array_length(prod_types,1))] ||
        ' productions, ' || fn || ' brings versatility, dedication, and a distinct on-screen presence to every role. Trained in ' ||
        skills_pool[1 + (i % array_length(skills_pool,1))] || ' and ' ||
        skills_pool[1 + ((i*3) % array_length(skills_pool,1))] ||
        ', ' || fn || ' is comfortable in dramatic, comedic, and commercial work.',
      'https://i.pravatar.cc/600?img=' || ((i % 70) + 1),
      CASE WHEN i % 2 = 0 THEN 'https://vimeo.com/' || (100000000 + i*123457) ELSE '' END,
      jsonb_build_object(
        'marital_status', (ARRAY['Single','Married','Prefer not to say'])[1 + (i % 3)],
        'religion', (ARRAY['Islam','Hinduism','Christianity','Buddhism','Other'])[1 + (i % 5)],
        'date_of_birth', ((2025 - age_v) || '-' || lpad(((i % 12) + 1)::text,2,'0') || '-' || lpad(((i % 28) + 1)::text,2,'0')),
        'city', city_v,
        'country', country_v,
        'phone', '+880' || (1000000000 + i*7654321)
      ),
      jsonb_build_object(
        'height_cm', height_v,
        'weight_kg', weight_v,
        'eye_color', eyes[1 + (i % array_length(eyes,1))],
        'hair_color', hairs[1 + (i % array_length(hairs,1))],
        'skin_tone', skins[1 + (i % array_length(skins,1))],
        'build', builds[1 + (i % array_length(builds,1))],
        'shoe_size_eu', 36 + (i % 11),
        'chest_cm', 80 + (i % 30),
        'waist_cm', 60 + (i % 35),
        'hips_cm', 80 + (i % 30),
        'tattoos', (ARRAY['None','Small on forearm','Sleeve','Back piece'])[1 + (i % 4)],
        'piercings', (ARRAY['None','Ears','Nose'])[1 + (i % 3)]
      ),
      jsonb_build_object(
        'acting_styles', to_jsonb(ARRAY['Method','Meisner','Classical','Improv','Physical']),
        'special_skills', to_jsonb(ARRAY[
          skills_pool[1 + (i % array_length(skills_pool,1))],
          skills_pool[1 + ((i+2) % array_length(skills_pool,1))],
          skills_pool[1 + ((i+5) % array_length(skills_pool,1))],
          skills_pool[1 + ((i+7) % array_length(skills_pool,1))]
        ]),
        'accents', to_jsonb(ARRAY[
          accents_pool[1 + (i % array_length(accents_pool,1))],
          accents_pool[1 + ((i+1) % array_length(accents_pool,1))]
        ]),
        'instruments', to_jsonb(ARRAY[(ARRAY['Guitar','Piano','Drums','Flute','Violin','None'])[1 + (i % 6)]]),
        'sports', to_jsonb(ARRAY['Football','Cricket','Tennis','Swimming','Yoga'])
      ),
      jsonb_build_object(
        'primary', native_v,
        'fluent', to_jsonb(ARRAY[native_v, langs[1 + ((i+1) % array_length(langs,1))], langs[1 + ((i+3) % array_length(langs,1))]]),
        'conversational', to_jsonb(ARRAY[langs[1 + ((i+5) % array_length(langs,1))], langs[1 + ((i+7) % array_length(langs,1))]])
      ),
      jsonb_build_object(
        'years', 2 + (i % 18),
        'credits', jsonb_build_array(
          jsonb_build_object('title', (ARRAY['The','A','Echoes of','Shadows of','Beyond'])[1 + (i % 5)] || ' ' || (ARRAY['Dawn','Silence','Truth','Rain','Fire','Memory'])[1 + (i % 6)],
            'type', prod_types[1 + (i % array_length(prod_types,1))],
            'role', roles_pool[1 + (i % array_length(roles_pool,1))],
            'year', 2015 + (i % 11),
            'director', first_m[1 + (i % array_length(first_m,1))] || ' ' || last_n[1 + (i % array_length(last_n,1))]),
          jsonb_build_object('title', (ARRAY['The','A','Echoes of','Shadows of','Beyond'])[1 + ((i+1) % 5)] || ' ' || (ARRAY['Dawn','Silence','Truth','Rain','Fire','Memory'])[1 + ((i+2) % 6)],
            'type', prod_types[1 + ((i+1) % array_length(prod_types,1))],
            'role', roles_pool[1 + ((i+1) % array_length(roles_pool,1))],
            'year', 2015 + ((i+1) % 11),
            'director', first_f[1 + (i % array_length(first_f,1))] || ' ' || last_n[1 + ((i+2) % array_length(last_n,1))]),
          jsonb_build_object('title', (ARRAY['The','A','Echoes of','Shadows of','Beyond'])[1 + ((i+3) % 5)] || ' ' || (ARRAY['Dawn','Silence','Truth','Rain','Fire','Memory'])[1 + ((i+4) % 6)],
            'type', prod_types[1 + ((i+2) % array_length(prod_types,1))],
            'role', roles_pool[1 + ((i+2) % array_length(roles_pool,1))],
            'year', 2015 + ((i+2) % 11),
            'director', first_m[1 + ((i+2) % array_length(first_m,1))] || ' ' || last_n[1 + ((i+4) % array_length(last_n,1))])
        ),
        'training', jsonb_build_array(
          jsonb_build_object('institute', (ARRAY['NSD','FTII','RADA','Stella Adler Studio','Local Workshop'])[1 + (i % 5)],
            'program', (ARRAY['Acting Diploma','Method Acting','Voice & Speech','Camera Acting'])[1 + (i % 4)],
            'year', 2010 + (i % 14))
        )
      ),
      jsonb_build_object(
        'agency', agencies[1 + (i % array_length(agencies,1))],
        'manager_name', first_f[1 + (i % array_length(first_f,1))] || ' ' || last_n[1 + (i % array_length(last_n,1))],
        'email', 'agent' || i || '@example.com',
        'phone', '+880' || (1700000000 + i*1234)
      ),
      jsonb_build_object(
        'available_from', '2026-01-01',
        'travel', (ARRAY['Local only','Domestic','International','Anywhere'])[1 + (i % 4)],
        'relocation', (i % 2 = 0),
        'notice_days', (ARRAY[7,14,30])[1 + (i % 3)]
      ),
      jsonb_build_object(
        'terms_accepted', true,
        'data_consent', true,
        'publicity_consent', true,
        'accepted_at', '2026-05-23T00:00:00Z'
      ),
      jsonb_build_object(
        'instagram', '@' || lower(regexp_replace(stage, '[^a-zA-Z0-9]+','-','g')),
        'imdb', CASE WHEN i % 2 = 0 THEN 'nm' || (1000000 + i*9876) ELSE NULL END,
        'showreel', CASE WHEN i % 2 = 0 THEN 'https://vimeo.com/' || (100000000 + i*123457) ELSE NULL END,
        'notes', (ARRAY['Open to international projects.','Prefers dramatic roles.','Strong commercial portfolio.','Available for long-form series.'])[1 + (i % 4)]
      ),
      'published', true, true, true, is_vip, is_feat, feat_order,
      now(), now(), now(), now()
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END
$migration$;
