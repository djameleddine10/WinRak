-- ─── Passenger Wallet ────────────────────────────────────────────────────────
-- Ensure wallet columns exist on the passengers table
alter table if exists passengers
  add column if not exists wallet_balance numeric(12,2) not null default 0,
  add column if not exists wallet_points  integer       not null default 0;

-- get_passenger_wallet: returns balance + points for a passenger
create or replace function get_passenger_wallet(p_user_id uuid)
returns table (balance numeric, points integer)
language sql security definer as $$
  select wallet_balance as balance, wallet_points as points
  from passengers
  where id = p_user_id
  limit 1;
$$;

-- get_passenger_transactions: returns the last 100 transactions
create or replace function get_passenger_transactions(p_user_id uuid)
returns table (
  id         uuid,
  type       text,
  label_key  text,
  vars       jsonb,
  amount     numeric,
  method     text,
  created_at timestamptz
)
language sql security definer as $$
  select id, type, label_key, vars, amount, method, created_at
  from transactions
  where user_id = p_user_id
  order by created_at desc
  limit 100;
$$;

-- wallet_topup: credit the passenger's wallet and log a transaction
create or replace function wallet_topup(p_user_id uuid, p_amount numeric)
returns void
language plpgsql security definer as $$
begin
  update passengers
  set wallet_balance = wallet_balance + p_amount
  where id = p_user_id;

  insert into transactions (user_id, type, label_key, amount, method)
  values (p_user_id, 'credit', 'wallet.tx.topup', p_amount, 'wallet');
end;
$$;

-- wallet_charge: debit the passenger's wallet and log a transaction
create or replace function wallet_charge(
  p_user_id   uuid,
  p_amount    numeric,
  p_label_key text,
  p_vars      jsonb  default null,
  p_method    text   default 'wallet'
)
returns void
language plpgsql security definer as $$
begin
  if p_method = 'wallet' then
    update passengers
    set wallet_balance = wallet_balance - p_amount
    where id = p_user_id;
  end if;

  insert into transactions (user_id, type, label_key, vars, amount, method)
  values (p_user_id, 'debit', p_label_key, p_vars, p_amount, p_method);
end;
$$;

-- ─── Transactions table (if not yet created) ─────────────────────────────────
create table if not exists transactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  type       text not null check (type in ('debit','credit')),
  label_key  text not null,
  vars       jsonb,
  amount     numeric(12,2) not null,
  method     text not null default 'wallet',
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_idx on transactions(user_id, created_at desc);

-- RLS: users can only see their own transactions
alter table transactions enable row level security;
drop policy if exists "transactions_own" on transactions;
create policy "transactions_own" on transactions
  for select using (auth.uid() = user_id);

-- ─── Driver Performance ───────────────────────────────────────────────────────
-- get_driver_performance: total trips + current level + rating for the performance screen
create or replace function get_driver_performance(p_driver_id uuid)
returns table (total_trips integer, level text, rating numeric)
language sql security definer as $$
  select
    coalesce(total_trips, 0)::integer as total_trips,
    coalesce(level, 'bronze')         as level,
    coalesce(rating, 5.0)             as rating
  from drivers
  where id = p_driver_id
  limit 1;
$$;

-- ─── Delivery orders: courier assignment column ───────────────────────────────
alter table if exists delivery_orders
  add column if not exists driver_id  uuid references drivers(id),
  add column if not exists eta_min    integer;

-- Realtime: allow passengers to subscribe to their own delivery order updates
drop policy if exists "delivery_orders_passenger_read" on delivery_orders;
create policy "delivery_orders_passenger_read" on delivery_orders
  for select using (auth.uid() = passenger_id);
