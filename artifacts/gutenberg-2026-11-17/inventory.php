<?php
use Lenremont\PageImporter\PageSpec;
if (home_url() !== 'http://testing-gutenberg.local' || get_current_user_id() !== 1) throw new RuntimeException('Wrong target');
$root='D:/works/projects/lr-remont-noutbykov/artifacts/';
$manifest=json_decode(file_get_contents($root.'gutenberg-2026-11-17/project/project.json'),true);
$old=json_decode(file_get_contents($root.'gutenberg-2026-11-06/stock/site-pages.json'),true);
$oldByKey=array_column($old['pages'],null,'key'); $rows=[];
foreach($manifest['pages'] as $p){$posts=get_posts(['post_type'=>'page','name'=>$p['slug'],'post_status'=>'any','numberposts'=>-1]); $items=[];foreach($posts as $post){$snap=PageSpec::snapshot($post->ID);$items[]=['id'=>$post->ID,'status'=>$post->post_status,'author'=>$post->post_author,'packageKey'=>get_post_meta($post->ID,'_lr_package_key',true),'revision'=>$snap['revision'],'oldRevision'=>$oldByKey[$p['key']]['revision']??null,'oldId'=>$oldByKey[$p['key']]['id']??null];} $rows[]=['key'=>$p['key'],'matches'=>$items];}
echo wp_json_encode($rows,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
