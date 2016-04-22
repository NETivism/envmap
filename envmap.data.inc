<?php

function envmap_data($filter){
  list($type, $poltype, $fine, $realtime, $overhead) = explode('_', $filter);

  // cache
  $dir = 'public://factory';
  $cache = "$dir/{$filter}.js";
  $cache_exists = file_exists($cache);
  if($cache_exists) {
    $output = file_get_contents($cache);
  }
  else{
    file_prepare_directory($dir, FILE_CREATE_DIRECTORY);
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
    $sql = "SELECT f.registration_no, f.facility_name, f.twd97_lon, f.twd97_lat, r.over_month FROM factory f LEFT JOIN factory_realtime r ON r.registration_no = f.registration_no WHERE ";
    $sql .= implode(' AND ', $where);
    
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

function envmap_autocomplete($name){
  $result = db_select('factory', 'f')
    ->fields('f', array('facility_name', 'registration_no'))
    ->condition('facility_name', '%' . db_like($name) . '%', 'LIKE')
    ->range(0, 10)
    ->execute();
    // save the query to matches

  $matches = array();
  foreach ($result as $row) {
    $matches[$row->facility_name] = check_plain($row->facility_name);
  }

  // Return the result to the form in json
  drupal_json_output($matches);
}
