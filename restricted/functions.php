<?php
if(!isset($needsFunction)) die();

/**
 * This function lists all of the classes in a formatted list.
 *
 * $classname The HTML class name for each button (used for JQuery binding in access.js)
 * $data 2D array output from the database
 * $type The css type of the list. Curently available: "selectable" - generic grey "destroy" - Appears red "create" - Appears green. 
 *		 "selectable" by default
 */
function fun_listClasses($classname, $data, $type = "selectable") {
	foreach($data as $row) { ?>
		<a class="<?php echo $classname; ?> object <?php echo $type; ?>" href="#" data-num="<?php echo $row["NUM"] ?>">
		<div class="arrow"></div>
			<h3>
			<?php 

			#Outputs the classes
			echo htmlentities($row["NAME"]) . "<br><div class='monospace'>" .
			"Year " . $row["YEAR"] . "<br>" .
			"Term " . $row["TERM"] . "<br>" . 
			htmlentities($row["PERIOD"]) . 
			($row["DESCRIPTOR"] !== "" ? " <br>(" . htmlentities($row["DESCRIPTOR"]) . ")</div> " : " "); 
			?>
			</h3>
		</a>
		<?php 
	}
}

/**
 * This function creates a formatted list of all of the students.
 *
 * $classname The HTML class name for each button (used for JQuery binding in access.js)
 * $students 2D array output from the database (you must call the database yourself!)
 * $selectable True if the objects can be selected, false otherwise. True by default.
 */
function fun_listStudents($classname, $students, $selectable = true) {
	foreach($students as $row) {  ?>
		<?php if ($selectable) { ?>
			<a class="<?php echo $classname;?> object selectable" href="#" data-num="<?php echo $row["NUM"] ?>">
			<div class='arrow'></div>
		<?php } else { ?>
			<div class="object">
		<?php } ?>
			
		<h3>
		<?php 
		
		#Student information
		echo 
		htmlentities($row["LAST_NAME"]) . ", " . 
		htmlentities($row["FIRST_NAME"]) . 
		htmlentities(($row["NICK_NAME"] !== "" ? " (" . $row["NICK_NAME"] . ") " : " ")) .
		"<br><div class='monospace'>[" . 
		htmlentities($row["USERNAME"]) . "]</div> ";	
		?> 
		</h3>
			
		<?php echo ($selectable ? "</a>" : "</div>"); 
	}
}

/**
 * This function creates a formatted list of all of the rubrics.
 *
 * $classname The HTML class name for each button (used for JQuery binding in access.js)
 * $rubrics 2D array output from the database (you must call the database yourself!)
 */
function fun_listRubrics($classname, $rubrics) {
	foreach($rubrics as $row) {  ?>
		<a class="<?php echo $classname;?> object selectable" href="#" data-num="<?php echo $row["NUM"] ?>"><div class='arrow'></div>
			<h3>
			<?php 
			#rubric information
			echo htmlentities($row["SUBTITLE"]) . "</div><br><div class='monospace'>" . 
			$row["MAX_POINTS_PER_CRITERIA"] . " points per criteria, <br>" . 
			$row["TOTAL_POINTS"] . " points possible.</div>";
			?> 
			</h3>
		</a>
		<?php
	}
}

/**
 * This function creates a formatted list of all of the assignments.
 *
 * $classname: The HTML class name for each button (used for JQuery binding in access.js)
 * $assignments: 2D array output from the database (you must call the database yourself!)
 */
function fun_listAssignments($classname, $assignments) {
	foreach($assignments as $row) {  ?>
		<a class="<?php echo $classname;?> object selectable" href="#" data-num="<?php echo $row["NUM"] ?>"><div class='arrow'></div>
			<h3>
			<?php echo htmlentities($row["TITLE"]); ?> 
			</h3>
		</a><?php
	}
}

/**
 * This function creates a formatted list of all of the qualities in a rubric.
 *
 * $classname The HTML class name for each button (used for JQuery binding in access.js)
 * $qualities 2D array output from the database (you must call the database yourself!)
 * $maxpointspercriteria Is the maximum points that a student can obtain per criteria.
 */
function fun_listQuality($classname, $qualities, $maxpointspercriteria, $type = "") {
	
	#Show a header
	?>
	<div class="objectborder">
		<div class="inlinesmall left subtext">
			<div class="pad">Points</div>
		</div><div class="inlinelarge subtext">
			<div class="pad">Name</div>
		</div>
	</div>
	<?php
	
	#Run through all of the entries and output them.
	foreach($qualities as $row) {
	
		#Parse some of the parameters to deturmine how to encapsilate the data.
		echo ($type=="" ? "<div" : "<a") . " class='$classname objectborder $type' href='#' data-qualitynum='" . $row["NUM"] . "'>"; 
			
			#Output the HTML body. ?>
			<div class="inlinesmall left">
				<div class="pad">
					<div class='larger'>
						<?php echo $row["POINTS"]; ?>
					</div><div class='smaller'>
						/<?php echo $maxpointspercriteria; ?>
					</div>
				</div>
			</div><div class="inlinelarge">
				<div class="pad">
					<?php echo htmlentities($row["QUALITY_TITLE"]); ?>
					<?php echo ($type=="" ? "" : "<div class='arrow'></div>");?>
				</div>
			</div>
		<?php echo ($type=="" ? "</div>" : "</a>");
	}
}

