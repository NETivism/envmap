<?php

function envmap_data($filter_string){
  $filter = _envmap_filter_params($filter_string);
  $filter_string = implode('_', $filter);

  // cache
  $dir = 'public://factory';
  $cache = "$dir/{$filter_string}.js";
  $cache_exists = file_exists($cache);
  if($cache_exists) {
    $output = file_get_contents($cache);
  }
  else{
    file_prepare_directory($dir, FILE_CREATE_DIRECTORY);
    $sql = _envmap_filter_query($filter);
    
    $query = db_query($sql);
    $array = array();
    while($r = $query->fetchObject()){
      $array[] = "[\"$r->registration_no\",\"$r->facility_name\",$r->twd97_lat,$r->twd97_lon,$r->over_month]";
    }
    $output = implode(",\n", $array);
    $output = 'var factoryPoints = ['."\n" . $output . "\n];";
    file_unmanaged_save_data($output, $cache, FILE_EXISTS_REPLACE);
  }
  drupal_add_http_header('Content-Type', 'application/javascript');
  return $output;
}

function envmap_data_purge($force = FALSE){
  $dir = 'public://factory';
  global $conf;
  $conf['drupal_stale_file_threshold'] = 86400;
  if($force) {
    $callback = 'file_unmanaged_delete';
  }
  else{
    $callback = 'drupal_delete_file_if_stale';
  }
  file_scan_directory($dir, '/.*/', array('callback' => $callback));
}

function envmap_data_realtime(){
  $options = array(
    'key' => 'filename',
  );
  $files = file_scan_directory('realtime/chimney_cache/over30day', '/.*/', $options);
  $overfactory = array();
  foreach($files as $f){
    $overfactory[] = $f->name;
  }
  db_update('factory_realtime')
    ->fields(array('over_month' => 0))
    ->condition('type', 1, '=')
    ->execute();
  db_update('factory_realtime')
    ->fields(array('over_month' => 1))
    ->condition('registration_no', $overfactory, 'IN')
    ->condition('type', 1, '=')
    ->execute();
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
  if($overhead) {
    $where[] = 'f.registration_no IN (SELECT rr.registration_no FROM factory_realtime rr WHERE rr.over_month = 1)';
  }
  elseif($realtime) {
    $where[] = 'f.registration_no IN (SELECT rr.registration_no FROM factory_realtime rr)';
  }

  if(empty($where)) {
    $where[] = '1';
  }
  $where = array_merge($where, $additional_where);
  $sql = "SELECT f.registration_no, f.facility_name, f.twd97_lon, f.twd97_lat, r.over_month FROM factory f LEFT JOIN factory_realtime r ON r.registration_no = f.registration_no WHERE ";
  $sql .= implode(' AND ', $where);
  return $sql;
}

function _envmap_filter_params($string){
  $v = explode('_', $string);
  $vars['type'] = $v[0];
  $vars['poltype'] = $v[1];
  $vars['fine'] = $v[2];
  $vars['realtime'] = $v[3];
  $vars['overhead'] = $v[4];
  return $vars;
}
