# Dispatcher handover — 2 November 2026

Root takes exclusive queue/report/script/log ownership when dispatcher sends its final. Until then dispatcher owns those files. Site source was not modified. This file is coordination only, not completion evidence.

## Live agents

- `/root/dispatch_remaining_cards/card_010` — card-010, Google Просвещения20/25, running. Asked to send `/root` a direct completion message in addition to its normal final. Result destination tasks/card-010/result.json.
- `/root/card_021` — external card-021, Yandex Минеральная13Ц. Initial result saved, root resumed SAME agent to exhaust alternative sorts after default cap600 over12pages vs2436header. Still reserved/running; do not assign another agent for021 or infer complete.
- Root explicitly requested immediate handover now, without dispatcher spawning011. Root will spawn card-011 as third actual leaf after dispatcher ends. Only010 is a live dispatcher child.

After handover use canonical live child names with collaboration tools; children are distinct per card. Do not re-use a completed card agent for a different card. `dispatch-log.json` contains exact historical root names plus dispatcher children. It records only agent→card assignments, not review coverage truth. Leaves own coverage in result files.

## Registry and commands

Cwd: `D:/works/projects/lr-remont-noutbykov/artifacts/review-census-2026-11-02/`.

```powershell
node collect.mjs > collect-latest.log
node make-report.mjs > collect-latest.log
node -e "const fs=require('fs'),q=JSON.parse(fs.readFileSync('queue.json'));console.log(q.filter(t=>t.status==='queued').map(t=>[t.taskId,t.platform,t.url]))"
```

Never rerun bootstrap.mjs: it resets IDs. Collection ingests additional-cards.json, discovery/2gis-cards.json, discovery/zoon-cards.json, discovery/root-google-spb-additions.json and every result's discoveredSources. Redmap discovery23 is also copied into additional-cards.json. IDs remain stable. Canonicalization handles Yandexorg IDs,2GIS firm IDs, Zoonreviews suffixes and Flampreview suffixes. Google dedup uses observed `!1s0x...:0x...` feature ID, while retaining observed usable URL;25uniqueGoogleIDs verified. Other Google shortlinks require manual identity verification before adding if nofeatureID.

Latest pre-handover census:200entries,2discovery-only;20results (17complete,3partial);58source review occurrences,57content groups,9photos/5worker-verified author attachments. Re-run scripts after leaves finish; these counts are snapshots, not completeness claims. Collector also ingests discovery/root-google-regions.json:198MoscowРусаковская27closed/unconfirmednetwork,199Novgorodofficialstore27reviews,200Pskovofficialstore0reviews; each still needs a distinct leaf. Moscowquery reached10rowend with only1localbranded card,6SPb,3unrelated: not proof no other Moscow cards exist. Novgorod/Pskovqueries each resolved one officialstore card.

Priority: finish original primary corpora queued card-011 Google; card-016 onward Yandex; Zoon;2GIS;Flamp;Yell; newGoogle179–197; then companywide/catalog/mirror cards. Task IDs are stable; choose using actual status/result existence and exclude live assignments. `/chain/`, `/branches/`, `/review_N.html` discovery-only entries are not leaf cards (currently068/069).

## Export/script changes

- collect.mjs writes original reviews.csv/json as source occurrence ledger and new review-groups.csv/json using only duplicate-verification.json groups with status confirmed_same_review_text. Grouped JSON retains full occurrence objects and allsource links. Assertion prevents losing occurrences and overlapping verified duplicate groups. Root's Space master/Elena group has2members and bothplatformlinks; checked by assert. Groups are repeated content, never an account-identity claim or proven unique customer count.
- make-report.mjs links grouped exports + duplicate-verification.json and coordinator-verification.json. It independently counts matched current photo IDs from root's checks; assert observed5author attachments second-checked. New photos absent from root evidence stay explicitly pending second check. Root exclusively owns coordinator-verification.json; dispatcher did not alter it.
- Report validates local photo containment/existence, copies to content-hash names, and builds photos-index.html. All9 existing files successfully bundled. Source-rejected Albina remains identified as rejected. Photos field flags preserve worker meaning; coordinator checks are separate.

## Discovery evidence and unresolved gaps

