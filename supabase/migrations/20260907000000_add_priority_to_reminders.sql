alter table public.reminders
    add column if not exists priority text;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'reminders_priority_check'
          and conrelid = 'public.reminders'::regclass
    ) then
        alter table public.reminders
            add constraint reminders_priority_check
            check (priority is null or priority in ('low', 'medium', 'high'));
    end if;
end $$;
