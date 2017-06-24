<?php
header('Content-Type: application/json;charset=utf-8');
file_put_contents("menu.json",$_POST["menuJson"]);

?>