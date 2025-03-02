<?php
require_once __DIR__."/../lib/mainLib.php";
require_once __DIR__."/../lib/security.php";
require_once __DIR__."/../lib/exploitPatch.php";
require_once __DIR__."/../lib/enums.php";
$sec = new Security();

$person = $sec->loginPlayer();
if(!$person["success"]) exit(CommonError::InvalidRequest);

$listID = Escape::number($_POST["listID"]);
$listName = !empty(Escape::text($_POST["listName"])) ? Escape::text($_POST["listName"]) : "Unnamed list";
$listDesc = Escape::text($_POST["listDesc"]);
$listLevels = Escape::multiple_ids($_POST["listLevels"]);
$difficulty = Escape::number($_POST["difficulty"]);
$original = Escape::number($_POST["original"]);
$unlisted = Escape::number($_POST["unlisted"]);

if(count(explode(',', $listLevels)) == 0) exit(CommonError::InvalidRequest);

if(Library::stringViolatesFilter($listName, 3) || Library::stringViolatesFilter($listDesc, 3)) exit(CommonError::InvalidRequest);

$listDetails = [
	'listName' => $listName,
	'listDesc' => $listDesc,
	'listLevels' => $listLevels,
	'difficulty' => $difficulty,
	'original' => $original,
	'unlisted' => $unlisted
];

$listID = Library::uploadList($person, $listID, $listDetails);
if(!$listID) exit(CommonError::InvalidRequest);

exit((string)$listID);
?>