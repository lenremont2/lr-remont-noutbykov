<?php
// Read-only checks of our imported pages. Never saves or deletes existing pages.
if (!defined('ABSPATH') || home_url() !== 'http://testing-gutenberg.local' || wp_get_current_user()->user_login !== 'admin') throw new RuntimeException('Wrong test site/user');
$directory = dirname(__DIR__, 2) . '/artifacts/gutenberg-2026-11-06';
$manifest = json_decode(file_get_contents($directory . '/project/project.json'), true);
$result = array('site' => home_url(), 'pages' => array(), 'failures' => array(), 'checkedAt' => gmdate('c'));
$main = get_page_by_path('remont-noutbukov-spb', OBJECT, 'page');
foreach ($manifest['pages'] as $index => $expected) {
    $post = get_page_by_path($expected['slug'], OBJECT, 'page');
    if (!$post || get_post_meta($post->ID, '_lr_package_key', true) !== $expected['key']) { $result['failures'][] = 'Missing owned page: ' . $expected['key']; continue; }
    $id = (int) $post->ID;
    $check = static function ($condition, $name) use (&$result, $id) { if (!$condition) $result['failures'][] = $id . ': ' . $name; };
    $check(get_post_meta($id, '_lr_import_state', true) === 'ready', 'Import not ready');
    $check($post->post_status === 'draft' && (int) $post->post_author === get_current_user_id(), 'Status/author');
    $check($post->post_title === $expected['title'], 'Project title');
    $check(strpos($post->post_content, 'Проверка редактирования.') === false, 'Temporary editing text remains');
    $check((int) $post->post_parent === 0, 'Native parent changed');
    $check(get_post_meta($id, 'on_parent_page_search', true) === ($index ? (string) $main->ID : ''), 'Search parent');
    $check(get_post_meta($id, 'custom_permalink', true) === $expected['url'], 'Custom permalink');
    $check(get_permalink($id) === home_url('/' . $expected['url']), 'Actual permalink');
    $check(get_page_template_slug($id) === 'lenremont-landing', 'Landing template');
    $seo = $expected['seo'];
    foreach (array('canonical','breadcrumbsUrl') as $key) $seo[$key] = home_url('/' . $expected['url']);
    if (isset($seo['ogImage'])) { unset($seo['ogImage']); $seo['ogImageId'] = (int) get_post_meta($id, '_yoast_wpseo_opengraph-image-id', true); }
    $metadata = Lenremont\PageImporter\PageSeo::metadata($seo);
    foreach ($metadata as $name => $value) $check(get_post_meta($id, $name, true) === $value, $name);
    $check(!preg_match('~(?:asset|page)://|\{\{resourcesUrl\}\}|https://(?:assets|pages|resources)\.invalid~', $post->post_content), 'Unresolved reference');
    $result['pages'][] = array('id' => $id, 'key' => $expected['key'], 'slug' => $post->post_name, 'title' => $post->post_title, 'status' => $post->post_status,
        'url' => get_permalink($id), 'preview' => home_url('/?page_id=' . $id . '&preview=true'), 'edit' => admin_url('post.php?post=' . $id . '&action=edit'),
        'parentId' => get_post_meta($id, 'on_parent_page_search', true), 'nativeParent' => (int) $post->post_parent,
        'revision' => Lenremont\PageImporter\PageSpec::snapshot($id)['revision'], 'seo' => Lenremont\PageImporter\PageSeo::snapshot($id), 'content' => $post->post_content);
}
$before = json_decode(file_get_contents($directory . '/backup/page-hashes.json'), true);
global $wpdb;
$after = $wpdb->get_results("SELECT ID,post_status,post_author,post_parent,SHA2(post_content,256) AS hash FROM {$wpdb->posts} WHERE post_type=0x70616765 ORDER BY ID", ARRAY_A);
if (count($after) !== count($before) + 50) $result['failures'][] = 'Unexpected page count after repeated import';
foreach ($before as $row) { $found = array_values(array_filter($after, static function ($candidate) use ($row) { return $candidate['ID'] === $row['ID']; })); if (count($found) !== 1 || $found[0] !== $row) $result['failures'][] = 'Existing page changed: ' . $row['ID']; }
$result['existingPagesUnchanged'] = !array_filter($result['failures'], static function ($s) { return strpos($s, 'Existing page changed:') === 0; });
echo wp_json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
