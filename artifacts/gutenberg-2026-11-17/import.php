<?php
use Lenremont\PageImporter\ProjectPackage;
use Lenremont\PageImporter\ProjectImport;
use Lenremont\PageImporter\PageSpec;
if (home_url() !== 'http://testing-gutenberg.local' || get_current_user_id() !== 1) throw new RuntimeException('Wrong target');
$root='D:/works/projects/lr-remont-noutbykov/artifacts/gutenberg-2026-11-17';
$zip=$root.'/lr-remont-noutbykov-gutenberg.zip'; $state_file=$root.'/import-state.json';
$package=new ProjectPackage($zip);
if(file_exists($state_file)) { $state=json_decode(file_get_contents($state_file),true); if($state['fingerprint']!==$package->fingerprint) throw new RuntimeException('Package changed'); }
else {
 $inventory=json_decode(file_get_contents($root.'/inventory.json'),true);
 foreach($inventory as $row) foreach($row['matches'] as $p) { if($p['status']!=='draft'||(int)$p['author']!==1||$p['packageKey']!==$row['key']||$p['id']!==$p['oldId']||$p['revision']!==$p['oldRevision']) throw new RuntimeException('Unexpected target '.$row['key']); PageSpec::unchanged($p['id'],$p['revision']); }
 $state=['user'=>1,'manifest'=>$package->manifest,'fingerprint'=>$package->fingerprint,'file'=>$zip,'operation'=>'update','media_sync'=>true,'media_scan'=>false];
 ProjectImport::prepare_structure($state);
 if(count($state['targets'])!==50||array_keys($state['new_pages']??[])!==['ne-rabotaet-tachpad-noutbuka']) throw new RuntimeException('Unexpected target set');
 file_put_contents($state_file,wp_json_encode($state));
 ProjectImport::start_update($state,true); file_put_contents($state_file,wp_json_encode($state));
}
if(empty($state['create_missing'])) throw new RuntimeException('Import start incomplete; inspect site and state before recovery');
if(!isset($state['resolved_media'])) $state['resolved_media']=[];
foreach($state['manifest']['media'] as $key=>$unused) { if(!isset($state['resolved_media'][$key])) { $state['resolved_media'][$key]=ProjectImport::media($state,$key); file_put_contents($state_file,wp_json_encode($state)); } }
$rows=ProjectImport::plan($state); $replace=[];
foreach($state['manifest']['pages'] as $page) { $key=$page['key']; if(empty($rows[$key]['id'])) throw new RuntimeException('No reserved ID '.$key); $replace['page://'.$key]=home_url('/'.$page['url']); }
foreach($state['manifest']['pages'] as $page) {
 $key=$page['key']; $refs=$replace;
 foreach($state['resolved_media'] as $media_key=>$row) $refs['asset://'.$media_key]=$row['pages'][$key]['url']??$row['url'];
 $refs['{{resourcesUrl}}']=$state['resources'][$key]['url'];
 $content=strtr($package->read($page['file']),$refs);
 ProjectImport::save_structure($state,$key,$content); file_put_contents($state_file,wp_json_encode($state)); echo 'Saved '.$key."\n";
}
