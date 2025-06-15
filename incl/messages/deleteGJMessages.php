<?php
require_once __DIR__."/../lib/mainLib.php";
require_once __DIR__."/../lib/security.php";
require_once __DIR__."/../lib/exploitPatch.php";
require_once __DIR__."/../lib/enums.php";
$sec = new Security();

$person = $sec->loginPlayer();
if(!$person["success"]) exit(CommonError::InvalidRequest);

$messages = isset($_POST['messages']) ? Escape::multiple_ids($_POST['messages']) : abs(Escape::number($_POST['messageID']));

$deleteMessages = Library::deleteMessages($person, $messages);
if(!$deleteMessages) exit(CommonError::InvalidRequest);

exit(CommonError::Success);
?>