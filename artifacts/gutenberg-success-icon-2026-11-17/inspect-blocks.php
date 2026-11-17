<?php
if(home_url()!=='http://testing-gutenberg.local'||get_current_user_id()!==1)throw new RuntimeException('Wrong target');
$p=get_page_by_path('noutbuk-ne-vklyuchaetsya',OBJECT,'page');
$walk=function($blocks,$depth=0)use(&$walk){foreach($blocks as $i=>$b){if($depth<=3){$a=$b['attrs'];echo $depth.':'.$i.' '.($b['blockName']??'null').' '.substr(wp_json_encode($a,JSON_UNESCAPED_UNICODE),0,300)."\n";}if($depth<3&&!empty($b['innerBlocks']))$walk($b['innerBlocks'],$depth+1);}};
$walk(parse_blocks($p->post_content));
