<?php
#Libraries.
$needsAuthentication = true;
$needsAJAX = true;
$needsTeacher = true;
$needsSQL = true;
include "../../../restricted/db.php";
include "../../../restricted/sql.php";

$NAME = isset($_POST["NAME"]) ? $_POST["NAME"] : "";
$YEAR = isset($_POST["YEAR"]) ? $_POST["YEAR"] : "";
$TERM = isset($_POST["TERM"]) ? $_POST["TERM"] : "";
$PERIOD = isset($_POST["PERIOD"]) ? $_POST["PERIOD"] : "";
$DESCRIPTOR = isset($_POST["DESCRIPTOR"]) ? $_POST["DESCRIPTOR"] : "";

#Class name needs to be 2 or more chars.
if(strlen($NAME) < 2) {
	db_showError("Error creating class!", "The class name is too short.", "Please type a longer class name.", 400);
}

if(strlen($PERIOD) < 2) {
	db_showError("Error creating class!", "The defined period is too short.", "Please type a longer period name.", 400);
}

if(!is_numeric($YEAR)) {
	db_showError("Error creating class!", "The year needs to be numerical.", "Please type a number for the year.", 400);
}

if(!is_numeric($TERM)) {
	db_showError("Error creating class!", "The term needs to be numerical.", "Please type a number for the term.", 400);
}

#Create the class.
sql_createClass($_SESSION["NUM"], $NAME, $YEAR, $PERIOD, $TERM, $DESCRIPTOR);

#Redirect using some Javascript
header("JS-Redirect: classes");

db_showError("Ok!", "The class has been created.", "", 201);