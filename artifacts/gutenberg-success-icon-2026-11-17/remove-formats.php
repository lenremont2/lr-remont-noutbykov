<?php
use Lenremont\PageImporter\PageSpec;
use Lenremont\PageImporter\PageApply;
if(home_url()!=='http://testing-gutenberg.local'||get_current_user_id()!==1)throw new RuntimeException('Wrong target');
$path='D:/works/projects/lr-remont-noutbykov/artifacts/gutenberg-success-icon-2026-11-17/remove-formats-state.json';
if(!file_exists($path)) {
 $data=json_decode(file_get_contents('D:/works/projects/lr-remont-noutbykov/src/data/service-pages.json'),true);$state=[];
 foreach($data['problems'] as $p){$post=get_page_by_path($p['slug'],OBJECT,'page');if(!$post||$post->post_status!=='draft'||(int)$post->post_author!==1)throw new RuntimeException('Unexpected page '.$p['slug']);$s=PageSpec::snapshot($post->ID);$state[]=['id'=>$post->ID,'slug'=>$post->post_name,'revision'=>$s['revision'],'requestId'=>bin2hex(random_bytes(16))];}
 if(count($state)!==10)throw new RuntimeException('Unexpected page count');file_put_contents($path,wp_json_encode($state));
}else $state=json_decode(file_get_contents($path),true);
foreach($state as $row){
 try{$receipt=PageApply::receipt($row['requestId']);}catch(Throwable $e){if($e->getCode()!==410)throw $e;$receipt=null;}
 if($receipt){if(!$receipt['unchanged'])throw new RuntimeException('Page changed after update '.$row['id']);echo 'Already updated '.$row['slug']."\n";continue;}
 $s=PageSpec::unchanged($row['id'],$row['revision']);if($s['status']!=='draft'||$s['author']!==1)throw new RuntimeException('Unexpected owner');$b=parse_blocks($s['content']);if(serialize_blocks($b)!==$s['content'])throw new RuntimeException('Non-lossless serialization');
 $children=&$b[0]['innerBlocks'][0]['innerBlocks'][0]['innerBlocks'];$ids=array_map(static function($x){return $x['attrs']['attributes']['id']??'';},$children);
 if(array_slice($ids,0,4)!==['lr-hero','lr-problem-guide','lr-reviews','lr-formats'])throw new RuntimeException('Unexpected block order '.$row['slug']);
 $parent=&$b[0]['innerBlocks'][0]['innerBlocks'][0]; $nulls=0; $position=null; foreach($parent['innerContent'] as $i=>$part) { if($part===null && $nulls++===3){$position=$i;break;} } if($position===null)throw new RuntimeException('Missing block placeholder'); array_splice($children,3,1); array_splice($parent['innerContent'],$position,1);
 $request=['operation'=>'update','id'=>$row['id'],'revision'=>$row['revision'],'spec'=>['format'=>'lenremont-page','version'=>1,'title'=>$s['title'],'slug'=>$s['slug'],'source'=>['format'=>'gutenberg','value'=>serialize_blocks($b)]]];
 $plan=PageApply::plan($request);$receipt=PageApply::apply($plan['request'],$plan['planHash'],$row['requestId']);echo 'Updated '.$row['slug']."\n";
}

