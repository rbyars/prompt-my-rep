const API_KEY = process.env.OPENSTATES_API_KEY;

// --- SHARED HELPER ---
async function fetchOpenStates(endpoint: string, params: URLSearchParams) {
  if (!API_KEY) return [];
  
  const url = `https://v3.openstates.org/${endpoint}?${params.toString()}`;
  try {
    const res = await fetch(url, { 
        headers: { 'X-API-KEY': API_KEY } // Some endpoints prefer header auth
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    return [];
  }
}

function normalizeStateRep(person: any, role: string, stateAbbr: string, districtNum: string) {
    let phone = null;
    let email = person.email || null;

    if (person.offices && person.offices.length > 0) {
        const office = person.offices.find((o: any) => o.classification === 'capitol') 
                    || person.offices.find((o: any) => o.classification === 'district')
                    || person.offices[0];
        
        if (office.voice) phone = office.voice;
        if (!email && office.email) email = office.email;
    }

    return {
      name: person.name,
      role: role,
      level: "state",
      party: person.party,
      state: stateAbbr,
      district: districtNum,
      photo_url: person.image || null,
      email: email, 
      phone: phone, 
      website: person.links?.[0]?.url || null 
    };
}

// --- EXPORT 1: Legislator ---
export async function getStateRep(stateAbbr: string, districtNum: string, chamber: 'upper' | 'lower') {
  if (!districtNum) return null;

  const state = stateAbbr.toLowerCase();
  const cleanDistrict = parseInt(districtNum, 10).toString(); 
  const jurisdiction = `ocd-jurisdiction/country:us/state:${state}/government`;

  // Search People directly for Legislators
  const params = new URLSearchParams({
    jurisdiction: jurisdiction,
    district: cleanDistrict,
    org_classification: chamber, 
    include: 'offices' 
  });

  const results = await fetchOpenStates('people', params);
  if (results.length === 0) return null;

  const person = results[0];
  console.log(`✅ State Success: Found ${person.name}`);
  const roleName = chamber === 'upper' ? "State Senator" : "State Representative";
  
  return normalizeStateRep(person, roleName, stateAbbr, cleanDistrict);
}

// --- EXPORT 2: Governor (Smart Lookup) ---
export async function getGovernor(stateAbbr: string) {
  const state = stateAbbr.toLowerCase();
  const jurisdiction = `ocd-jurisdiction/country:us/state:${state}/government`;

  console.log(`🏛️ Fetching Governor for ${stateAbbr}...`);

  // STRATEGY A: Direct Person Search (Fastest, but fails for some states)
  let params = new URLSearchParams({
    jurisdiction: jurisdiction,
    org_classification: 'executive',
    include: 'offices'
  });

  let results = await fetchOpenStates('people', params);
  let governor = results.find((p: any) => p.current_role?.title?.toLowerCase().includes('governor'));

  // STRATEGY B: Organization Search (Robust fallback)
  // If Strategy A failed, find the "Executive" org first, then find its members
  if (!governor) {
    // 1. Find the Executive Org ID
    const orgParams = new URLSearchParams({
        jurisdiction: jurisdiction,
        classification: 'executive'
    });
    const orgs = await fetchOpenStates('organizations', orgParams);
    
    // Look for an org named "Governor" or just take the first executive org
    const govOrg = orgs.find((o: any) => o.name.toLowerCase().includes('governor')) || orgs[0];

    if (govOrg) {
        // 2. Find people in that Org
        const peopleParams = new URLSearchParams({
            org_id: govOrg.id,
            include: 'offices'
        });
        const people = await fetchOpenStates('people', peopleParams);
        governor = people.find((p: any) => p.current_role?.title?.toLowerCase().includes('governor')) || people[0];
    }
  }

  if (!governor) {
    console.warn(`⚠️ State Warning: No Governor found for ${stateAbbr} (OpenStates data missing)`);
    return null;
  }

  console.log(`✅ State Success: Found Gov. ${governor.name}`);
  return normalizeStateRep(governor, "Governor", stateAbbr, "Statewide");
}