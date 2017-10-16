<?php

function envmap_data($filter_string){
  $filter = _envmap_filter_params($filter_string);
  $filter_string = implode('_', $filter);

  // cache
  $dir = 'public://factory';
  $cache = "$dir/{$filter_string}.js";

  file_prepare_directory($dir, FILE_CREATE_DIRECTORY);
  $sql = _envmap_filter_query($filter);
  
  $query = db_query($sql);
  $array = array();
  while($r = $query->fetchObject()){
    if (!$r->over_month) {
      $r->over_month = '0';
    }
    $r->over_month = str_replace(",", '|', $r->over_month);
    $array[] = "[\"$r->registration_no\",\"$r->facility_name\",$r->twd97_lat,$r->twd97_lon,\"$r->over_month\"]";
  }
  $output = implode(",\n", $array);
  $output = 'var factoryPoints = ['."\n" . $output . "\n];";

  file_unmanaged_save_data($output, $cache, FILE_EXISTS_REPLACE);

  drupal_add_http_header('Content-Type', 'application/javascript');
  return $output;
}

function envmap_data_purge($force = FALSE){
  $dir = 'public://factory';
  global $conf;
  $conf['drupal_stale_file_threshold'] = 43200;
  if($force) {
    $callback = 'file_unmanaged_delete';
  }
  else{
    $callback = 'drupal_delete_file_if_stale';
  }
  file_scan_directory($dir, '/.*/', array('callback' => $callback));
}

function envmap_data_realtime(){
  // air
  $options = array(
    'key' => 'filename',
  );
  $files = file_scan_directory('realtime/air/chimney_cache_gov/over30day', '/.*/', $options);
  $over_month = array();
  foreach($files as $f){
    $over_month[$f->name][1] = 1;
  }
  $files = file_scan_directory('realtime/air/chimney_cache_gov/over6month', '/.*/', $options);
  foreach($files as $f){
    $over_month[$f->name][6] = 1;
  }

  // clear
  db_update('factory_realtime')
    ->fields(array('over_month' => NULL))
    ->condition('type', 1, '=') // air
    ->execute();
  foreach($over_month as $no => $month) {
    db_update('factory_realtime')
      ->fields(array('over_month' => implode(',', array_keys($month))))
      ->condition('registration_no', $no, '=')
      ->condition('type', 1, '=') // air
      ->execute();
  }

  // water
  $options = array(
    'key' => 'filename',
  );
  $files = file_scan_directory('realtime/water/statistics/over30day', '/.*/', $options);
  $over_month = array();
  foreach($files as $f){
    $over_month[$f->name][1] = 1;
  }
  $files = file_scan_directory('realtime/water/statistics/over6month', '/.*/', $options);
  foreach($files as $f){
    $over_month[$f->name][6] = 1;
  }

  // clear
  db_update('factory_realtime')
    ->fields(array('over_month' => NULL))
    ->condition('type', 2, '=') // water
    ->execute();
  foreach($over_month as $no => $month) {
    db_update('factory_realtime')
      ->fields(array('over_month' => implode(',', array_keys($month))))
      ->condition('registration_no', $no, '=')
      ->condition('type', 2, '=') // water
      ->execute();
  }
}

function envmap_autocomplete($string){
  list($name, $filter_string) = explode('::', $string);
  $filter = _envmap_filter_params($filter_string);
  $additional_where = array(
    "f.facility_name LIKE :name",
  );
  $sql = _envmap_filter_query($filter, $additional_where);
  $query = db_query_range($sql, 0, 20, array(':name' => '%'.db_like($name).'%'));
  $result = $query->fetchAll();

  $matches = array();
  foreach ($result as $row) {
    $matches[$row->facility_name] = check_plain($row->facility_name);
  }

  // Return the result to the form in json
  drupal_json_output($matches);
}

function _envmap_filter_query($filter, $additional_where = array()){
  extract($filter);
  $where = array();
  $join = " LEFT JOIN factory_realtime r ON r.registration_no = f.registration_no ";
  if ($type !== 'all'){
    // get views options
    $view = views_get_view('corp');
    if(!empty($view->display['corp_list_block_1'])) {
      $display = $view->display['corp_list_block_1'];
      $view_filter = $display->display_options['filters'];
      if(!empty($view_filter['industry_name'])) {
        $items = $view_filter['industry_name']['group_info']['group_items'];
        if (isset($items[$type])) {
          $rule = $items[$type];
          switch($rule['operator']) {
            case 'regular_expression':
              $where[] = "(f.industry_name RLIKE '{$rule['value']}')";
              break;
            case 'contains':
              $where[] = "(f.industry_name LIKE '%{$rule['value']}%')";
              break;
            case 'starts':
              $where[] = "(f.industry_name LIKE '{$rule['value']}%')";
              break;
          }
        }   
      }
    }
  }
  if($poltype != 'all') {
    if($poltype == 1){
      $where[] = 'f.is_air = 1';
    }
    elseif($poltype == 2){
      $where[] = 'f.is_water = 1';
    }
  }
  if($fine) {
    $where[] = 'f.registration_no IN (SELECT ff.registration_no FROM factory_fine ff)';
  }
  if($realtime) {
    $join =  " INNER JOIN factory_realtime r ON r.registration_no = f.registration_no ";
    if ($poltype == 1) { // air
      $join .= " AND r.type = 1";
    }
    elseif($poltype == 2) {
      $join .= " AND r.type = 2";
    }
    if($overhead) {
      if ($poltype) {
        $rrtype = "AND rr.type = $poltype";
      }
      $where[] = "f.registration_no IN (SELECT rr.registration_no FROM factory_realtime rr WHERE find_in_set('$overhead', rr.over_month) > 0 $rrtype)";
    }
  }

  if(empty($where)) {
    $where[] = '1';
  }
  $where = array_merge($where, $additional_where);
  $sql = "SELECT DISTINCT(f.registration_no), f.facility_name, f.twd97_lon, f.twd97_lat, r.over_month FROM factory f $join";
  $sql .= " WHERE ".implode(' AND ', $where);
  return $sql;
}

function _envmap_filter_params($string){
  $v = explode('_', $string);
  $vars['type'] = $v[0];
  $vars['poltype'] = $v[1];
  $vars['fine'] = $v[2];
  $vars['realtime'] = $v[3];
  if (is_numeric($v[4])) {
    $vars['overhead'] = $v[4];
  }
  else {
    $vars['overhead'] = '0';
  }
  return $vars;
}
