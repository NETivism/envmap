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
    if($realtime) {
      $where[] = 'f.registration_no IN (SELECT r.registration_no FROM factory_realtime r)';
    }

    if(empty($where)) {
      $where[] = '1';
    }
    $sql = "SELECT f.registration_no, f.facility_name, f.twd97_lon, f.twd97_lat FROM factory f WHERE ";
    $sql .= implode(' AND ', $where);
    
    $query = db_query($sql);
    $array = array();
    while($r = $query->fetchObject()){
      $array[] = "[\"$r->registration_no\",\"$r->facility_name\",$r->twd97_lat,$r->twd97_lon]";
    }
    $output = implode(",\n", $array);
    $output = 'var factoryPoints = ['."\n" . $output . "\n];";
    file_save_data($output, $cache, FILE_EXISTS_REPLACE);
  }
  drupal_add_http_header('Content-Type', 'application/javascript');
  return $output;
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
