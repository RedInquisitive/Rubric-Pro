<?php
include "passwd.php";

#Logs a user out of the page.
function db_logout() {
	if(isset($_SESSION['VALID'])) { 
		$_SESSION['VALID'] = false; #Makes sure the session is killed.
	}
	session_destroy();
	header("Location: /index.php");
}

#Shows an error code.
function db_showError($title = "Error", $header = "An unknown error occured.", $subheader = "Sorry about that :(", $status = 500, $returnToLogin = false) {
	http_response_code($status);
	if(!(isset($_POST["AJAX"]))) {  #If we are not using AJAX, send the normal html. ?>
<!DOCTYPE html>
<head>
	<title><?php echo $title; ?></title>
	<link rel="stylesheet" href="/css/login.css"> 
	<link href="https://fonts.googleapis.com/css?family=Josefin+Sans" rel="stylesheet"> 
	<meta charset="UTF-8">
	<meta name="author" content="Aaron Walter (2016)">
	<meta name="description" content="<?php echo $title; ?>">
</head>
<body>
	<div id="login">
		<img id="logo" src="/images/logo.svg" alt="Rubric Pro">
		<h1><?php echo $header; ?></h1>
		<h2><?php echo $subheader; ?></h2>
		<a href="/">Back to login page</a>
	</div>
</body>
<?php
	} else {
?>
<div class="object subtitle"><h2><?php echo $title; ?></h2></div>
<div class="object subtext">
	<p><?php echo $header; ?>
	<p><?php echo $subheader; ?>
</div>
<?php 	if($returnToLogin) { ?>
<a class="object warn white" href="/"><div class="arrow"></div><h3>Return to login.</h3></a>
<?php
		}
	}
	die();	
}

#Begin the session
session_start();

#Check the session
$sessionSet = isset($_SESSION['VALID']) && isset($_SESSION['TIMESTAMP']) && isset($_SESSION["USERNAME"]);

#Stop the page load if needsAuthentication is UNSET
if(!isset($needsAuthentication)) {
	db_showError("Server Error", "It was unable to be deturmined if this page requires authentication.", "Tell an administrator to fix this!", 500);
}

#Stop the page load if needsAJAX is UNSET
if(!isset($needsAJAX)) {
	db_showError("Server Error", "It was unable to be deturmined if this page requires AJAX.", "Tell an administrator to fix this!", 500);
}

#Stop the page load if needsTeacher is UNSET
if(!isset($needsTeacher)) {
	db_showError("Server Error", "It was unable to be deturmined if this page requires teacher level authentication.", "Tell an administrator to fix this!", 500);
}

#Stop the page load if we cannot connect to the database
try {
	$conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password); #login
	$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); #Enable errors
} catch(PDOException $e) {
	db_showError("Database Error", "An error occured when connecting to the database.", "Sorry about that :(", 500);
}

#If we need authentication to view this page....
if($needsAuthentication) {
	
	#Stop the page load if something is not set or the session is not valid.
	if(!$sessionSet || !$_SESSION["VALID"]) {
		db_logout(); #If something is broke, make sure they really are logged out!
		db_showError("Forbidden", "You need to be logged in to do that!", "Sorry :(", 403, true);
	}
	
	#Stop the page load if the user timed out.
	if(strtotime(date("Y-m-d H:i:s")) - strtotime($_SESSION['TIMESTAMP']) > 60*60) {
		db_logout();
		db_showError("Timed Out", "Your session timed out.", "Sorry :/", 403, true);
	}
}

#If we need AJAX to view the page...
if($needsAJAX) {
	
	#Stop the page load if we need ajax, but don't have the post check (Basically dumb user check, anybody can "fool" this).
	if(!(isset($_POST["AJAX"]))) {
		db_showError("Requires AJAX", "This page is not meant to be read by a human.", "Try to be a robot next time.", 400);
	}
}

#If we need to be a teacher and we are not then stop page load.
if($needsTeacher && $_SESSION["TYPE"] !== "TEACHER") {
	db_showError("Requires higher authentication", "Only a teacher may request this page.", null, 400, true);
}
?>