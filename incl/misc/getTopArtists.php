<?php
require __DIR__."/../../config/misc.php";
require_once __DIR__."/../lib/mainLib.php";
require_once __DIR__."/../lib/security.php";
require_once __DIR__."/../lib/exploitPatch.php";
require_once __DIR__."/../lib/enums.php";
$sec = new Security();

$person = $sec->loginPlayer();
if(!$person["success"]) exit(CommonError::InvalidRequest);

$songsString = '';
$page = abs(Escape::number($_POST['page']));
$pageOffset = $page * 20;

if($topArtistsFromGD) {
	$data = ['offset' => $pageOffset, 'secret' => 'Wmfd2893gb7'];
	$headers = ['Content-type: application/x-www-form-urlencoded'];
		
	$request = Library::sendRequest('http://www.boomlings.com/database/getGJTopArtists.php', http_build_query($data), $headers, "POST", false);
	
	exit($request);
}

$favouriteSongs = Library::getFavouriteSongs($person, $pageOffset);
if(!$favouriteSongs["count"]) exit("4:You liked 0 songs!");

foreach($favouriteSongs["songs"] AS &$song) {
	$songsString .= "4:".Escape::translit($song["authorName"])." - ".Escape::translit($song["name"]).", ".$song["ID"];
	$songsString .= ":7:../redirect?q=".urlencode($song["download"]);
	$songsString .= "|";
}

exit($songsString."#".$favouriteSongs["count"].":".$pageOffset.":20");
?>