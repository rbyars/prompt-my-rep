import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js'; 
import { cookies } from 'next/headers';
import { getHouseRep, getSenators } from './federal'; // Removed President
import { getStateRep } from './state'; // Removed Governor

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabaseUserClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {}
          },
        },
      }
    )
    const { data: { user } } = await supabaseUserClient.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json();
    const { address } = body;

    if (!address) return NextResponse.json({ error: "Address is required" }, { status: 400 });

    console.log("--- API: Looking up Districts for:", address);

    // STEP 1: Census Geocoder
    const params = new URLSearchParams({
      address: address,
      benchmark: 'Public_AR_Current',
      vintage: 'Current_Current', 
      format: 'json',
      layers: '54,56,58' 
    });

    const censusUrl = `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?${params.toString()}`;
    const censusResponse = await fetch(censusUrl);
    const censusData = await censusResponse.json();

    const matches = censusData?.result?.addressMatches;
    if (!matches || matches.length === 0) {
      return NextResponse.json({ found: false, error: "Address not found in Census database." });
    }

    const match = matches[0];
    const geo = match.geographies;
    const stateAbbr = match.addressComponents?.state;

    if (!stateAbbr) return NextResponse.json({ found: false, error: "Could not determine state." });

    const districts = {
      federal: {
        district: extractValue(geo, ['Congress'], 'BASENAME'),
        label: extractValue(geo, ['Congress'], 'NAME')
      },
      state_upper: {
        district: extractValue(geo, ['State', 'Upper'], 'BASENAME') || extractValue(geo, ['State', 'Senate'], 'BASENAME'),
        label: extractValue(geo, ['State', 'Upper'], 'NAME')
      },
      state_lower: {
        district: extractValue(geo, ['State', 'Lower'], 'BASENAME') || extractValue(geo, ['State', 'House'], 'BASENAME'),
        label: extractValue(geo, ['State', 'Lower'], 'NAME')
      }
    };

    console.log(`--- Census Found: ${stateAbbr} ---`);

    // STEP 2: Parallel Lookup (Legislators Only)
    const results = await Promise.allSettled([
        getHouseRep(stateAbbr, districts.federal.district),
        getSenators(stateAbbr), 
        getStateRep(stateAbbr, districts.state_lower.district, 'lower'),
        getStateRep(stateAbbr, districts.state_upper.district, 'upper')
    ]);

    const allReps: any[] = [];
    
    results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
            if (Array.isArray(result.value)) {
                allReps.push(...result.value); 
            } else {
                allReps.push(result.value); 
            }
        } else if (result.status === 'rejected') {
            console.error("Lookup Failed:", result.reason);
        }
    });

    const savedReps = [];

    // STEP 3: Save to DB
    console.log(`💾 Saving ${allReps.length} reps to database...`);

    for (const rep of allReps) {
      let matchQuery = supabaseAdmin.from('representatives').select('id');
      
      if (rep.bioguide_id) {
        matchQuery = matchQuery.eq('bioguide_id', rep.bioguide_id);
      } else {
        matchQuery = matchQuery
            .eq('name', rep.name)
            .eq('state', rep.state)
            .eq('role', rep.role);
      }
      
      const { data: savedRep } = await matchQuery.maybeSingle();
      let repId = savedRep?.id;

      if (!repId) {
        const { data: newRep, error: insertError } = await supabaseAdmin
          .from('representatives')
          .insert(rep)
          .select('id')
          .single();
        
        if (insertError) {
            console.error(`❌ Error inserting ${rep.name}:`, insertError);
            continue; 
        } 
        repId = newRep.id;
      } else {
         await supabaseAdmin.from('representatives').update(rep).eq('id', repId);
      }

      if (repId) {
        await supabaseAdmin.from('user_reps').upsert({
          user_id: user.id,
          rep_id: repId,
          is_primary: true
        }, { onConflict: 'user_id,rep_id' });
        
        savedReps.push({ ...rep, id: repId });
      }
    }

    return NextResponse.json({ 
        found: true, 
        state: stateAbbr,
        saved_count: savedReps.length,
        districts
    });

  } catch (error: any) {
    console.error("Lookup Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function extractValue(geoObj: any, searchTerms: string[], valueKey: string) {
  if (!geoObj) return null;
  const keys = Object.keys(geoObj);
  const realKey = keys.find(k => 
    searchTerms.every(term => k.toLowerCase().includes(term.toLowerCase()))
  );
  if (!realKey || !geoObj[realKey] || geoObj[realKey].length === 0) return null;
  return geoObj[realKey][0][valueKey];
}