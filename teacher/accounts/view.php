<?php
#Libraries.
$needsFunction = true;
include "../../restricted/headaccount.php";
include "../../restricted/functions.php";

#Show some general information about the student. ?>
<div class="object subtitle">
	<h2>Editing: <?php echo htmlentities($student["LAST_NAME"]) . ", " . htmlentities($student["FIRST_NAME"]); ?></h2>
</div>
<div class="object subtext">
	<p>Username: <?php echo htmlentities($student["USERNAME"]); ?>.
	<p>Password: <?php echo ($student["PASSWORD"] == "CHANGE" ? "No password set" : "Yes");  ?>.
	<p>Nick Name: <?php if($student["NICK_NAME"] != "") {echo htmlentities($student["NICK_NAME"]);} else {echo "None given";} ?>.
	<p>Grade level: <?php echo $student["GRADE"]; ?>.
	<p>Extra information: <?php if($student["EXTRA"] != "") {echo htmlentities($student["EXTRA"]);} else {echo "None given";} ?>.
</div><?php

#Do not display the ability to reset the password if the password is reset already!
if($student["PASSWORD"] != "CHANGE") { ?>
	<a id="js_accounts_view_reset" class="object warn white" href="#" data-studentnum="<?php echo $student["NUM"]; ?>">
		<div class="arrow"></div>
		<h3>Reset password</h3>
	</a><?php 
}

#Add the ability to unbind the account from the teacher. ?>
<a id="js_accounts_view_unbind" class="object warn white" href="#" data-studentnum="<?php echo $student["NUM"]; ?>">
	<div class="arrow"></div>
	<h3>Unbind account</h3>
</a>

<div class="object subtitle">
	<a href="#" data-document="CLASSMGMT" class="js_help"><img class="help" src="images/help.svg" alt="Help" title="Help"></a>
	<h2>Classes:</h2>
</div>

<a id="js_accounts_view_addclass" class="object create" href="#" data-studentnum="<?php echo $student["NUM"]; ?>"><div class="arrow"></div>
	<h3>Add to class</h3>
</a><?php

#Gets a list of classes that the student belongs to in relation to the currently logged in teacher.
$classes = sql_getAllStudentClasses($_SESSION['NUM'], $student["NUM"]);

#If there are no classes
if($classes == null) {	

	#Show a tip to add a student to a class. ?>
	<div class="object subtext">
		<p>Use the button above to add the student to a class.
	</div><?php
} else {
	
	#Print every class.
	fun_listClasses("js_accounts_view_removeclass", $classes, "warn", "Drop student from "); ?>
	<div class="object subtext">
		<p>You can add a student to as many classes as you wish.
	</div><?php
}