- Final two _fresh_ focused gap searches must run after initial queue processed, ingest concrete new URLs and continue until two passes add none. The dispatch-log discoveryPasses array is still empty. Earlier preflight is not a substitute.
- discovery/dispatcher-regional-preflight.md records Moscow historical candidates, Murino two separate Redmap source IDs at same Привокзальная3к4 address, and excluded Pskov jobs-address mixing. MoscowYell143/144 and additional catalog cards are queued. Redmap directory says24SPb entries but two accessible pages yielded23detailURLs;23 queued, no fabricated24th URL. All28network-directory entries are not28confirmedworkshops (duplicate addresses exist).
- Root regional search evidence discovery/root-regional-pass.txt; Novgorod official claim30+cities does not enumerate them and mixes Pskovcontent. Do not convert claim into confirmed cities. Tver/Donetsk remain unverified city mentions; no asserted activebranches. Pskov Рижский26 remains unverified; jobs results excluded. New officialNovgorodhomepagevideo cards may contain nonlocaltestimonials.
- Root GoogleSPb UI search reached explicit «Больше результатов нет»:33rows,25uniqueLenremont cards after duplicate/unrelated exclusions. Six original006–011 plus19new179–197. Candidate197 wronggeocoordinates/noofficialwebsite must have a distinct leaf verify identity, not be counted as confirmed or falsezero. Storecards192/195/196 are distinct records with officialsubdomain links; check relevance truthfully. MineralnayaGoogle0reviewcard remains distinctfromMoscow212Google94; do not adoptFirmateka misattribution.
- New YPcompanywide card152/actualqueueID (readqueue),18reviews; directory11branches is discovery only, source detailhttps://www.yp.ru/detail/id/lenremont_1427505/. Serviced22addresses, SpravochnikaРешетникова3, officialNovgorodhomepage were added. Follow concrete outgoing branchcards if new.

No CAPTCHA/login bypass; source-level partial/blocked is acceptable, queued/undispatched is not finished. Exclude employee reviews/unrelated businesses. Complete only observed endpoint and expanded fulltexts. Zero only actual empty reviewlist, never inference from inaccessible/indexed snippets. Reviewworker screenshots/DOM evidence live under own tasks folders; no cross-card edits.

## Later root updates and publication authorization

User explicitly authorized commit and push to main after the research is finished, without another confirmation. Origin is https://github.com/lenremont2/lr-remont-noutbykov.git . Local branch is master; read-only ls-remote on2November returned only remote master052b05ac607b4ba3d15c1766c6b186c25e74fad3 and no main. Root told user it will create main for publication. Recheck remote before publishing, use no force push, and preserve the many unrelated existing source changes in this shared checkout. Only this research and its own .gitignore cache entry belong to this task. An isolated worktree/release checkout can prepare the research commit without staging other work. No publish action has occurred yet.

Root now owns registry/log/scripts. Registry grew to213 after complete17-branch Yell discovery (root-yell-spb-cards.json). Yell chain page has its own review corpus and is queued213, unlike discovery-only Yandex chain. Collector normalizes Yell HTTP→HTTPS and enriches existing placeholder addresses without overwriting verified worker metadata. Source cities are separately stored for SPb/Колпино.

Readiness check: commit name/email are configured. `git push --dry-run origin HEAD:refs/heads/main` succeeded on2November; this was a dry-run and did not create main. Actual commit/push remain deferred until completion. Before publication audit staged research for account metadata/secrets and avoid publishing raw copied page dumps or temporary full-text working caches; deliverable summaries, source URLs, compact verification manifests and photos are the research output. Preserve raw local research evidence when excluding temporary caches from the commit. Task-relative source photo paths can be normalized after workers finish, preserving IDs/hashes; final photos.csv/json now include portable bundlePath and sha256 fields.

Latest root-verified photo corpus:13files,9author attachments+4company-reply images. New Oleg Sergushev1 and Alexandra Gavrilova3 from card021 negative sort were independently checked in exact source DOM and opened locally; coordinator-verification.json updated. card021 ongoing allsort union, intermediate result includes7relevant/4photos; do not replace it with old600 default-sort snapshot. Root verifies new files before final inclusion.
