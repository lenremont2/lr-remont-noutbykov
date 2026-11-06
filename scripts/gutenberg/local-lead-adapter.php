<?php
/** Local test receiver. Keep outside every transferable page/plugin package. */
if (!defined('ABSPATH') || home_url('/') !== 'http://testing-gutenberg.local/') return;

add_action('wp_footer', static function () {
    if (!current_user_can('manage_options') || !is_page()) return;
    $key = get_post_meta(get_queried_object_id(), '_lr_package_key', true);
    if (!$key || !in_array((int)get_queried_object_id(), array_merge(range(6219, 6268), array(2370)), true)) return;
    $config = array('url' => admin_url('admin-ajax.php'), 'nonce' => wp_create_nonce('lr-laptop-local-lead'));
    echo '<script id="lr-laptop-local-receiver" type="application/json">' . wp_json_encode($config, JSON_HEX_TAG | JSON_HEX_AMP) . '</script>';
    echo '<script>' . file_get_contents(__DIR__ . '/lr-laptop-local-lead.js') . '</script>';
}, 100);

add_action('wp_ajax_lr_laptop_local_lead', static function () {
    if (!current_user_can('manage_options')) wp_send_json_error(array('message' => 'Нет доступа.'), 403);
    check_ajax_referer('lr-laptop-local-lead');
    $read = static function ($key) { return isset($_POST[$key]) && is_string($_POST[$key]) ? sanitize_textarea_field(wp_unslash($_POST[$key])) : ''; };
    $phone = preg_replace('/\D/', '', $read('phone'));
    $id = $read('request_id');
    if (!preg_match('/^7[0-9]{10}$/D', $phone) || !preg_match('/^[a-f0-9]{32}$/D', $id) ||
        !($read('consent') === 'yes' || $read('privacy_consent') === '1')) wp_send_json_error(array('message' => 'Проверьте телефон и согласие.'), 400);
    $format = $read('service_format') ?: 'consultation';
    if (!in_array($format, array('consultation','workshop','courier','mobile-lab','at-home'), true)) wp_send_json_error(null, 400);
    if (in_array($format, array('courier','mobile-lab','at-home'), true) && !$read('visit_address')) wp_send_json_error(array('message'=>'Укажите адрес.'), 400);
    $receipt_key = 'lr_local_lead_' . get_current_user_id() . '_' . $id;
    if (get_transient($receipt_key)) wp_send_json_success(array('received'=>true, 'id'=>$id, 'duplicate'=>true));
    if (get_transient('lr_local_lead_fail_next')) {
        delete_transient('lr_local_lead_fail_next');
        wp_send_json_error(array('message'=>'Тестовый приёмник временно недоступен. Повторите отправку.'), 503);
    }
    $receipt = array('id'=>$id, 'receivedAt'=>gmdate('c'), 'phone'=>'+' . $phone);
    foreach (array('quiz_service','service_name','source','cta_source','page_path','contact_method','service_format','device_category','symptom','workshop_id','visit_address','requested_repair_place','request_timing') as $field) $receipt[$field] = mb_substr($read($field), 0, 500);
    set_transient($receipt_key, $receipt, DAY_IN_SECONDS);
    $receipts = get_transient('lr_local_lead_receipts_' . get_current_user_id()) ?: array();
    $receipts[] = $receipt;
    set_transient('lr_local_lead_receipts_' . get_current_user_id(), array_slice($receipts, -30), DAY_IN_SECONDS);
    wp_send_json_success(array('received'=>true, 'id'=>$id));
});
