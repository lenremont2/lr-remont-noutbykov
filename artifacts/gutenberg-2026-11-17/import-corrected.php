<?php
use Lenremont\PageImporter\ProjectPackage;
use Lenremont\PageImporter\ProjectImport;
use Lenremont\PageImporter\PageSpec;
if (home_url() !== 'http://testing-gutenberg.local' || get_current_user_id() !== 1) throw new RuntimeException('Wrong target');
$root='D:/works/projects/lr-remont-noutbykov/artifacts/gutenberg-2026-11-17';
$zip=$root.'/lr-remont-noutbykov-gutenberg-corrected.zip'; $state_file=$root.'/corrected-import-state.json';
$package=new ProjectPackage($zip);
if(file_exists($state_file)) { $state=json_decode(file_get_contents($state_file),true); if($state['fingerprint']!==$package->fingerprint) throw new RuntimeException('Package changed'); }
else {
 $verified=json_decode(file_get_contents($root.'/site-pages.json'),true);
 if(count($verified['pages'])!==51||$verified['failures']) throw new RuntimeException('Prior verification failed');
 foreach($verified['pages'] as $page) { if($page['status']!=='draft') throw new RuntimeException('Not a draft'); PageSpec::unchanged($page['id'],$page['revision']); }
 $state=['user'=>1,'manifest'=>$package->manifest,'fingerprint'=>$package->fingerprint,'file'=>$zip,'operation'=>'update','media_sync'=>true,'media_scan'=>false];
 ProjectImport::prepare_structure($state);
 if(count($state['targets'])!==51||!empty($state['new_pages'])) throw new RuntimeException('Unexpected target set');
 foreach($verified['pages'] as $page) if($state['targets'][$page['key']]['id']!==$page['id']) throw new RuntimeException('Unexpected ID');
 file_put_contents($state_file,wp_json_encode($state)); ProjectImport::start_update($state); file_put_contents($state_file,wp_json_encode($state));
}
if(empty($state['resources'])) throw new RuntimeException('Import start incomplete; inspect state before recovery');
if(!isset($state['resolved_media'])) $state['resolved_media']=[];
foreach($state['manifest']['media'] as $key=>$unused) { if(!isset($state['resolved_media'][$key])) { $state['resolved_media'][$key]=ProjectImport::media($state,$key); file_put_contents($state_file,wp_json_encode($state)); } }
$replace=[]; foreach($state['manifest']['pages'] as $page) $replace['page://'.$page['key']]=home_url('/'.$page['url']);
foreach($state['manifest']['pages'] as $page) { $key=$page['key']; $refs=$replace; foreach($state['resolved_media'] as $media_key=>$row) $refs['asset://'.$media_key]=$row['pages'][$key]['url']??$row['url']; $refs['{{resourcesUrl}}']=$state['resources'][$key]['url']; $content=strtr($package->read($page['file']),$refs); ProjectImport::save_structure($state,$key,$content); file_put_contents($state_file,wp_json_encode($state)); echo 'Saved '.$key."\n"; }
