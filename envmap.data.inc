<?php

function envmap_data($type){
  $allowed = array(
    'finerealtime',
    'fine',
    'realtime',
    'all',
  );
  $output = '';
  if(in_array($type, $allowed)) {
    // cache
    $dir = 'public://factory';
    $cache = "$dir/{$type}.js";
    $cache_exists = file_exists($cache);
    if($cache_exists) {
      $output = file_get_contents($cache);
    }
    else{
      file_prepare_directory($dir, FILE_CREATE_DIRECTORY);
      switch($type){
	case 'finerealtime':
	  $sql = "SELECT f.registration_no, f.facility_name, f.twd97_lon, f.twd97_lat FROM factory f WHERE f.registration_no IN (SELECT ff.registration_no FROM factory_fine ff) OR f.registration_no IN (SELECT r.registration_no FROM factory_realtime r)";
	  break; 
	case 'fine':
	  $sql = "SELECT f.registration_no, f.facility_name, f.twd97_lon, f.twd97_lat FROM factory f WHERE f.registration_no IN (SELECT ff.registration_no FROM factory_fine ff)";
	  break; 
	case 'realtime':
	  $sql = "SELECT f.registration_no, f.facility_name, f.twd97_lon, f.twd97_lat FROM factory f WHERE f.registration_no IN (SELECT r.registration_no FROM factory_realtime r)";
	  break; 
	case 'all':
	  $sql = "SELECT f.registration_no, f.facility_name, f.twd97_lon, f.twd97_lat FROM factory f WHERE 1";
	  break; 
      }
      $query = db_query($sql);
      $array = array();
      while($r = $query->fetchObject()){
        $array[] = "[\"$r->registration_no\",\"$r->facility_name\",$r->twd97_lat,$r->twd97_lon]";
      }
      $output = implode(",\n", $array);
      $output = 'var factoryPoints = ['."\n" . $output . "\n];";
      file_save_data($output, $cache, FILE_EXISTS_REPLACE);
    }
  }
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
