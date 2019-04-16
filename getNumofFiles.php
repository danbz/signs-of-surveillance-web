<?php
  //get number of files in directory for signs
  $directory = "signs/";
  $filecount = 0;
  $files = glob($directory . "*.jpg");
  //$files glob($directory . "*.{jpg,jpeg}",GLOB_BRACE);
  if ($files) {
      $filecount = count($files);
      //echo  $filecount ;
      echo json_encode($files);
  }
?>
