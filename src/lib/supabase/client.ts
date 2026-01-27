import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Create client (will be null if not configured)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null

// Server-side client with service role key
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    return null
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Types for philosophy chunks table
export interface PhilosophyChunk {
  id: string
  block_id: string
  theme: string
  title: string
  content: string
  keywords: string[]
  embedding?: number[]
  created_at: string
}

// SQL for creating the table (run in Supabase SQL editor):
/*
-- Enable pgvector extension
create extension if not exists vector;

-- Create philosophy_chunks table
create table philosophy_chunks (
  id uuid default gen_random_uuid() primary key,
  block_id text not null unique,
  theme text not null,
  title text not null,
  content text not null,
  keywords text[] default '{}',
  embedding vector(1536),
  created_at timestamp with time zone default now()
);

-- Create index for vector similarity search
create index on philosophy_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Create index for keyword search
create index idx_philosophy_chunks_keywords on philosophy_chunks using gin(keywords);

-- Function for similarity search
create or replace function match_philosophy_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  block_id text,
  theme text,
  title text,
  content text,
  keywords text[],
  similarity float
)
language sql stable
as $$
  select
    id,
    block_id,
    theme,
    title,
    content,
    keywords,
    1 - (embedding <=> query_embedding) as similarity
  from philosophy_chunks
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
*/
