import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { resolve, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
const base = new URL("./", import.meta.url);
const photoPath = (p, folder) =>
  p
    ? isAbsolute(p)
      ? p
      : resolve(
          fileURLToPath(
            p.startsWith("artifacts/")
              ? new URL("../../", base)
              : new URL("tasks/" + folder + "/", base),
          ),
          p,
        )
    : null;
const read = (p) => JSON.parse(readFileSync(new URL(p, base), "utf8"));
const queue = read("queue.json");
const results = readdirSync(new URL("tasks/", base), { withFileTypes: true })
  .filter(
    (e) =>
      e.isDirectory() &&
      existsSync(new URL("tasks/" + e.name + "/result.json", base)),
  )
  .map((e) => ({
    folder: e.name,
    ...read("tasks/" + e.name + "/result.json"),
  }));
const canonical = (raw) => {
  const u = new URL(raw);
  u.hash = "";
  if (/(^|\.)yell\.ru$/.test(u.hostname)) u.protocol = "https:";
  if (u.hostname.endsWith("flamp.ru"))
    u.pathname = u.pathname.replace(/\/otzyv-\d+\/?$/, "");
  const m = u.pathname.match(/\/org\/lenremont\/(\d+)/);
  const g =
    u.hostname === "2gis.ru" && u.pathname.match(/^\/([^/]+)\/firm\/(\d+)/);
  if (g) return "https://2gis.ru/" + g[1] + "/firm/" + g[2] + "/tab/reviews";
  if (/^yandex\./.test(u.hostname) && m)
    return "https://yandex.ru/maps/org/lenremont/" + m[1] + "/reviews/";
  if (u.hostname === "zoon.ru")
    u.pathname = u.pathname.replace(/(?:reviews|price)\/$/, "");
  return u.href;
};
const discoveryOnly = (raw) =>
  /\/branches\/|\/review_\d+\.html/.test(raw) ||
  (/(^|\.)otzyvru\.com$/.test(new URL(raw).hostname) &&
    /\/review-\d+(?:\/|$)/.test(new URL(raw).pathname)) ||
  (/\/chain\//.test(raw) && !/(^|\.)yell\.ru$/.test(new URL(raw).hostname));
assert.equal(
  discoveryOnly("https://www.yell.ru/spb/chain/lenremont-ooo_9625417/"),
  false,
  "Yell chain page has its own review corpus",
);
assert.equal(
  discoveryOnly(
    "https://yandex.ru/maps/2/saint-petersburg/chain/lenremont/3503425074/",
  ),
  true,
);
assert.equal(
  discoveryOnly("https://www.otzyvru.com/lenremont/review-2017163"),
  true,
  "Individual review link remains evidence, not another company-card assignment",
);
const sourceKey = (raw) => {
  const url = canonical(raw),
    u = new URL(url),
    org = /\/org\/(?:[^/]+\/)?(\d+)(?:\/|$)/.exec(u.pathname),
    feature = /(?:!|%21)1s(0x[\da-f]+(?::|%3a)0x[\da-f]+)/i.exec(url);
  if (/^yandex\./.test(u.hostname) && org) return "yandex-org:" + org[1];
  return /(^|\.)google\./.test(u.hostname) && feature
    ? "google:" + feature[1].replace(/%3a/i, ":").toLowerCase()
    : url;
};
assert.equal(
  sourceKey("https://yandex.com/maps/org/tekhnika_s_utsenkoy/143153493696/"),
  sourceKey("https://yandex.ru/maps/org/143153493696/reviews/"),
  "Same Yandex company ID across aliases/tabs",
);
assert.equal(
  sourceKey(
    "https://www.google.ru/maps/place/Lenremont/data%3D%214m8%213m7%211s0x46963aac51d9151f%3A0x405dec6efcfde4c7",
  ),
  sourceKey(
    "https://www.google.com/maps/place/Lenremont/data=!4m7!3m6!1s0x46963aac51d9151f:0x405dec6efcfde4c7",
  ),
  "Encoded Firmateka link is the same Google card, not another workshop",
);
const seen = new Set(queue.map((x) => sourceKey(x.url)));
const extraDiscoveries = [
  "discovery/root-google-spb-additions.json",
  "discovery/root-google-regions.json",
  "discovery/root-yell-spb-cards.json",
  "discovery/root-social-cards.json",
].flatMap((p) => (existsSync(new URL(p, base)) ? read(p) : []));
for (const x of [
  ...read("additional-cards.json"),
  ...read("discovery/2gis-cards.json"),
  ...read("discovery/zoon-cards.json"),
  ...extraDiscoveries,
  ...results.flatMap((x) => x.discoveredSources ?? []),
]) {
  if (!x.url || !/^https?:/.test(x.url) || discoveryOnly(x.url)) continue;
  const url = canonical(x.url),
    key = sourceKey(url);
  if (seen.has(key)) {
    const existing = queue.find((t) => sourceKey(t.url) === key);
    if (existing.branch === "needs-address-verification")
      existing.branch = x.branch ?? x.address ?? existing.branch;
    if (existing.city == null) existing.city = x.city ?? null;
    continue;
  }
  seen.add(key);
  queue.push({
    taskId: "card-" + String(queue.length + 1).padStart(3, "0"),
    platform: x.platform,
    url,
    branch: x.branch ?? x.address ?? "needs-address-verification",
    city: x.city ?? null,
    status: "queued",
  });
}
const byId = new Map(results.map((x) => [x.taskId, x]));
for (const task of queue) {
  const r = byId.get(task.taskId);
  if (r) {
    task.status = r.coverage.status;
    task.platform = r.platform ?? task.platform;
    task.branch = r.branch;
    task.city = r.city;
  } else if (discoveryOnly(task.url)) {
    task.status = "discovery-only";
  }
}
assert.equal(new Set(queue.map((x) => x.taskId)).size, queue.length);
assert.equal(
  new Set(queue.map((x) => sourceKey(x.url))).size,
  queue.length,
  "One task per source card",
);
writeFileSync(
  new URL("queue.json", base),
  JSON.stringify(queue, null, 2) + "\n",
);
const reviews = [];
const keys = new Map();
for (const r of results) {
  assert.ok(
    ["complete", "partial", "blocked"].includes(r.coverage.status),
    r.taskId,
  );
  for (const review of r.reviews ?? []) {
    assert.ok(
      (review.author === null ||
        (typeof review.author === "string" && review.author.trim())) &&
        typeof review.summary === "string" &&
        review.summary.trim(),
      r.taskId,
    );
    assert.ok(
      review.rating == null || (review.rating >= 1 && review.rating <= 5),
      r.taskId,
    );
    let key = [
      r.platform,
      review.reviewUrl,
      review.author,
      review.date,
      review.summary,
    ].join("|");
    if (review.author === null)
      key +=
        "|" + (review.evidence?.videoUrl ?? review.evidence?.commentId ?? "");
    if (keys.has(key)) {
      keys.get(key).sourceCards.push(r.url);
      continue;
    }
    const item = {
      ...review,
      recordId:
        "review-" + createHash("sha256").update(key).digest("hex").slice(0, 12),
      taskId: r.taskId,
      platform: r.platform,
      branch: r.branch,
      city: r.city,
      sourceCards: [r.url],
      photos: (review.photos ?? []).map((p) => ({
        ...p,
        localPath: photoPath(p.localPath, r.folder),
      })),
    };
    reviews.push(item);
    keys.set(key, item);
  }
}
const photos = reviews.flatMap((r) =>
  r.photos.map((p, i) => ({
    ...p,
    recordId: r.recordId,
    author: r.author,
    reviewUrl: r.reviewUrl,
    photoId: r.recordId + "-" + (i + 1),
  })),
);
const candidates = results.flatMap((r) =>
  [
    ...(r.candidateReviews ?? []).map((c) => ({
      ...c,
      kind: "topic_boundary",
    })),
    ...(r.reviews ?? [])
      .filter(
        (v) => v.evidence?.photoCandidateStatus === "mentioned_but_unavailable",
      )
      .map((v) => ({
        ...v,
        kind: "unavailable_review_photo",
        reason: v.evidence.photoNote,
      })),
  ].map((c) => ({
    ...c,
    candidateId:
      "candidate-" +
      createHash("sha256")
        .update([r.taskId, c.kind, c.reviewUrl, c.author, c.date].join("|"))
        .digest("hex")
        .slice(0, 12),
    taskId: r.taskId,
    platform: r.platform,
    branch: r.branch,
    city: r.city,
  })),
);
assert.equal(
  new Set(candidates.map((c) => c.candidateId)).size,
  candidates.length,
);
const duplicateGroups = existsSync(new URL("duplicate-verification.json", base))
  ? read("duplicate-verification.json").groups
  : [];
const groupByRecord = new Map();
for (const group of duplicateGroups) {
  if (group.status !== "confirmed_same_review_text") continue;
  for (const recordId of group.recordIds) {
    assert.ok(!groupByRecord.has(recordId), "Overlapping duplicate groups");
    groupByRecord.set(recordId, group);
  }
}
const uniqueGroups = new Map();
for (const review of reviews) {
  const duplicate = groupByRecord.get(review.recordId),
    groupId = duplicate?.groupId ?? review.recordId;
  let group = uniqueGroups.get(groupId);
  if (!group) {
    group = {
      groupId,
      status: duplicate?.status ?? "single_source_occurrence",
      sourceRecordIds: [],
      sourceLinks: [],
      occurrences: [],
    };
    uniqueGroups.set(groupId, group);
  }
  group.sourceRecordIds.push(review.recordId);
  group.occurrences.push(review);
  group.sourceLinks = [
    ...new Set(
      [
        ...group.sourceLinks,
        review.reviewUrl,
        ...review.sourceCards,
        ...(duplicate?.sources ?? []),
      ].filter(Boolean),
    ),
  ];
}
assert.equal(
  [...uniqueGroups.values()].reduce((n, g) => n + g.occurrences.length, 0),
  reviews.length,
  "All source occurrences retained",
);
export const csv = (rows, fields) =>
  "\ufeff" +
  [
    fields.join(","),
    ...rows.map((x) =>
      fields
        .map((k) => '"' + String(x[k] ?? "").replaceAll('"', '""') + '"')
        .join(","),
    ),
  ].join("\r\n") +
  "\r\n";
writeFileSync(
  new URL("reviews.json", base),
  JSON.stringify(reviews, null, 2) + "\n",
);
writeFileSync(
  new URL("review-groups.json", base),
  JSON.stringify([...uniqueGroups.values()], null, 2) + "\n",
);
writeFileSync(
  new URL("photos.json", base),
  JSON.stringify(photos, null, 2) + "\n",
);
writeFileSync(
  new URL("reviews.csv", base),
  csv(reviews, [
    "recordId",
    "author",
    "date",
    "rating",
    "summary",
    "platform",
    "city",
    "branch",
    "reviewUrl",
    "taskId",
  ]),
);
writeFileSync(
  new URL("workshops.csv", base),
  csv(read("workshops.json"), [
    "id",
    "city",
    "address",
    "status",
    "type",
    "networkEvidence",
  ]),
);
writeFileSync(
  new URL("candidates.json", base),
  JSON.stringify(candidates, null, 2) + "\n",
);
writeFileSync(
  new URL("candidates.csv", base),
  csv(candidates, [
    "candidateId",
    "kind",
    "author",
    "date",
    "rating",
    "summary",
    "reason",
    "reviewUrl",
    "taskId",
    "platform",
    "branch",
    "city",
  ]),
);
writeFileSync(
  new URL("review-groups.csv", base),
  csv(
    [...uniqueGroups.values()].map((g) => ({
      ...g,
      sourceRecordIds: g.sourceRecordIds.join(" | "),
      sourceLinks: g.sourceLinks.join(" | "),
      sourceOccurrences: g.occurrences.length,
      summaries: g.occurrences
        .map((r) => r.platform + ": " + r.summary)
        .join(" | "),
    })),
    [
      "groupId",
      "status",
      "sourceOccurrences",
      "sourceRecordIds",
      "sourceLinks",
      "summaries",
    ],
  ),
);
const coverage = queue.map((t) => ({ ...t, ...byId.get(t.taskId)?.coverage }));
assert.equal(coverage.length, queue.length);
writeFileSync(
  new URL("coverage.json", base),
  JSON.stringify(coverage, null, 2) + "\n",
);
writeFileSync(
  new URL("coverage.csv", base),
  csv(coverage, [
    "taskId",
    "platform",
    "city",
    "branch",
    "url",
    "status",
    "examinedCount",
    "reportedTotal",
    "endpointObserved",
    "method",
    "stopReason",
  ]),
);
const stats = {
  queued: queue.length,
  finished: results.length,
  complete: results.filter((r) => r.coverage.status === "complete").length,
  partial: results.filter((r) => r.coverage.status === "partial").length,
  blocked: results.filter((r) => r.coverage.status === "blocked").length,
  reviewRecords: reviews.length,
  photos: photos.length,
  verifiedReviewPhotos: photos.filter(
    (p) => p.attachment === "review" && p.bindingVerified && p.visuallyVerified,
  ).length,
};
stats.contentGroups = uniqueGroups.size;
stats.candidateRecords = candidates.length;
for (const r of results) {
  for (const key of ["examinedCount", "reportedTotal"])
    assert.ok(
      r.coverage[key] == null ||
        (Number.isFinite(r.coverage[key]) && r.coverage[key] >= 0),
      r.taskId + " invalid " + key,
    );
  if (r.coverage.status === "complete")
    assert.equal(
      r.coverage.endpointObserved,
      true,
      r.taskId + " complete without endpoint",
    );
}
stats.examinedSourceEntries = results.reduce(
  (n, r) => n + (r.coverage.examinedCount ?? 0),
  0,
);
stats.sourcesWithUnknownExaminedCount = results.filter(
  (r) => r.coverage.examinedCount == null,
).length;
writeFileSync(
  new URL("stats.json", base),
  JSON.stringify(stats, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    {
      stats,
      next: queue
        .filter((t) => t.status === "queued")
        .map(({ taskId, platform, url }) => ({ taskId, platform, url })),
    },
    null,
    2,
  ),
);
