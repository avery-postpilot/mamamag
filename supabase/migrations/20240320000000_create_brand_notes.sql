-- Create brand_notes table
create table if not exists brand_notes (
  id uuid default uuid_generate_v4() primary key,
  brand_id uuid references brands(id) on delete cascade,
  note text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id) on delete set null
);

-- Enable RLS
alter table brand_notes enable row level security;

-- Create policies
create policy "Brand notes are viewable by authenticated users"
  on brand_notes for select
  to authenticated
  using (true);

create policy "Brand notes are insertable by authenticated users"
  on brand_notes for insert
  to authenticated
  with check (true);

create policy "Brand notes are updatable by authenticated users"
  on brand_notes for update
  to authenticated
  using (true);

create policy "Brand notes are deletable by authenticated users"
  on brand_notes for delete
  to authenticated
  using (true); 