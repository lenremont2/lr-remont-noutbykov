<?php
// Read-only checks of our imported pages. Never saves or deletes existing pages.
if (!defined('ABSPATH') || home_url() !== 'http://testing-gutenberg.local' || wp_get_current_user()->user_login !== 'admin') throw new RuntimeException('Wrong test site/user');
$directory = 'D:/works/projects/lr-remont-noutbykov/artifacts/gutenberg-2026-11-17';
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
$result["existingPagesUnchanged"] = null;
echo wp_json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
