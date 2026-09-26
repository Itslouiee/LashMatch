# LashMatch local setup

Open **http://localhost:8080/** in Chrome's address bar.
Double-click **START-LASHMATCH.cmd** whenever the local website is stopped.
Keep MySQL running in the XAMPP Control Panel at `C:\xamppppp\xampp-control.exe`.
The launcher serves this project directly; it does not need to be copied to htdocs.

## Client and admin

Both use the same `lashmatch` MySQL database and the same login page.

- Client: http://localhost:8080/login.html
- Admin: http://localhost:8080/login.html?role=admin
- Admin dashboard: http://localhost:8080/admin/admin.html

Ordinary signups always create client accounts. Selecting Admin at login does not
grant permissions. An admin can switch to the client pages using Open client side;
the client sidebar includes Admin Dashboard for authorized admins.

The fixed administrator account is `LashMatch.bmy@gmail.com`. Use the password
provided by the project owner; its hash is stored in MySQL. No admin registration
is needed. The earlier one-time setup link has been revoked. Ordinary signups
cannot create administrator accounts.

## Shared data

- Admin users/results show real registered accounts, quiz answers, recommendations,
  and saved favorites. The dashboard refreshes every 15 seconds while visible.
- Completed preference quizzes save automatically; retries reuse the same result.
- Client results and favorite looks/studios persist across logins in MySQL.
- Studio names, descriptions, contact details, services, locations, and visibility
  edited by admins appear in the client directory when it is loaded or refreshed.
- Deactivating a client blocks login and subsequent authenticated requests.
- Admin recommendation rules control which of the four supported styles each
  volume choice produces. Changes affect new quizzes, preserving existing results.
- Style descriptions edited by admins appear in client recommendations.

The client studio map uses only provided coordinates. Distances are calculated from
the client's permitted browser location. Seed studio listings remain marked as samples;
ratings and reviews are not fabricated.

## Database installation

The current computer already has the `lashmatch` database. For a new machine,
import `database.sql`, then run `php migrate.php` before opening the site.
The launcher also runs this additive migration, preserving existing records.

`config.php` defaults to `127.0.0.1:3306`, database `lashmatch`, root, no password.
Override using `LASHMATCH_DB_HOST`, `LASHMATCH_DB_PORT`, `LASHMATCH_DB_NAME`,
`LASHMATCH_DB_USER`, and `LASHMATCH_DB_PASSWORD` environment variables.

Connection check: `C:\xamppppp\php\php.exe check-database.php`.
Manual web server: `C:\xamppppp\php\php.exe -S localhost:8080 -t .`.
Server diagnostics: `lashmatch-server-error.log`.

## Verification

`php tests/integration.php` tests shared records, authorization, CSRF, account
deactivation, recommendations, favorites, and repeat quiz requests. It restores any
rules/descriptions it touches and deletes its own temporary accounts and studio.

`node tests/browser-check.cjs` exercises the actual admin/client pages in headless
Chrome, including login, quiz completion, studio creation, favorites, and admin
results. It requires the local PHP server and Chrome; its temporary records are
removed after the test. The script contains this computer's PHP/Chrome paths.

## Remaining feature limits

Profile photos and bio remain in browser storage. No booking,
email verification, password recovery, or review collection is implemented.
Admin style editing supports descriptions for Classic, Hybrid, Wispy, and Volume;
adding new try-on renderers is outside this integration. Camera photos stay on the
client and are not uploaded to admins.

## Account activity and service area

New accounts start with empty recommendations, results, favorites, and progress. Completed quizzes and try-ons are read from MySQL; old browser activity is ignored. Run php migrate.php to create tryon_sessions. Photos and bio remain browser-local.

Client studio listings and studio favorites only include active entries with a Cavite city or municipality. Admin studio saves enforce the same location list (https://cavite.gov.ph/directory/). Older out-of-area entries remain available to administrators for correction but are hidden from clients. No real studios are invented when the directory is empty.

Set LASHMATCH_TEST_URL to the project URL when running tests through Apache; browser tests also accept LASHMATCH_PHP and LASHMATCH_BROWSER.

## Original admin layouts

Admin pages retain their original tables, filters, artwork, and side editors. Catalog changes, studio images/capabilities, account status, and password updates use the authenticated API. Run php migrate.php after upgrading. Core quiz styles retain their names/types and remain active; additional styles use Classic, Hybrid, Wispy, or Volume as their Try-On renderer. Display preferences remain local to the administrator browser. Studio ratings and admin photo upload are not implemented.
