<?php
require_once __DIR__."/../lib/mainLib.php";
require_once __DIR__."/../lib/exploitPatch.php";
require_once __DIR__."/../lib/security.php";
require_once __DIR__."/../lib/enums.php";
$sec = new Security();

$person = $sec->loginPlayer();
if(!$person["success"]) exit(CommonError::InvalidRequest);

$usersString = '';
$str = Escape::text($_POST["str"]);
$page = abs(Escape::number($_POST["page"]));
$pageOffset = $page * 10;

$users = Library::getUsers($str, $pageOffset);
if(!$users['users']) exit(CommonError::InvalidRequest);

foreach($users['users'] AS &$user) $usersString .= Library::returnUserString($user)."|";

exit(rtrim($usersString, "|")."#".$users['count'].":".$pageOffset.":10");
?>