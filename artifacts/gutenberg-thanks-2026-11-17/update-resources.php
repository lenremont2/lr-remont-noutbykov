<?php
use Lenremont\PageImporter\{ProjectPackage,PageResources,PageSpec,PageApply};
if (home_url() !== 'http://testing-gutenberg.local' || get_current_user_id() !== 1) throw new RuntimeException('Wrong local target');
$root = __DIR__;
$before = json_decode(file_get_contents(__DIR__ . '/before.json'), true, 512, JSON_THROW_ON_ERROR);
if (count($before['pages']) !== 51 || $before['failures']) throw new RuntimeException('Invalid baseline');
$package = new ProjectPackage($root . '/pages-final.zip');
$sets = PageResources::install($package);
$plans = array(); $done = array();
foreach ($before['pages'] as $row) {
    $next = $sets[$row['key']];
    $request_id = substr(hash('sha256', 'thanks-style:' . $row['id'] . ':' . $next['resourceSet']), 0, 32);
    try { $receipt = PageApply::receipt($request_id); }
    catch (Throwable $error) { if ($error->getCode() !== 410) throw $error; $receipt = null; }
    if ($receipt) {
        if (!$receipt['unchanged']) throw new RuntimeException('Saved page changed: ' . $row['id']);
        $done[] = $row['id']; continue;
    }
    $current = PageSpec::unchanged($row['id'], $row['revision']);
    if ($current['status'] !== 'draft' || $current['author'] !== 1) throw new RuntimeException('Unexpected draft');
    $old_files = PageResources::get($current['resourceSet'])['files'];
    $new_files = PageResources::get($next['resourceSet'])['files'];
    foreach (array('resources/page.css','resources/editor.css') as $css) { unset($old_files[$css],$new_files[$css]); }
    ksort($old_files); ksort($new_files);
    if ($old_files !== $new_files) throw new RuntimeException('Non-CSS resource changed: ' . $row['id']);
    $old_url = PageResources::base_url($current['resourceSet']);
    $content = str_replace($old_url, $next['url'], $current['content']);
    if (str_replace($next['url'], $old_url, $content) !== $row['content']) throw new RuntimeException('Content changed: ' . $row['id'] . ' current=' . hash('sha256',$current['content']) . ' baseline=' . hash('sha256',$row['content']) . ' rebased=' . hash('sha256',str_replace($next['url'], $old_url, $content)) . ' old=' . $old_url . ' new=' . $next['url']);
    $request = array('operation'=>'update','id'=>$row['id'],'revision'=>$row['revision'],'spec'=>array(
        'format'=>'lenremont-page','version'=>1,'title'=>$current['title'],'slug'=>$current['slug'],
        'source'=>array('format'=>'gutenberg','value'=>$content),'resourceSet'=>$next['resourceSet']));
    $plan = PageApply::plan($request);
    $plans[] = array($plan,$request_id);
}
foreach ($plans as [$plan,$request_id]) {
    $receipt = PageApply::apply($plan['request'],$plan['planHash'],$request_id);
    $done[] = $receipt['page']['id'];
    echo 'Updated CSS for local draft ' . $receipt['page']['id'] . "\n";
}
file_put_contents(__DIR__ . '/updated.json', wp_json_encode(array('site'=>home_url(),'ids'=>$done,'changedResources'=>array('resources/page.css','resources/editor.css'))));

