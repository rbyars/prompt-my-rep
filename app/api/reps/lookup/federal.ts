const API_KEY = process.env.CONGRESS_GOV_API_KEY;

// --- SHARED HELPER: Fetch raw list from Congress.gov ---
async function fetchMembersForState(state: string) {
  if (!API_KEY) {
    console.error("❌ Federal Error: Missing CONGRESS_GOV_API_KEY");
    return [];
  }
  
  const url = `https://api.congress.gov/v3/member/${state}?api_key=${API_KEY}&currentMember=true&limit=250&format=json`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.members || [];
  } catch (e) {
    console.error("❌ Federal Fetch Exception:", e);
    return [];
  }
}

// --- SHARED HELPER: Fetch Details ---
async function fetchMemberDetails(bioguideId: string) {
  const url = `https://api.congress.gov/v3/member/${bioguideId}?api_key=${API_KEY}&format=json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.member || null;
  } catch (e) {
    return null;
  }
}

// --- SHARED HELPER: Normalize ---
function normalizeMember(basicData: any, detailData: any, role: string, district: string) {
  let phone = null;
  let website = basicData.url || null;

  if (detailData?.addressInformation?.phoneNumber) {
    phone = detailData.addressInformation.phoneNumber;
  }

  if (!phone && detailData?.terms?.item) {
    const items = Array.isArray(detailData.terms.item) ? detailData.terms.item : [detailData.terms.item];
    const lastTerm = items[items.length - 1];
    if (lastTerm.phone) phone = lastTerm.phone;
    if (lastTerm.url) website = lastTerm.url;
  }

  return {
    name: basicData.name,
    role: role,
    level: "federal",
    party: basicData.partyName,
    state: basicData.state,
    district: district,
    photo_url: basicData.depiction?.imageUrl || null,
    bioguide_id: basicData.bioguideId,
    phone: phone,
    website: website
  };
}

// --- EXPORT 1: House Rep ---
export async function getHouseRep(state: string, district: string) {
  const members = await fetchMembersForState(state);
  
  const rep = members.find((m: any) => {
    if (m.district && String(m.district) === String(district)) return true;
    if (m.terms && m.terms.item) {
      const items = Array.isArray(m.terms.item) ? m.terms.item : [m.terms.item];
      const latest = items[items.length - 1];
      if (latest?.chamber === "House" && String(latest.district) === String(district)) return true;
    }
    return false;
  });

  if (!rep) {
    console.warn(`⚠️ Federal: No House rep found for ${state}-${district}`);
    return null;
  }

  const details = await fetchMemberDetails(rep.bioguideId);
  return normalizeMember(rep, details, "Representative", district);
}

// --- EXPORT 2: Senators ---
export async function getSenators(state: string) {
  const members = await fetchMembersForState(state);

  const senators = members.filter((m: any) => {
    if (m.terms && m.terms.item) {
      const items = Array.isArray(m.terms.item) ? m.terms.item : [m.terms.item];
      const latest = items[items.length - 1];
      return latest?.chamber === "Senate";
    }
    return m.chamber === "Senate";
  });

  const detailedSenators = await Promise.all(
    senators.map(async (s: any) => {
        const details = await fetchMemberDetails(s.bioguideId);
        return normalizeMember(s, details, "Senator", "Statewide");
    })
  );

  return detailedSenators;
}