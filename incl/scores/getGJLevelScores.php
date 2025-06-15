<?php
require_once __DIR__."/../lib/mainLib.php";
require_once __DIR__."/../lib/security.php";
require_once __DIR__."/../lib/exploitPatch.php";
require_once __DIR__."/../lib/XOR.php";
require_once __DIR__."/../lib/enums.php";
$sec = new Security();

$person = $sec->loginPlayer();
if(!$person["success"]) exit(CommonError::InvalidRequest);

$scoreString = '';

$levelID = abs(Escape::number($_POST['levelID']) ?: 0);
$type = abs(Escape::number($_POST['type']) ?: 0);
$percent = Escape::number($_POST['percent']);

$attempts = !empty($_POST["s1"]) ? abs(Escape::number($_POST["s1"])) - 8354 : 0;
$clicks = !empty($_POST["s2"]) ? abs(Escape::number($_POST["s2"])) - 3991 : 0;
$time = !empty($_POST["s3"]) ? abs(Escape::number( $_POST["s3"])) - 4085 : 0;
$progresses = !empty($_POST["s6"]) ? Escape::multiple_ids(XORCipher::cipher(Escape::url_base64_decode($_POST["s6"]), 41274)) : 0;
$coins = !empty($_POST["s9"]) ? abs(Escape::number($_POST["s9"])) - 5819 : 0;
$dailyID = !empty($_POST["s10"]) ? abs(Escape::number($_POST["s10"])) : 0;

Library::submitLevelScore($levelID, $person, $percent, $attempts, $clicks, $time, $progresses, $coins, $dailyID);

$levelScores = Library::getLevelScores($levelID, $person, $type, $dailyID);
if(!$levelScores['count']) exit(CommonError::InvalidRequest);

foreach($levelScores['scores'] AS $key => $user) {
	$time = Library::makeTime($user["uploadDate"]);
	$user["userName"] = Library::makeClanUsername($user["extID"]);
	$scoreString .= "1:".$user["userName"].":2:".$user["userID"].":9:".$user["icon"].":10:".$user["color1"].":11:".$user["color2"].":51:".$user["color3"].":14:".$user["iconType"].":15:".$user["special"].":16:".$user["extID"].":3:".$user["percent"].":6:".($key + 1).":13:".$user["scoreCoins"].":42:".$time."|";
}

exit(rtrim($scoreString, "|"));
?>