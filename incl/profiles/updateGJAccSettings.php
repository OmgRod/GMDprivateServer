<?php
require_once __DIR__."/../lib/mainLib.php";
require_once __DIR__."/../lib/security.php";
require_once __DIR__."/../lib/exploitPatch.php";
require_once __DIR__."/../lib/enums.php";
$sec = new Security();

$person = $sec->loginPlayer();
if(!$person["success"]) exit(CommonError::InvalidRequest);

$messagesState = Security::limitValue(0, Escape::number($_POST["mS"]), 2);
$friendRequestsState = Security::limitValue(0, Escape::number($_POST["frS"]), 1);
$commentsState = Security::limitValue(0, Escape::number($_POST["cS"]), 2);
$socialsYouTube = Escape::text($_POST["yt"]);
$socialsTwitter = Escape::text($_POST["twitter"]);
$socialsTwitch = Escape::text($_POST["twitch"]);

Library::updateAccountSettings($person, $messagesState, $friendRequestsState, $commentsState, $socialsYouTube, $socialsTwitter, $socialsTwitch);
exit(CommonError::Success);
?>