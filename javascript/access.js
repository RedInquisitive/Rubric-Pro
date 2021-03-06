//======================================================================================================
//======================================= GLOBAL VARIABLES BELOW =======================================
//======================================================================================================

//The current tier the application is working with.
var currentTier = 0;

//The text of a rubric editor cell when the user first clicks on the cell.
var rubricEditStartText = "";

//true if the console is being shown.
var consoleShown = false;

//allowed to set only when data is present on the screen
var cssWindowSetAllowed = true;

//locked from resetting when loading data.
var cssWindowStateLocked = false;

//size of the window screen scrollbar.
var cssWindowSize = 0;

var cssWindowAimationCount = 0;


//======================================================================================================
//======================================= STATIC VARIABLES BELOW =======================================
//======================================================================================================

//50px to correct slight scroll ups.
var LOG_DEADZONE = 50;

//The shortest the body of a response ccan be before being considered an "Error".
var MINIMUM_BODY_LENGTH = 30;

//Requiered header in all HTML responses. 
var DIV_REQUIRED = '<div class="object subtitle">';

//Header sent by PHP for deturmining the size of a tier.
var HEADER_RESIZE = "JS-Resize";

//Header sent by PHP for redirecting a user.
var HEADER_REDIRECT = "JS-Redirect";

//Default of blue gears.
var BACKGROUND_EDIT_IMAGE_LOAD = "url('/images/gears.svg')";

//Default of a red X.
var BACKGROUND_EDIT_IMAGE_ERROR = "url('/images/error.svg')"; 

//Default of a green Check.
var BACKGROUND_EDIT_IMAGE_SUCCESS = "url('/images/success.svg')";

//Time to wait until green check is hidden.
var TIME_HIDE_SUCCESS = 1500; 

//Amount of padding that appears to the right of the last tier. Needs to be the inverse
//of the value that appears in the CSS value "#content>:last-child". 1.0 = no change.
var RIGHT_SPACE_MULTIPLYER = 0.9;

//If you change the value here, update it in style.PHP as well!
var CONSOLE_HEIGHT = 90;

//width of the modal that appears at the top right. Make sure to change in css too (.modal)
var MODAL_WIDTH = "300px";

//time for the modal to stick around
var MODAL_TIME = 5000;





//======================================================================================================
//========================================== MAIN CODE BELOW ===========================================
//======================================================================================================

