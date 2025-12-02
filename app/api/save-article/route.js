import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function OPTIONS(request) {
  const origin = request.headers.get('origin');
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

export async function POST(request) {
  // 1. Get cookies properly (Next.js 15 requires await)
  const cookieStore = await cookies();
  const origin = request.headers.get('origin');

  // 2. Set up headers so the Extension is allowed to read the response
  const headers = {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };

  // 3. Initialize Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value; },
        set(name, value, options) { cookieStore.set({ name, value, ...options }); },
        remove(name, options) { cookieStore.set({ name, value: '', ...options }); },
      },
    }
  );

  try {
    // 4. Check who is logged in
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Please log in at localhost:3000 first.' },
        { status: 401, headers: headers }
      );
    }

    // 5. Get the article data from the request
    const body = await request.json();
    const { title, url, content } = body;

    // 6. Insert it into the database
    const { data, error } = await supabase
      .from('articles')
      .insert([{ 
          user_id: user.id, 
          title: title, 
          url: url, 
          clean_text: content 
      }])
      .select();

    if (error) throw error;

    // 7. Return success
    return NextResponse.json(
      { success: true, data },
      { headers: headers }
    );

  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: headers }
    );
  }
}