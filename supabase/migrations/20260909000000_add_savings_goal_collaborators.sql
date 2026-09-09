create table if not exists public.savings_goal_collaborators (
    savings_goal_id uuid not null references public.savings_goals(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default timezone('utc', now()),
    primary key (savings_goal_id, user_id)
);

create index if not exists savings_goal_collaborators_user_id_idx
    on public.savings_goal_collaborators(user_id);

create or replace function public.prevent_savings_goal_owner_change()
returns trigger
language plpgsql
as $$
begin
    if new.user_id is distinct from old.user_id then
        raise exception 'Savings goal ownership cannot be changed';
    end if;

    return new;
end;
$$;

drop trigger if exists savings_goals_user_id_immutable on public.savings_goals;
create trigger savings_goals_user_id_immutable
    before update on public.savings_goals
    for each row
    execute function public.prevent_savings_goal_owner_change();

alter table public.savings_goals enable row level security;
alter table public.savings_goal_collaborators enable row level security;

drop policy if exists "Collaborators can view memberships" on public.savings_goal_collaborators;
create policy "Collaborators can view memberships"
    on public.savings_goal_collaborators
    for select
    to authenticated
    using (
        auth.uid() = user_id
        or exists (
            select 1
            from public.savings_goals
            where savings_goals.id = savings_goal_id
              and savings_goals.user_id = auth.uid()
        )
    );

drop policy if exists "Users can accept their own invitations" on public.savings_goal_collaborators;
create policy "Users can accept their own invitations"
    on public.savings_goal_collaborators
    for insert
    to authenticated
    with check (
        auth.uid() = user_id
        and exists (
            select 1
            from public.savings_goal_invitations
            where savings_goal_invitations.goal_id = savings_goal_id
              and savings_goal_invitations.status = 'accepted'
              and lower(savings_goal_invitations.invitee_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    );

drop policy if exists "Users can leave or remove memberships" on public.savings_goal_collaborators;
create policy "Users can leave or remove memberships"
    on public.savings_goal_collaborators
    for delete
    to authenticated
    using (
        auth.uid() = user_id
        or exists (
            select 1
            from public.savings_goals
            where savings_goals.id = savings_goal_id
              and savings_goals.user_id = auth.uid()
        )
    );

grant select, insert, delete on public.savings_goal_collaborators to authenticated;

create or replace function public.is_savings_goal_collaborator(target_goal_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select exists (
        select 1
        from public.savings_goal_collaborators
        where savings_goal_id = target_goal_id
          and user_id = target_user_id
    );
$$;

revoke all on function public.is_savings_goal_collaborator(uuid, uuid) from public;
grant execute on function public.is_savings_goal_collaborator(uuid, uuid) to authenticated;

drop policy if exists "Collaborators can view shared savings goals" on public.savings_goals;
create policy "Collaborators can view shared savings goals"
    on public.savings_goals
    for select
    to authenticated
    using (
        user_id = auth.uid()
        or (
            is_shared = true
            and public.is_savings_goal_collaborator(id, auth.uid())
        )
    );

drop policy if exists "Collaborators can update shared savings goals" on public.savings_goals;
create policy "Collaborators can update shared savings goals"
    on public.savings_goals
    for update
    to authenticated
    using (
        user_id = auth.uid()
        or (
            is_shared = true
            and public.is_savings_goal_collaborator(id, auth.uid())
        )
    )
    with check (
        user_id = auth.uid()
        or (
            is_shared = true
            and public.is_savings_goal_collaborator(id, auth.uid())
        )
    );

create or replace function public.stop_savings_goal_sharing(p_goal_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    if auth.uid() is null
       or not exists (
            select 1
            from public.savings_goals
            where id = p_goal_id
              and user_id = auth.uid()
       ) then
        raise exception 'Not authorized to update this goal';
    end if;

    delete from public.savings_goal_collaborators
    where savings_goal_id = p_goal_id
      and user_id <> auth.uid();

    delete from public.savings_goal_invitations
    where goal_id = p_goal_id
      and lower(inviter_email) = lower(coalesce(auth.jwt() ->> 'email', ''));

    update public.savings_goals
    set is_shared = false,
        partner_email = null
    where id = p_goal_id
      and user_id = auth.uid();
end;
$$;

revoke all on function public.stop_savings_goal_sharing(uuid) from public;
grant execute on function public.stop_savings_goal_sharing(uuid) to authenticated;

create or replace function public.reset_user_finance_data(p_user_id uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    if auth.uid() is null
       or auth.uid() <> p_user_id
       or lower(coalesce(auth.jwt() ->> 'email', '')) <> lower(coalesce(p_email, '')) then
        raise exception 'Not authorized to reset this account';
    end if;

    delete from public.savings_goal_invitations
    where lower(inviter_email) = lower(p_email)
       or lower(invitee_email) = lower(p_email);

    delete from public.savings_goal_collaborators
    where user_id = p_user_id
       or savings_goal_id in (
            select id
            from public.savings_goals
            where user_id = p_user_id
       );

    delete from public.transactions where user_id = p_user_id;
    delete from public.recurring_rules where user_id = p_user_id;
    delete from public.category_budgets where user_id = p_user_id;
    delete from public.reminders where user_id = p_user_id;
    delete from public.savings_goals where user_id = p_user_id;
    delete from public.wallets where user_id = p_user_id;
end;
$$;

revoke all on function public.reset_user_finance_data(uuid, text) from public;
grant execute on function public.reset_user_finance_data(uuid, text) to authenticated;
