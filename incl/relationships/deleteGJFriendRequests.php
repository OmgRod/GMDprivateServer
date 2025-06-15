<?php
require_once __DIR__."/../lib/mainLib.php";
require_once __DIR__."/../lib/exploitPatch.php";
require_once __DIR__."/../lib/security.php";
require_once __DIR__."/../lib/enums.php";
$sec = new Security();

$person = $sec->loginPlayer();
if(!$person["success"]) exit(CommonError::InvalidRequest);

$accounts = isset($_POST['accounts']) ? Escape::multiple_ids($_POST["accounts"]) : abs(Escape::number($_POST["targetAccountID"]));

Library::deleteFriendRequests($person, $accounts);

exit(CommonError::Success);
?>