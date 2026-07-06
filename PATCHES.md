# PATCHES — реестр отличий форка от upstream

> Ветка `max/main` = upstream-тег `twenty/v2.18.5` (commit `60ef9b2`) + патчи ниже.
>
> **Дисциплина форка** (PHASE2_BRIEF.md §4 в higent-backbone):
> - Всё, что можно — данными/Metadata API, без патчей кода. Код патчим только там,
>   где конструктор Twenty не может (перевод, брендинг, выпил экранов).
> - Каждый патч = отдельный коммит + строка в таблице ниже.
> - Enterprise-файлы (303 шт., маркер `/* @license Enterprise */`) не активируем и не модифицируем.
> - Синк с upstream: security-фиксы — сразу; остальное — перед крупными своими фичами.
>
> **Сборка:** GitHub Actions → `ghcr.io/roscorr/twenty` (workflow `build-fork-image`).
> Локально на Mac1 не собирается и не клонируется (диск/RAM).

| # | Дата | Коммит | Что | Зачем | Файлы |
|---|---|---|---|---|---|
| 0 | 2026-07-07 | — | Инфраструктура форка: реестр патчей + CI-сборка образа | своя сборка в GHCR, без патчей ядра | `PATCHES.md`, `.github/workflows/build-fork-image.yaml` |
| 1 | 2026-07-07 | `bc0b1b8` | CI-hardening: tag через env в manifest job + regex-валидация inputs.tag | injection-фикс по независимому ревью | `.github/workflows/build-fork-image.yaml` |
| 2 | 2026-07-07 | `cd9ea0a` | Доперевод ru-RU: +174 строки рабочих экранов (79.7%→85.1% фронта) | русские рабочие экраны (D3) | `packages/twenty-front/src/locales/ru-RU.po` |
| 3 | 2026-07-07 | — | CI: APP_VERSION = semver (`<pkg-version>-<tag>`) — конфиг-валидатор Twenty отвергает не-semver; до этого фикса рантайм-override `APP_VERSION=2.18.5` в `~/twenty/.env` на Mac2 | образ бутится без env-костыля | `.github/workflows/build-fork-image.yaml` |

## Примечание Ф1 (2026-07-07)

Прод на Mac2 пока крутит **официальный** образ `twentycrm/twenty:v2.18.5` — содержательных
патчей кода ещё нет, свой образ не нужен. Переключение на `ghcr.io/roscorr/twenty:<tag>` —
сменой `TAG` в `~/twenty/.env` на Mac2, когда появится первый содержательный патч
(план: Ф5 — доперевод `ru-RU.po`).
