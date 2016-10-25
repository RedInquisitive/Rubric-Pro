<?php
$CLASS = isset($_POST["CLASS"]) ? $_POST["CLASS"] : "";

include "../../restricted/view_verify.php";

###################################

$classname = "Unknown";

if($CLASS == "") {
	showError("Whoops!", "You didn't select a class!", "Try selecting a class first.", 400);
}

#Check if the teacher owns the class
if(!doesTeacherOwnClass($_SESSION["NUM"], $CLASS, $classname)) {
	showError("Whoops!", "You can't add a student to a class that doesn't belong to you!", "Try selecting another class.", 400);
}

#If there is a duplicate, deny it.
#We don't need 10,000 of the same entry
if(doesStudentAlreadyExistInClass($STUDENT, $CLASS)) {
	showError("Whoops!", "That student already belongs in that class!", "Try selecting another class or student.", 400);
}

#Use access.js to clear all things after tier 1 (so the user doesn't loose their search)
header("JS-Redirect: removeto1");

#Bind!
bindStudentToClass($STUDENT, $CLASS);

#Show that it's been bound
showError("Ok!", "The acccount has been bound to " . htmlentities($classname) . ".", "", 201);