/**
 * This function creates a formatted list of all of the criterion in a rubric.
 * Very simple.
 *
 * $classname The HTML class name for each button (used for JQuery binding in access.js)
 * $criterion 2D array output from the database (you must call the database yourself!)
 * $rubricnum The number of the rubric that we got the criteria from.
 */
function fun_listCriterion($classname, $criterion, $type = "", $rubricnum) {
	foreach($criterion as $row) {  
		
		#Begin div or anchor if type is set
		echo ($type=="" ? "<div" : "<a") . " class='$classname object white $type' href='#' data-rubricnum='" . $rubricnum . "' data-criterionnum='" . $row["NUM"] . "'>";
		
			#output arrow if type is set.
			echo ($type=="" ? "" : "<div class='arrow'></div>");
			
			#output contents
			echo "<h3>" . htmlentities($row["CRITERIA_TITLE"]) . "</h3>";
			
		#End type.
		echo ($type==""?"</div>":"</a>");
	}
}

/**
 * Function that prints a "rubric like" table to give an example
 * to a user of the section they are editing. For example, with 
 * a Qualities table, they'll see the top row of the example rubric
 * hilighted. 
 *
 * When they are editing the qualities section, they'll 
 * then see a hilighted example of the section they are editing.
 */
function fun_createExampleTableQualities() {
?>
<div class="object subtext">
	<p>In a normal rubric, this section represents the cells colored in blue, as pictured below:</p>
</div>
<div class="padbox">
	<table class="example">
		<tr>
			<td class="dark"></td>
			<td class="selectedexample">👎</td>
			<td class="selectedexample">👍</td>
			<td class="selectedexample">💯</td>
		</tr>
		<tr>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
		</tr>
		<tr>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
		</tr>
		<tr>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
		</tr>
	</table>
</div>
<?php
}

/**
 * Another function that creates an example table. See createExampleTableQualities()
 */
function fun_createExampleTableCriteria() {
?>
<div class="object subtext">
	<p>In a normal rubric, this section represents the cells colored in blue, as pictured below:</p>
</div>
<div class="padbox">
	<table class="example">
		<tr>
			<td class="dark"></td>
			<td></td>
			<td></td>
			<td></td>
		</tr>
		<tr>
			<td class="selectedexample">📗</td>
			<td></td>
			<td></td>
			<td></td>
		</tr>
		<tr>
			<td class="selectedexample">📘</td>
			<td></td>
			<td></td>
			<td></td>
		</tr>
		<tr>
			<td class="selectedexample">📙</td>
			<td></td>
			<td></td>
			<td></td>
		</tr>
	</table>
</div>
<?php
}

/**
 * This function takes some component number and creates a compiled symbol tree from it.
 * A compiled symbol tree is "CSASPC.I.A.1.i" for example. This method will look at the
 * symbol of the passed number, then it's parent, then the parent of it's parent, and so
 * on, until it reaches the root.
 *
 * It's possible that this method could strain the database. I honestly have no idea.
 *
 * returns: A two dementional array where the first dimension is a list of steps it took
 *			to obtain the parent component and the second dimension is an array with the
 *			keys "TREE" and "NUM". "TREE" represents the symbol tree of the "NUM"th element.
 */
function fun_getCompiledSymbolTree($teacherNum, $num) {
	global $conn;
	$tree = array();
	
	//Main query used to select each component.
	$stmt = $conn->prepare("SELECT NUM, SYMBOL, PARENT_NUM FROM COMPONENT WHERE TEACHER_NUM = :teacher AND NUM = :num");
	
	//Run the select at least once.
	do {
		$stmt->execute(array('teacher' => $teacherNum, 'num' => $num));
		$count = $stmt->rowCount();
		
		//if it exists...
		if($count == 1) {
			$component = $stmt->fetch();
			
			//If the parent is the ROOT
			if($component["PARENT_NUM"] == null) {
				
				//Create a new sub array with indexes NUM and TREE.
				array_push($tree, array("NUM" => $component["NUM"], "TREE" => ""));
				
				//foreach tree value we need to prepend the current symbol to the other symbols we have been adding.
				foreach($tree as $key => $compile) {
					$tree[$key]["TREE"] = $component["SYMBOL"] . $compile["TREE"];
				}
				break;
				
			//Otherwise it's just a child.
			} else {
				
				//Create a new sub array with indexes NUM and TREE.
				array_push($tree, array("NUM" => $component["NUM"], "TREE" => ""));
				
				//foreach tree add the symbol to the front of it. Note. the first iteration there will be
				//one element (the array above that we pushed) so there will be one symbol in the tree spot.
				//Next loop we add the symbol to this one and the next one. 
				
				//Help for future me:
				//Iteration 1: 0: TREE: .a
				
				//Iteration 2: 0: TREE: .i.a
				//			   1: TREE: .i
				
				//Iteration 3: 0: TREE: .1.i.a
				//			   1: TREE: .1.i
				//			   2: TREE: .1
				//etc.
				foreach($tree as $key => $compile) {
					$tree[$key]["TREE"] = "." . $component["SYMBOL"] . $compile["TREE"];
				}
				$num = $component["PARENT_NUM"];
			}
		} else {
			
			//Something happened where the teacher does not have the rights to that component.
			showError("Whoops!", "That component doesn't belong to you.", "Try refreshing the page to fix the problem.", 400);
		}
	} while(true);
	return $tree;
}
?>