---
name: Auth gate (try before committing)
description: Auth required only before Dashboard; steps 1-4 open; email+Google login
type: feature
---
Реализована стратегия «Try before committing»:
- Шаги Landing, Goal, BrainDump, Filtering доступны без авторизации.
- Dashboard, WeeklyReport, Mentorship защищены через ProtectedRoute → /auth.
- Авторизация: email+пароль и Google OAuth (через lovable.auth.signInWithOAuth).
- Данные остаются в localStorage (не в облаке).
- Auto-confirm email отключён — пользователь подтверждает почту по ссылке.