//http://stackoverflow.com/a/12034334
var entityMap = {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': '&quot;', "'": '&#39;', "/": '&#x2F;'};

/**
 * Because all browsers are special snowflakes, I use this method to get the
 * height of the MAIN bottom scrollbar in the application.
 */
function getScrollerHeight() {
	return $("#contentscroller").height() - $("#content").height();
}

/**
 * This function fixes the position of the "Show developer console" button.
 */
function fixDevConsoleHeight() {
	setTimeout(function(){
		$("#js_consoleshow").css("bottom", ((consoleShown ? CONSOLE_HEIGHT : -1) + 1 + getScrollerHeight()) + "px");
	}, 20); //Wait 20ms because Internet Explorer is special.
}

/**
 * Scrolls the whole page to 
 */
function scrollPage() {
	//get full width of page
	var innerwidth = 0;
	$('#content').children().each(function() {
		innerwidth += $(this).outerWidth(false);
	});
	
	//get position I need to set
	var delta = innerwidth - $('#contentscroller').outerWidth(false) * RIGHT_SPACE_MULTIPLYER;
	if(delta < 0) delta = 0;
	
	cssWindowStateLocked = false;
	cssWindowSetAllowed = true;
	cssWindowAimationCount++;
	
	//scroll the page.
	$('#contentscroller').animate({scrollLeft: delta}, 400, "swing", function() {
		cssWindowAimationCount--;
		//we need to remove that temporary padding.
		if(!cssWindowStateLocked && cssWindowSetAllowed && cssWindowAimationCount == 0){
			$('#content').css("min-width", "");
			cssWindowSize = 0;
		}
		
		//Removing min width may remove a scrollbar!
		fixDevConsoleHeight();
	});
	
	//Adding contents may create a scrollbar!
	fixDevConsoleHeight();
}

/**
 * Removes bad user input to prevent accidental html from being parsed into the console.
 */
function escapeHtml(string) {
  return String(string).replace(/[&<>"'\/]/g, function (s) {
    return entityMap[s];
  });
}

/**
 * Adds a zero to the left of a number. 0 -> 00, 9 -> 09, 23 -> 23.
 */
function padTwo(number) {
	var input = "" + number;
	var pad = "00";
	return pad.substring(0, pad.length - input.length) + input;
}

/**
 * Jump the console window to the bottom.
 */
function jumplog() {
    $("#logbar").scrollTop($("#console").outerHeight(true) - $("#logbar").innerHeight());
}

/**
 * Check to see if the console window is already at the bottom.
 */
function isAtBottom() {
    return $("#logbar").scrollTop() + $("#logbar").innerHeight() >= $("#console").outerHeight(true) - LOG_DEADZONE;
}

/**
 * Logs a message to the console at the bottom of the page.
 *
 * If the user has scrolled away from the bottom, a small box to
 * prompt the user to "View new messages" will appear. Otherwise, this function
 * will automatically scroll the console window.
 */
function log(caller, message) {
	var wasAtBottom = isAtBottom();
	var date = new Date(); 
	var time = "[" + padTwo(date.getHours()) + ":" + padTwo(date.getMinutes()) + ":" + padTwo(date.getSeconds()) + "]";
	$("#console").append(time + " [" + caller + "]: " + escapeHtml(message) + "<br>\n");
	if (wasAtBottom) {
		jumplog();
		$("#js_consolebottom").css("display","none"); //If we are at the bottom, remove the box used to jump to the bottom.
	} else {
		$("#js_consolebottom").css("display","block");
	}
}

/**
 * Removes all tiers that are greater than  the specified tier.
 *
 * This function then updates currentTier with the passed parameter.
 * A tier is a colum that appears in the editor, so the "navbar" is tier 0,
 * the settings that appear from the navbar is tier 1,
 * and the settings that appear from those settings is tier 2,
 * and the settings that appear from those settings that appeared from those settings are tier 3.
 * You get the point.
 */
function removeToTier(tier) {

	//get full width of page to we can lock the content div to that width at minimum
	//We'll unlock this in the append server response section.
	var innerwidth = 0;
	$('#content').children().each(function() {
		innerwidth += $(this).outerWidth(true);
	});
	
	cssWindowStateLocked = true;
	if(cssWindowSetAllowed || cssWindowSize < innerwidth) {
		cssWindowSetAllowed = false;
		cssWindowSize = innerwidth;
		$('#content').css("min-width", innerwidth + "px");
	}

	
	//remove tiers.
	for(var remove = currentTier; remove > tier; remove--) {
		$("#tier" + remove).remove();
	}
	if(tier <= 0) {
		tier = 0;
	}
	currentTier = tier + 1;
}

/** 
 * Creates a new tier in the DOM. Auto removes any tiers that should not exist
 * by calling removeToTier().
 *
 * tier: The tier is the tier of the caller, if we are calling from tier "0", then data will be created in tier1.
 * name: The title that will appear at the top of the tier.
 */
function createTier(tier, name) {
	
	//remove all the other tiers that come after the current tier.
	removeToTier(tier);
	
	//procede to next tier.
	tier = tier + 1;
	
	var append = '<div class="bar" id="tier' + tier + '">';
	
	if(name != "") {
		append = '<div class="bar" id="tier' + tier + '"><div class="title"><h1>' + name + '</h1></div></div>';
	}
	
	//create the tier.
	$("#content").append(append).find("#tier" + tier).hide().fadeIn("normal");
	
	//Remove the white space between inline-block elements (to prevent gaps)
	$("#content").contents().filter(function () {
		return this.nodeType === 3;
	}).remove();
	
	//New tier might create a scrollbar before contents arrive!
	fixDevConsoleHeight();
}

/**
 * Appends a server response to a tier and scroll page.
 *
 * tier: The tier we wish to append to.
 * data: The data we wish to append (basically raw HTML).
 */
function appendServerResponse(tier, data) {
	if(!$("#tier" + tier).data("appended")) {
		$("#tier" + tier).data("appended", true);
		$("#tier" + tier).append(data);
		$(".datepicker").datepicker({
			inline: true,
			nextText: '&rarr;',
			prevText: '&larr;',
			showOtherMonths: true,
			dateFormat: 'mm/dd/yy',
			dayNamesMin: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
		});
		scrollPage();
	} else {
		log("JQUERY/warning", "Callback blocked because data was likely already appended!");
	}
}

/**
 * Creates a new modal box, shows it for some time,
 * then destroys itself.
 *
 * data: The data we wish to show (basically raw HTML)
 */
function modalAppendServerResponse(data) {
	var modal = $("<div class='modal'>" + data + "</div>").appendTo("body");
	modal.animate({left: "0"}, 400, "swing", function() {
		setTimeout(function(){
			modal.animate({left: "-" + MODAL_WIDTH}, 400, "swing", function(){
				modal.remove();
			});
		}, MODAL_TIME);
	});
}

/**
 * Parses the PHP headers of the obtained data.
 * xhr: The AJAX response.
 * returns true if the new tier should be supressed or not.
 */
function parseServerHeaders(tier, xhr) {
	var supressMessage = false;
	
	//If the server says to resize this dynamically
	if(xhr.getResponseHeader(HEADER_RESIZE) == "auto") {
		$("#tier" + tier).css("max-width", "none");
		$("#tier" + tier).css("width", "auto");
	}
	
	//Parse static header responses.
	switch(xhr.getResponseHeader(HEADER_REDIRECT)) {
		case "account":
			doAccounts();
			supressMessage = true;
			break;
		case "classes":
			doClass();
			supressMessage = true;
			break;
		case "components":
			doComponents();
			supressMessage = true;
			break;
		case "rubrics":
			doRubrics();
			supressMessage = true;
			break;
		case "assignment":
			doAssignments();
			supressMessage = true;
	}
	
	//Parse dynamic tier removal tool.
	if(xhr.getResponseHeader(HEADER_REDIRECT) != undefined &&
	   xhr.getResponseHeader(HEADER_REDIRECT).substring(0,8) == "removeto") {
		var removeTier = xhr.getResponseHeader(HEADER_REDIRECT).substring(8);
		var number = parseInt(removeTier);
		
		//If the tier we want to remove is some positive number, then 
		//we remove everything AFTER that tier.
		if(number > 0 && number < 999) {
			
			//need to find something to click on to reset the tier.
			var foundClickable = false;
			
			//auto click on the selected element if found.
			$("#tier" + number).children().each(function(){
				if($(this).attr("select") == "true") {
					$(this).trigger("click");
					foundClickable = true;
				}
			});
			
			//if we don't delete the things anyway.
			if(!foundClickable) {
				removeToTier(number);
			}
			
			supressMessage = true;
		}
		
		//If the tier we want to remove is some negative number, then
		//we remove the amount of tiers leftwards from the current tier.
		//For example, if we are at tier 4, and we get -1, then we keep everything
		//up to tier 3.
		if(number < 0 && number > -999) {
			
			var foundClickable = false;
			
			if(currentTier + number <= 0) {
				
				//If we are removing something that takes us to the sidebar or beyond, select the sidebar.
				$("#navigation").children().each(function(){
					if($(this).attr("select") == "true") {
						$(this).trigger("click");
						foundClickable = true;
					}
				});
			} else {
				
				//Otherwise, just select the current tier.
				$("#tier" + (currentTier + number)).children().each(function(){
					if($(this).attr("select") == "true") {
						$(this).trigger("click");
						foundClickable = true;
					}
				});
			}
			
			if(!foundClickable) {
				removeToTier(currentTier + number); //note to self, number is negative
			}
			
			supressMessage = true;
		}
	}
	return supressMessage;
}
 
/**
 * Takes a server response and does some loose parsing.
 *
 * title: The title we wish to log. This makes it easier for the user to see what is happening.
 * data: The data we wish to parse.
 * errorcode: The HTML error code.
 *
 * Returns an object with the raw HTML as "html", a boolean error as "error"
 * and a human readable form of the error code as "human". 
 */
function parseServerResponse(title, data, errorcode) {

	//If the data is too short
	if(data.length < MINIMUM_BODY_LENGTH) {
		log("AJAX/server", "Fatal error requesting data for " + title + ".");
		return {html: 
		'<div class="object subtitle"><h2>Programming Error</h2></div>' +
		'<div class="object subtext">' +
			'<p>An error in the programming occured.' +
			'<p>The server returned an empty response.' +
		'</div>', 
		error: true,
		human: ["An error in the programming occured.", "The server returned an empty response."]};
		
	//else if the data does not have ther right div header.
	} else if(data.indexOf(DIV_REQUIRED) === -1) {
		
		//If the server sent 200 OK but the div was not sent, change the errorcode.
		if(errorcode == "OK") {
			errorcode = "Invalid response. The server sent data, but the format was not standard.";
		}
		
		log("AJAX/server", "Fatal error requesting data for " + title + ".");
		return {html: 
		'<div class="object subtitle"><h2>Undefined Error</h2></div>' +
		'<div class="object subtext">' +
			'<p>An undefined error in the application occured.' +
			'<p>The server returned a non-empty and non-standard response.' +
			'<p>General information: ' + errorcode +
		'</div>',
		error: true,
		human: ["An undefined error in the application occured.", 
				"The server returned a non-empty and non-standard response.", 
				"General information: " + errorcode]};
		
	//else the data has the right header...
	} else {
		
		//and it's successfull
		if(errorcode == "OK") {
			log("AJAX/server", "Obtained data successfully for " + title + ".");
			return {html: data,
			error: false,
			human: ["Success!"]};
		} else {
			log("AJAX/server", "Fatal error requesting data for " + title + ".");
			return {html: data,
			error: true,
			human: [errorcode]};
		}
	}
}

/**
 * Performs an AJAX request on the server.
 *
 * tier: "tier" is the tier of the caller, so if we are calling from tier "0", this will insert into the newly created tier1.
 * path: The path in the webserver.
 * post: Extra server params.
 * callback: Instead of writing the contents of the response to a new tier, write the 
 *           parsed server response to first parameter of this method instead. Leave 
 *			 undefined if you wish to create a new tier.
 */
function callServer(tier, path, post, callback) {
	NProgress.start();
	
	//procede to next tier.
	tier = tier + 1;
	$("#tier" + tier).addClass("gears");
	params = {AJAX: true};
	if(post !== undefined) {
		params = $.extend({}, params, post);
	}

	$.ajax({
		type: "POST",
		url: path,
		data: params,
		success: function(data, textStatus, xhr) {
			
			//parse headers.
			var supressMessage = parseServerHeaders(tier, xhr);
			
			//parse server response.
			var parse = parseServerResponse(path, data, "OK");
			if(callback == undefined) {
				if(supressMessage == false) {
					appendServerResponse(tier, parse.html);
				} else {
					modalAppendServerResponse(parse.html);
				}
			} else {
				callback(parse);
			}
			NProgress.done();
			$("#tier" + tier).removeClass("gears");
		},
		error: function(xhr, status, error) {
			
			//parse server response.
			var parse = parseServerResponse(path, xhr.responseText, error);
			if(callback == undefined) {
				appendServerResponse(tier, parse.html);
			} else {
				callback(parse);
			}
			NProgress.done();
			$("#tier" + tier).removeClass("gears");
		}
	});
}

/**
 * Used for sending specific searches to the database.
 * tier is the tier to create the result on.
 * tiername is the tier's name
 * dir is the path on the webserver to query
 * searchbox is the html ID of the search box.
 * database is the database we are searching. Exclusively for the user.
 * where is the is the variable
 */
function search(tier, tiername, dir, searchbox, database, where) {
	var tier = 0;
	var search = $(searchbox).val();
	log("JQUERY/user", "You searched the " + database + " database where the " + where + " is: " + search);
	createTier(tier, tiername);
	callServer(tier, dir, {SEARCH: search, WHERE: where});
}

/**
 * Changes the color when a user clicks on an element. 
 */
function changeColor(tier, object) {
	if(object.parent().attr('id') == "navigation") {
		
		//If we are looking at the navigation bar, we need to handle it specially
		//because we are not in a "tier" yet.
		$('#navigation').children().each(function () {
			$(this).removeClass('selectedsidebar');
			$(this).removeAttr("select");
		});
		
		//We'll set it to black.
		object.addClass("selectedsidebar");
		object.attr("select", "true");
	} else {
		
		//In a tier, it's fairly modular.
		var remove = $('#tier' + tier + " .selectedpath");
		remove.removeClass('selectedpath');
		remove.removeAttr("select");
		
		//Gradient.
		object.addClass("selectedpath");
		object.attr("select", "true");
	}
}

//"View new messages" button.
$(document).on('click', '#js_consolebottom', function(e) {
	jumplog();
	log("JQUERY/user", "New messages are above. The console will now automatically scroll as new messages appear.");
	return false;
});

//"Show dev console" button.
$(document).on('click', '#js_consoleshow', function(e) {
	if(consoleShown == false) {
		$("#logbar").animate({"height": CONSOLE_HEIGHT + "px"});
		$("#logbar").css("display", "block");
		$("#contentscroller").animate({"bottom": CONSOLE_HEIGHT + "px"});
		$("#js_consoleshow").animate({"bottom": (CONSOLE_HEIGHT + 1 + getScrollerHeight()) + "px"});
		$("#js_consoleshow").html("Hide developer console");
		jumplog();
		log("WELCOME/user", "Welcome to Rubric Pro! Actions you perform will appear down here.");
		consoleShown = true;
	} else {
		$("#logbar").animate({"height": "0"});
		$("#contentscroller").animate({"bottom": "0"}, 400, "swing", function() {$("#logbar").css("display", "none");});
		$("#js_consoleshow").animate({"bottom": getScrollerHeight() + "px"});
		$("#js_consoleshow").html("Show developer console");
		consoleShown = false;
	}
	return false;
});

//Anything that has to do with help
$(document).on('click', '.js_help', function(e) {
	var tier = parseInt($(this).parent().parent().attr('id').substring(4)); 
	log("JQUERY/user", "The user requested help.");
	createTier(tier, "Help");
	callServer(tier, "/help.php",
	{
		DOCUMENT: $(this).data('document')
	});
	return false;
});

//======================================================================================================
//=============Stuff beyond this point is used for sending and getting data from the server=============
//======================================================================================================


//Special cases: The search function replaces "tier 0", so even though it's called from a "tier 0"
//object, it belongs as a root function.
//Accounts tab: search accounts by username.
$(document).on('click', '#js_accounts_search_username', function(e) {
	search(0, "Accounts", "/teacher/accounts.php", "#js_accounts_search", "student", "USERNAME");
	return false;
});
//Accounts tab: search accounts by last name.
$(document).on('click', '#js_accounts_search_last', function(e) {
	search(0, "Accounts", "/teacher/accounts.php", "#js_accounts_search", "student", "LAST");
	return false;
});
//Accounts tab: search accounts by first name.
$(document).on('click', '#js_accounts_search_first', function(e) {
	search(0, "Accounts", "/teacher/accounts.php", "#js_accounts_search", "student", "FIRST");
	return false;
});
//Rubrics tab: search rubrics by name.
$(document).on('click', '#js_rubrics_search', function(e) {
	search(0, "Rubrics", "/teacher/rubrics.php", "#js_rubrics_search_box", "rubrics", "NAME");
	return false;
});
//Assignments tab: search assignment by name.
$(document).on('click', '#js_assignments_search', function(e) {
	search(0, "Assignments", "/teacher/assignment.php", "#js_assignments_search_box", "assignment", "NAME");
	return false;
});

//Sidebar: Accounts tab. 
//Bound to function because it can be called during a JS-Redirect: account
function doAccounts(e, callback) {
	var tier = 0; //This function originates from the sidebar, a tier 0 item.
	changeColor(tier, $("#js_accounts"));
	createTier(tier, "Accounts");
	log("JQUERY/user", "Accounts");
	callServer(tier, "/teacher/accounts.php", undefined, (callback == undefined ? undefined : callback));
	return false;
}
$(document).on('click', '#js_accounts', doAccounts);
	//Accounts tab: Create accounts
	$(document).on('click', '#js_accounts_create', function(e) {
		var tier = 1; 
		changeColor(tier, $(this));
		createTier(tier, "Create a new account");
		log("JQUERY/user", "Accounts > Create");
		callServer(tier, "/teacher/accounts/create.php");
		return false;
	});
		//Create accounts: submit
		$(document).on('click', '#js_accounts_create_submit', function(e) {
			var tier = 2;
			changeColor(tier, $(this));
			createTier(tier, "Submitting...");
			log("JQUERY/user", "Accounts > Create > Submit");
			callServer(tier, "/teacher/accounts/create/submit.php", 
			{
				USERNAME: $("#username").val(),
				LAST_NAME: $("#last").val(),
				FIRST_NAME: $("#first").val(),
				NICK_NAME: $("#nick").val(),
				GRADE: $("#grade").val(),
				EXTRA: $("#comment").val()
			});
			return false;
		});
			//Submit: bind
			$(document).on('click', '#js_accounts_create_submit_bind', function(e) {
				var tier = 3;
				changeColor(tier, $(this));
				createTier(tier, "Binding...");
				log("JQUERY/user", "Accounts > Create > Submit > Bind");
				callServer(tier, "/teacher/accounts/create/submit/bind.php",
				{
					STUDENT_NUM: $(this).data('studentnum'),
					USERNAME: $(this).data('username')
				});
				return false;
			});
	//Accounts tab: view
	$(document).on('click', '.js_accounts_view', function(e) {
		var tier = 1;
		changeColor(tier, $(this));
		createTier(tier, "View");
		log("JQUERY/user", "Accounts > View");
		callServer(tier, "/teacher/accounts/view.php",
		{
			STUDENT_NUM: $(this).data('studentnum')
		});
		return false;
	});
		//view: add to class
		$(document).on('click', '#js_accounts_view_addclass', function(e) {
			var tier = 2;
			changeColor(tier, $(this));
			createTier(tier, "Pick a class");
			log("JQUERY/user", "Accounts > View > Add to Class");
			callServer(tier, "/teacher/accounts/view/addclass.php",
			{
				STUDENT_NUM: $(this).data('studentnum')
			});
			return false;
		});
			//add to class: actual selection of the class
			$(document).on('click', '.js_accounts_view_addclass_select', function(e) {
				var tier = 3;
				changeColor(tier, $(this));
				createTier(tier, "Adding...");
				log("JQUERY/user", "Accounts > View > Add to Class > Select");
				callServer(tier, "/teacher/accounts/view/addclass/select.php",
				{
					//Student is found from previous tier ID.
					STUDENT_NUM: $("#js_accounts_view_addclass").data('studentnum'),
					
					//Class is the current data entry for the clicked object when this class is selected.
					CLASS_NUM: $(this).data('classnum')
				});
				return false;
			});
		//view: removal from a class
		$(document).on('click', '.js_accounts_view_removeclass', function(e) {
			var tier = 2;
			changeColor(tier, $(this));
			createTier(tier, "Removing...");
			log("JQUERY/user", "Accounts > View > Drop from Class ");
			callServer(tier, "/teacher/accounts/view/removeclass.php",
			{
				//Student is found from the unbind account field. A little bit hacky.
				STUDENT_NUM: $("#js_accounts_view_unbind").data('studentnum'),
				
				//Class is found natively in the button.
				CLASS_NUM: $(this).data('classnum')
			});
			return false;
		});
		//view: reset password
		$(document).on('click', '#js_accounts_view_reset', function(e) {
			var tier = 2; 
			changeColor(tier, $(this));
			createTier(tier, "Reset Password");
			log("JQUERY/user", "Accounts > View > Reset Password");
			callServer(tier, "/teacher/accounts/view/reset.php",
			{
				STUDENT_NUM: $(this).data('studentnum')
			});
			return false;
		});
			//reset password: agree!
			$(document).on('click', '#js_accounts_view_reset_select', function(e) {
				var tier = 3;
				changeColor(tier, $(this));
				createTier(tier, "Resetting...");
				log("JQUERY/user", "Accounts > View > Reset Password > Select");
				callServer(tier, "/teacher/accounts/view/reset/select.php",
				{
					STUDENT_NUM: $(this).data('studentnum')
				});
				return false;
			});
		//view: unblind account
		$(document).on('click', '#js_accounts_view_unbind', function(e) {
			var tier = 2;
			changeColor(tier, $(this));
			createTier(tier, "Unbind account");
			log("JQUERY/user", "Accounts > Student > Unbind Account");
			callServer(tier, "/teacher/accounts/view/unbind.php",
			{
				STUDENT_NUM: $(this).data('studentnum')
			});
			return false;
		});
			//unblind account: agree!
			$(document).on('click', '#js_accounts_view_unbind_select', function(e) {
				var tier = 3; 
				changeColor(tier, $(this));
				createTier(tier, "Unbound!");
				log("JQUERY/user", "Accounts > Student > Unbind Account > Select");
				callServer(tier, "/teacher/accounts/view/unbind/select.php",
				{
					STUDENT_NUM: $(this).data('studentnum')
				});
				return false;
			});

//Sidebar: Classes tab.
//Function used during a JS-Redirect: classes
function doClass(e) {
	var tier = 0;
	log("JQUERY/user", "Classes");
	changeColor(tier, $(this));
	createTier(tier, "Classes");
	callServer(tier, "/teacher/classes.php");
	return false;
}
$(document).on('click', '#js_classes', doClass);
	//Classes tab: create
	$(document).on('click', '#js_classes_create', function(e) {
		var tier = 1; 
		log("JQUERY/user", "Classes > Create");
		changeColor(tier, $(this));
		createTier(tier, "Create a new class");
		callServer(tier, "/teacher/classes/create.php");
		return false;
	});
		//create: submit
		$(document).on('click', '#js_classes_create_submit', function(e) {
			var tier = 2; 
			log("JQUERY/user", "Classes > Create > Submit");
			changeColor(tier, $(this));
			createTier(tier, "Creating...");
			callServer(tier, "/teacher/classes/create/submit.php",
			{
				NAME: $("#classname").val(),
				YEAR: $("#year").val(),
				TERM: $("#term").val(),
				PERIOD: $("#period").val(),
				DESCRIPTOR: $("#descriptor").val(),
			});
			return false;
		});
	//Classes tab: editor
	$(document).on('click', '.js_classes_edit', function(e) {
		var tier = 1; 
		log("JQUERY/user", "Classes > View");
		changeColor(tier, $(this));
		createTier(tier, "View");
		callServer(tier, "/teacher/classes/view.php",
		{
			CLASS_NUM: $(this).data('classnum')
		});
		return false;
	});
		//editor: students
		$(document).on('click', '.js_assignments_view_link_grade', function(e) {
			var tier = 2; 
			log("JQUERY/user", "Classes > View > Students");
			changeColor(tier, $(this));
			createTier(tier, $(this).parent().find("h3").html());
			callServer(tier, "/teacher/classes/view/students.php",
			{
				CLASS_NUM: $(".js_classes_edit.selectedpath").data('classnum'),
				ASSIGNMENT_NUM: $(this).data("assignmentnum")
			});
			return false;
		});
			//students: grade
			$(document).on('click', '.js_classes_edit_students_grade', function(e) {
				var tier = 3; 
				log("JQUERY/user", "Classes > View > Students > Grade");
				changeColor(tier, $(this));
				createTier(tier, $(this).find("h3").html());
				callServer(tier, "/teacher/classes/view/students/grade.php",
				{
					CLASS_NUM: $(".js_classes_edit.selectedpath").data('classnum'),
					ASSIGNMENT_NUM: $(".js_assignments_view_link_grade.selectedpath").data('assignmentnum'),
					STUDENT_NUM: $(this).data("studentnum")
				});
				return false;
			});
				$(document).on('click', ".rubriccell", function(e) {
					$("#" + $(this).parent().attr("id")).children().each(function() {
						$(this).removeClass("rubricselected scoreisleft scoreisright scoreisbeyond"); 
					});
					clicked = $(this);
					points = 0;
					clicked.addClass("rubricselected"); 
					$(".rubricquality").each(function(){
						if(clicked.data("qualitynum") == $(this).data("qualitynum")) {
							points = $(this).data("points");
						}
					});
					$(".points").each(function(){
						if(clicked.data("criterianum") == $(this).data("criterianum")) {
							$(this).val(points);
						}
					});
					return false;
				});
				$(document).on('change', ".points", function(e) {
					var changed = $(this);
					if(!$.isNumeric(changed.val())) return;
					var changedPoints = Number(changed.val());
					var cells = [];
					$(".rubriccell").each(function(){
						if(changed.data("criterianum") == $(this).data("criterianum")) {
							var found = $(this);
							var points = 0;
							$(".rubricquality").each(function(){
								if(found.data("qualitynum") == $(this).data("qualitynum")) {
									points = $(this).data("points");
								}
							});
							cells.push({
								object: found,
								value: Number(points)
							});
						}
					});
					cells.sort(function(a, b){
						return a.value - b.value;
					});
					for(var i = 0; i < cells.length; i++) {
						if(i == 0) {
							$("#" + cells[i].object.parent().attr("id")).children().each(function() {
								$(this).removeClass("rubricselected scoreisleft scoreisright scoreisbeyond"); 
							});
						}
						if(changedPoints <= cells[i].value) {
							if(changedPoints == cells[i].value || i == 0) {
								//if it matches
								cells[i].object.addClass("rubricselected"); 
								return false;
							} else {
								cells[i].object.addClass("rubricselected scoreisleft"); 
								cells[i-1].object.addClass("rubricselected scoreisright"); 
								return false;
							}
						}
					}
					cells[cells.length-1].object.addClass("rubricselected scoreisbeyond"); 
					return false;
				});
		//editor: Click on an assignment link
		$(document).on('click', '.js_assignments_view_link', function(e) {
			var tier = 0; 
			var assignmentNum = $(this).data('assignmentnum');
			doAssignments("", function(parse){
				appendServerResponse(tier + 1, parse.html);
				$(".js_assignments_view").each(function(){
					if($(this).data("assignmentnum") == assignmentNum) {
						$(this).trigger("click");
					}
				});
			});
			return false;
		});
		//editor: Click on a student link
		$(document).on('click', '.js_accounts_view_link', function(e) {
			var tier = 0; 
			var studentNum = $(this).data('studentnum');
			doAccounts("", function(parse){
				appendServerResponse(tier + 1, parse.html);
				$(".js_accounts_view").each(function(){
					if($(this).data("studentnum") == studentNum) {
						$(this).trigger("click");
					}
				});
			});
			return false;
		});

//Sidebar: Components tab.
//Function used during a JS-Redirect: components
function doComponents(e) {
	var tier = 0;
	changeColor(tier, $(this));
	createTier(tier, "Components");
	log("JQUERY/user", "Components");
	callServer(tier, "/teacher/components.php");
	return false;
}
$(document).on('click', '#js_components', doComponents);
	//Components tab: select
	$(document).on('click', '.js_components_select', function(e) {
		//It's impossible to tell what tier we will be on when we select a component,
		//so we select the previous tier and call it a day.
		var tier = parseInt($(this).parent().attr('id').substring(4)); 
		log("JQUERY/user", "Components > Select");
		changeColor(tier, $(this));
		createTier(tier, "");
		callServer(tier, "/teacher/components.php",
		{
			COMPONENT_NUM: $(this).data('componentnum')
		});
		return false;
	});
	//Components tab: create
	$(document).on('click', '.js_components_create', function(e) {
		var tier = parseInt($(this).parent().attr('id').substring(4)); 
		changeColor(tier, $(this));
		createTier(tier, "Create New Component");
		log("JQUERY/user", "Components > Create");
		callServer(tier, "/teacher/components/create.php",
		{
			PARENT_NUM: $(this).data('componentnum')
		});
		return false;
	});
		//create: submit
		$(document).on('click', '#js_components_create_submit', function(e) {
			var tier = parseInt($(this).parent().attr('id').substring(4)); 
			changeColor(tier, $(this));
			createTier(tier, "Submitting...");
			log("JQUERY/user", "Components > Create > Submit");
			callServer(tier, "/teacher/components/create/submit.php",
			{
				PARENT_NUM: $(this).data('parentnum'),
				SYMBOL: $("#symbol").val(),
				NAME: $("#componentname").val(),
				DESCRIPTION: $("#description").val()
			});
			return false;
		});
		
//Sidebar: Rubrics tab.
//Function used during a JS-Redirect: rubrics
function doRubrics(e, callback) {
	var tier = 0;
	changeColor(tier, $("#js_rubrics"));
	createTier(tier, "Rubrics");
	log("JQUERY/user", "Rubrics");
	callServer(tier, "/teacher/rubrics.php", undefined, (callback == undefined ? undefined : callback));
	return false;
}
$(document).on('click', '#js_rubrics', doRubrics);
	//Rubrics tab: create
	$(document).on('click', '#js_rubrics_create', function(e) {
		var tier = 1;
		changeColor(tier, $(this));
		createTier(tier, "Create New Rubric");
		log("JQUERY/user", "Rubrics > Create");
		callServer(tier, "/teacher/rubrics/create.php");
		return false;
	});
		//create: submit
		$(document).on('click', '#js_rubrics_create_submit', function(e) {
			var tier = 2;
			changeColor(tier, $(this));
			createTier(tier, "Submitting...");
			log("JQUERY/user", "Rubrics > Create > Submit");
			callServer(tier, "/teacher/rubrics/create/submit.php",
			{
				MAX_POINTS_PER_CRITERIA: $("#maxpoints").val(),
				SUBTITLE: $("#subtitle").val()
			});
			return false;
		});
	//Rubrics tab: view
	$(document).on('click', '.js_rubrics_view', function(e) {
		var tier = 1;
		changeColor(tier, $(this));
		createTier(tier, "View");
		log("JQUERY/user", "Rubrics > View");
		callServer(tier, "/teacher/rubrics/view.php",
		{
			RUBRIC_NUM: $(this).data('rubricnum')
		});
		return false;
	});
		//view: addquality
		$(document).on('click', '#js_rubrics_view_addquality', function(e) {
			var tier = 2;
			changeColor(tier, $(this));
			createTier(tier, "New Quality");
			log("JQUERY/user", "Rubrics > View > Add Quality");
			callServer(tier, "/teacher/rubrics/view/addquality.php",
			{
				RUBRIC_NUM: $(this).data('rubricnum')
			});
			return false;
		});
			//addquality: submit
			$(document).on('click', '#js_rubrics_view_addquality_submit', function(e) {
				var tier = 3;
				changeColor(tier, $(this));
				createTier(tier, "Submitting...");
				log("JQUERY/user", "Rubrics > View > Add Quality > Submit");
				callServer(tier, "/teacher/rubrics/view/addquality/submit.php",
				{
					RUBRIC_NUM: $(this).data('rubricnum'),
					QUALITY_TITLE: $("#qualityname").val(),
					POINTS: $("#qualitypoints").val(),
				});
				return false;
			});
		//view: addcriteria
		$(document).on('click', '#js_rubrics_view_addcriteria', function(e) {
			var tier = 2;
			changeColor(tier, $(this));
			createTier(tier, "New Criterion");
			log("JQUERY/user", "Rubrics > View > Add Criteria");
			callServer(tier, "/teacher/rubrics/view/addcriteria.php", 
			{
				RUBRIC_NUM: $(this).data('rubricnum')
			});
			return false;
		});
			//addcriteria: submit
			$(document).on('click', '#js_rubrics_view_addcriteria_submit', function(e) {
				var tier = 3;
				changeColor(tier, $(this));
				createTier(tier, "Submitting...");
				log("JQUERY/user", "Rubrics > View > Add Criteria > Submit");
				callServer(tier, "/teacher/rubrics/view/addcriteria/submit.php",
				{
					RUBRIC_NUM: $(this).data('rubricnum'),
					CRITERIA_TITLE: $("#criterianame").val()
				});
				return false;
			});
			//addcriteria: addcomponent
			$(document).on('click', '.js_rubrics_view_addcriteria_component', function(e) {
				//Basically like the regular components function.
				var tier = parseInt($(this).parent().attr('id').substring(4)); 
				changeColor(tier, $(this));
				createTier(tier, "");
				log("JQUERY/user", "Rubrics > View > Add Criteria > Component");
				callServer(tier, "/teacher/rubrics/view/addcriteria/component.php",
				{
					COMPONENT_NUM: $(this).data('componentnum'),
					CRITERIA_NUM: $(this).data('criterionnum'),
				});
				return false;
			});
				//addcomponent: select
				$(document).on('click', '.js_rubrics_view_addcriteria_component_select', function(e) {
					var tier = parseInt($(this).parent().attr('id').substring(4)); 
					changeColor(tier, $(this));
					createTier(tier, "Selecting...");
					log("JQUERY/user", "Rubrics > Edit > Add Criteria > Component > Select");
					callServer(tier, "/teacher/rubrics/view/addcriteria/component/select.php", 
					{
						COMPONENT_NUM: $(this).data('componentnum'),
						CRITERIA_NUM: $(this).data('criterionnum'),
					});
					return false;
				});
		//view: addassignnment 
		$(document).on('click', '#js_rubrics_view_addassignment', function(e) {
			var tier = 2;
			changeColor(tier, $(this));
			createTier(tier, "Pick an assignment");
			log("JQUERY/user", "Rubrics > View > Add Assignment");
			callServer(tier, "/teacher/rubrics/view/addassignment.php", 
			{
				RUBRIC_NUM: $(this).data('rubricnum')
			});
			return false;
		});
			//addassignnment: submit 
			$(document).on('click', '.js_rubrics_view_addassignment_select', function(e) {
				var tier = 3;
				changeColor(tier, $(this));
				createTier(tier, "Selecting...");
				log("JQUERY/user", "Rubrics > View > Add Assignment > Select");
				callServer(tier, "/teacher/rubrics/view/addassignment/select.php", 
				{
					RUBRIC_NUM: $(this).data('rubricnum'),
					ASSIGNMENT_NUM: $(this).data('assignmentnum')
				});
				return false;
			});
		//edit: removeassignment 
		$(document).on('click', '.js_rubrics_view_removeassignment', function(e) {
			var tier = 2;
			changeColor(tier, $(this));
			createTier(tier, "Selecting...");
			log("JQUERY/user", "Rubrics > View > Remove Assignment");
			callServer(tier, "/teacher/rubrics/view/removeassignment.php", 
			{
				RUBRIC_NUM: $(this).data('rubricnum'),
				ASSIGNMENT_NUM: $(this).data('assignmentnum')
			});
			return false;
		});
		//edit: editrubric
		$(document).on('click', '#js_rubrics_view_editrubric', function(e) {
			var tier = 2;
			log("JQUERY/user", "Rubrics > View > Build");
			changeColor(tier, $(this));
			createTier(tier, "Builder");
			callServer(tier, "/teacher/rubrics/view/build.php", 
			{
				RUBRIC_NUM: $(this).data('rubricnum')
			});
			return false;
		});
			//editrubric: click into any box.
			$(document).on('focus', '.rubricbox', function(e) {
				log("EDIT/user", "Editing box at quality " + $(this).data('quality') + " and criteria " + $(this).data('criteria') + 
				" with contents '" +  $(this).val() + "'.");
				
				//Update the starting text so we can see if it changed later.
				rubricEditStartText = $(this).val();
				return false;
			});
			//editrubric: click outside of any box.
			$(document).on('blur', '.rubricbox', function(e) {
				var tier = 3;
				var textbox = $(this);
				
				//check if changed.
				if(rubricEditStartText == textbox.val()) {
					return false;
				} else {
					log("EDIT/user", "Publishing changes at quality " + textbox.data('quality') + " and criteria " + textbox.data('criteria') + 
					" with contents '" +  textbox.val() + "'.");
					
					//change to gear icon
					textbox.css("background-repeat", "no-repeat");
					textbox.css("background-position", "center");
					textbox.css("background-size", "70px");
					textbox.css("background-image", BACKGROUND_EDIT_IMAGE_LOAD);
				}
				
				//if changed, publish to the server.
				callServer(0, "/teacher/rubrics/view/build/update.php", 
				{
					RUBRIC_NUM: textbox.data('rubricnum'),
					RUBRIC_QUALITY_NUM: textbox.data('quality'),
					RUBRIC_CRITERIA_NUM: textbox.data('criteria'),
					CONTENTS: textbox.val()
				}, function(parse) {
					if(parse.error == true) {
						textbox.css("background-image", BACKGROUND_EDIT_IMAGE_ERROR);
						
						//In case we hit an error code
						createTier(tier, "Error!");
						appendServerResponse(tier + 1, parse.html);
					} else {
						textbox.css("background-image", BACKGROUND_EDIT_IMAGE_SUCCESS);
						setTimeout(function() {
							textbox.css("background-image", "");
						}, TIME_HIDE_SUCCESS);	
					}
				});
				return false;
			});
			$(document).on('click', '#js_rubrics_view_build_import', function(e) {
				var importtext = $("#importer").val().split(/[\t\n]/);
				delay = 0;
				$('.rubricbox').each(function(i, obj) {
					obj = $(this);
					setTimeout(function() {
						if(importtext[i] == undefined || !obj.exists()) return false;
						obj.val(importtext[i]);
						rubricEditStartText = "5bf1fd927dfb8679496a2e6cf00cbe50c1c87145";
						obj.trigger("blur");
					}, delay += 100);
				});
				$("#importer").val("");
				return false;
			});
//Sidebar: Assignment tab.
//Function used during a JS-Redirect: assignment
function doAssignments(e, callback) {
	var tier = 0;
	changeColor(tier, $("#js_assignments"));
	createTier(tier, "Assignments");
	log("JQUERY/user", "Assignments");
	callServer(tier, "/teacher/assignment.php", undefined, (callback == undefined ? undefined : callback));
	return false;
}
$(document).on('click', '#js_assignments', doAssignments);
	//Assignment tab: create
	$(document).on('click', '#js_assignment_create', function(e) {
		var tier = 1;
		changeColor(tier, $(this));
		createTier(tier, "Create New Assignment");
		log("JQUERY/user", "Assignments > Create");
		callServer(tier, "/teacher/assignment/create.php");
		return false;
	});
		//create: submit
		$(document).on('click', '#js_assignment_create_submit', function(e) {
			var tier = 2;
			changeColor(tier, $(this));
			createTier(tier, "Submitting...");
			log("JQUERY/user", "Assignment > Create > Submit");
			callServer(tier, "/teacher/assignment/create/submit.php",
			{
				TITLE: $("#title").val(),
				DESCRIPTION: $("#description").val()
			});
			return false;
		});
	//Assignment tab: view
	$(document).on('click', '.js_assignments_view', function(e) {
		var tier = 1;
		changeColor(tier, $(this));
		createTier(tier, "View");
		log("JQUERY/user", "Assignment > View");
		callServer(tier, "/teacher/assignment/view.php",
		{
			ASSIGNMENT_NUM: $(this).data('assignmentnum')
		});
		return false;
	});
		//view: addclass 
		$(document).on('click', '#js_assignment_view_addclass', function(e) {
			var tier = 2;
			changeColor(tier, $(this));
			createTier(tier, "Pick a Class");
			log("JQUERY/user", "Assignment > View > Add Class");
			callServer(tier, "/teacher/assignment/view/addclass.php", 
			{
				ASSIGNMENT_NUM: $(this).data('assignmentnum')
			});
			return false;
		});
			//addclass: select 
			$(document).on('click', '.js_assignments_view_addclass_select', function(e) {
				var tier = 3;
				changeColor(tier, $(this));
				createTier(tier, "Selecting...");
				log("JQUERY/user", "Assignment > View > Add Class > Select");
				callServer(tier, "/teacher/assignment/view/addclass/select.php", 
				{
					ASSIGNMENT_NUM: $(this).data('assignmentnum'),
					CLASS_NUM: $(this).data('classnum'),
					DUE_DATE: $("#js_assignments_addclass_datepick").val()
				});
				return false;
			});
		//view: removeclass 
		$(document).on('click', '.js_assignment_view_removeclasses', function(e) {
			var tier = 2;
			changeColor(tier, $(this));
			createTier(tier, "Removing...");
			log("JQUERY/user", "Assignment > View > Remove Class");
			callServer(tier, "/teacher/assignment/view/removeclass.php", 
			{
				ASSIGNMENT_NUM: $(this).data('assignmentnum'),
				CLASS_NUM: $(this).data('classnum')
			});
			return false;
		});
		//view: Click on an rubric link
		$(document).on('click', '.js_rubrics_view_link', function(e) {
			var tier = 0; 
			var rubricNum = $(this).data('rubricnum');
			doRubrics("", function(parse){
				appendServerResponse(tier + 1, parse.html);
				$("#tier1").children().each(function(){
					if($(this).data("rubricnum") == rubricNum) {
						$(this).trigger("click");
					}
				});
			});
			return false;
		});

//http://stackoverflow.com/a/920322
$.fn.exists = function () {
    return this.length !== 0;
}