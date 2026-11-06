<?php
// Update only the 50 revision-checked local laptop drafts through the importer API.
use Lenremont\PageImporter\ProjectPackage;
use Lenremont\PageImporter\ProjectImport;
use Lenremont\PageImporter\PageResources;
use Lenremont\PageImporter\PageSpec;
if (home_url() !== 'http://testing-gutenberg.local' || get_current_user_id() !== 1) throw new RuntimeException('Wrong local target');
$root = dirname(__DIR__, 2) . '/artifacts/gutenberg-2026-11-06';
$zip = $root . '/lr-remont-noutbykov-gutenberg-v4-quality.zip';
$package = new ProjectPackage($zip);
$state_file = $root . '/hero-audit/import-state-' . substr($package->fingerprint,0,16) . '.json';
if (file_exists($state_file)) {
    $state = json_decode(file_get_contents($state_file), true);
    if ($state['fingerprint'] !== $package->fingerprint) throw new RuntimeException('Package changed during update');
} else {
    $before = json_decode(file_get_contents($root . '/hero-audit/before.json'), true);
    foreach ($before['pages'] as $row) PageSpec::unchanged($row['id'], $row['revision']);
    $state = array('user'=>1,'manifest'=>$package->manifest,'fingerprint'=>$package->fingerprint,'file'=>$zip,'operation'=>'update','media_sync'=>true,'media_scan'=>false);
    ProjectImport::prepare_structure($state);
    if (count($state['targets']) !== 50 || !empty($state['new_pages'])) throw new RuntimeException('Unexpected targets');
    ProjectImport::start_update($state);
    $state['resolved_media'] = array();
    foreach ($state['manifest']['media'] as $key=>$unused) $state['resolved_media'][$key] = ProjectImport::media($state, $key);
    file_put_contents($state_file, wp_json_encode($state));
}
$replace = array();
foreach ($state['manifest']['pages'] as $page) $replace['page://' . $page['key']] = get_permalink($state['targets'][$page['key']]['id']);
$only = isset($args[0]) ? (int)$args[0] : 0;
foreach ($state['manifest']['pages'] as $page) {
    $key = $page['key']; $id = $state['targets'][$key]['id'];
    if ($only && $only !== $id) continue;
    $refs = $replace;
    foreach ($state['resolved_media'] as $media_key=>$row) $refs['asset://' . $media_key] = $row['pages'][$key]['url'] ?? $row['url'];
    $refs['{{resourcesUrl}}'] = $state['resources'][$key]['url'];
    $content = strtr($package->read($page['file']), $refs);
    ProjectImport::save_structure($state, $key, $content);
    file_put_contents($state_file, wp_json_encode($state));
    echo 'Updated local draft ' . $id . "\n";
}
