/* React element library for Bitburner - v0.5.0

	v0.5.0 - Initial release  (Note: Future changes will likely break some things.)
*/

// ToDo: Additional interactive and/or complex HTML elements:
/*	- Text input box (input type="text")
	- Textarea box
	- Table
	- Styled text display via markup (bold, italics, etc.) (?)
	- Image
	- Video
	- Webpage (iframe)
	- URL input box (input type="url")
	- Number spin selector (input type="number")
	- Radio button (input type="radio")
	- Range slider (input type="range")
	- Color selector (input type="color")
	- Datetime selector (input type="datetime-local")
	- Time selector (input type="time")
	- File selector (input type="file") (?)
*/


/* Constants - Start */
/** @type {Document} - NetScript `document` replacement object. */
const doc = eval("document");
/* Constants - End */


/* Utility code - Start */
/**
 * isFunction: Returns if the value is a function.
 *
 * @param	{*}			value	Any value.
 * @returns	{boolean}			Whether the value is a function.
 **/
function isFunction (value) {
	return typeof value === "function";
}

/**
 * isObject: Returns if the value is some type of object.
 *
 * @param	{*}			value	Any value.
 * @returns	{boolean}			Whether the value is an object.
 **/
function isObject (value) {
	return !!value && typeof value === 'object';
}

/**
 * isProperty: Returns if `prop` is a property of the object `obj`.
 *
 * @param	{object}  obj	The object to be tested.
 * @param	{string}  prop	The name of the property to be tested for.
 * @returns	{boolean}		Whether the property was found on the object.
 **/
function isProperty (obj, prop) {
	let result = false;
	if (isObject(obj)) {
		result = obj ? hasOwnProperty.call(obj, prop) : false;
		if (!result) {				 /* if not pass... */
			try {
				if (obj[prop] === undefined) {
					result = false;  /* double-check fail */
				} else {
					result = true;   /* double-check pass */
				}
			} catch(error) {
				result = false;		 /* error fail */
			}
		}
	}
	return result;
}

/**
 * clone: Makes a unique copy of an object.
 *
 * @param	{object}	obj		The object to be copied.
 * @returns	{object}			The copy of the object.
 **/
export function clone (obj) {
	return JSON.parse(JSON.stringify(obj));
}

/**
 * getRandomHexString: Returns a random hexadecimal string of 6 characters.
 *
 * @returns	{string}	Returns a random 6 character hexadecimal string.
 **/
export function getRandomHexString () {
	function random(min, max) {
		if (min > max) {  // Fix it so that min <= max.
			[min, max] = [max, min];
		}
		return Math.round((Math.random() * (max - min)) + min);
	}

	let r = random(0, 255).toString(16), g = random(0, 255).toString(16), b = random(0, 255).toString(16);
	if (r.length === 1) {
		r = "0" + r;
	}
	if (g.length === 1) {
		g = "0" + g;
	}
	if (b.length === 1) {
		b = "0" + b;
	}
	return r + g + b;
}

/**
 * getUniqueID: Returns a unique HTML element ID.
 *
 * @param	{string=}			seedName	(Optional) A suggested ID string.
 * @param	{string|string[]=}	usedNames	(Optional) An array of names that are already going to be used.
 * @param	{Document=}			context		(Optional) The HTML context to use.  Default = the `Document` object
 * @return	{string}						The unique ID.
 **/
export function getUniqueID (seedName, usedNames=[], context) {
	if (!context) {  // Set the context to Document if a context wasn't passed in.
		context = doc;
	}
	if ((typeof seedName != "string") || (seedName.length == 0)) {  // Replace the seedName with "el" if no valid parameter value was given.
		seedName = "el";
	}
	let newName = seedName + "_" + getRandomHexString();
	if (typeof usedNames === 'string' || usedNames instanceof String) {
		usedNames = [usedNames];
	}
	while (context.getElementById(newName) || usedNames.includes(newName)) {  // Look for an ID + hexString which is available.
		newName = seedName + "_" + getRandomHexString();
	}
	return newName;
}

/**
 * runTerminalCommand: Runs the given string in the terminal window.
 *
 * @param	{string}	command		A string with the terminal command(s) to run.
 **/
export function runTerminalCommand (command) {
	let terminalInput = doc.getElementById("terminal-input"), terminalEventHandlerKey = Object.keys(terminalInput)[1];
	terminalInput.value = command;
	terminalInput[terminalEventHandlerKey].onChange({ target: terminalInput });
	setTimeout(function (event) {
		terminalInput.focus();
		terminalInput[terminalEventHandlerKey].onKeyDown({ key: 'Enter', preventDefault: () => 0 });
	}, 0);
};

/**
 * runCommands: Runs the given string as a command.
 *
 * @param	{NS}		ns			The NetScript object.
 * @param	{string}	commands	A string with the terminal command(s) to run.
 * @returns	{Promise}				Returns a Promise object.
 **/
export async function runCommands (ns, commands) {  // deepscan-ignore-line
	let script = "export async function main(ns) { " + commands + "}";
	let fname = "temp_" + getRandomHexString() + ".js";
	while (ns.fileExists(fname, "home") || ns.fileExists(fname, ns.getHostname())) {  // Make sure that the file doesn't already exist.
		fname = "temp_" + getRandomHexString() + ".js";
	}
	ns.write(fname, script);  // Create the temporary file.
	if (ns.getHostname() != "home") {
		ns.mv(fname, ns.getHostname(), "home");
	}
	while (ns.exec(fname, "home") == 0) {  // Run the script.
		await ns.asleep(100);
	}
	await ns.asleep(100);
	while (ns.scriptRunning(fname, "home")) {  // Wait for the script to finish running.
		await ns.asleep(500);
	}
	ns.rm(fname, "home");  // Delete the temporary file.
};

/**
 * addCSS: Add custom CSS to the document.
 **/
export function addCSS () {
	// NOTE: To avoid styling conflicts, please use a different ID (customStyleName) if you copy this code.
	const customStyleName = "rCustomStyles";
	// Also, increment the version each time you change the CSS below, otherwise those changes won't override the current styling.
	const customStyleVersion = "013";
	let customStyles = doc.getElementById(customStyleName);  // To avoid styling conflicts, please use a different ID if you copy this code.
	if (!customStyles || customStyles.getAttribute("version") < customStyleVersion) {  // If it doesn't already exist...
		// ...add some custom CSS to the page.
		if (!customStyles) {  // Create a new <style> element.
			customStyles = doc.createElement('style');
		} else {  // Clear out the existing <style> element.
			while (customStyles.firstChild) {
				customStyles.removeChild(customStyles.firstChild);
			}
		}
		// Add custom CSS. (\n = new line; \t = tab)
		customStyles.appendChild(doc.createTextNode(
					'.rButton {\n'
					+ '	display: inline-flex;\n'
					+ '	-webkit-box-align: center;\n'
					+ '	align-items: center;\n'
					+ '	-webkit-box-pack: center;\n'
					+ '	justify-content: center;\n'
					+ '	position: relative;\n'
					+ '	box-sizing: border-box;\n'
					+ '	-webkit-tap-highlight-color: transparent;\n'
					+ '	outline: 0px;\n'
					+ '	margin: 0px;\n'
					+ '	cursor: pointer;\n'
					+ '	user-select: none;\n'
					+ '	vertical-align: middle;\n'
					+ '	appearance: none;\n'
					+ '	text-decoration: none;\n'
					+ '	text-transform: none;\n'
					+ '	font-family: "Lucida Console", "Lucida Sans Unicode", "Fira Mono", Consolas, "Courier New", Courier, monospace, "Times New Roman";\n'
					+ '	font-weight: 500;\n'
					+ '	font-size: 0.875rem;\n'
					+ '	line-height: 1.75;\n'
					+ '	min-width: 64px;\n'
					+ '	padding: 6px 8px;\n'
					+ '	transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;\n'
					+ '	color: rgb(0, 204, 0);\n'
					+ '	background-color: rgb(51, 51, 51);\n'
					+ '	border: 1px solid rgb(34, 34, 34);\n'
					+ '	border-radius: 0px;\n'
					+ '}\n'
					+ '.rButton:hover {\n'
					+ '	text-decoration: none;\n'
					+ '	background-color: rgb(0, 0, 0);\n'
					+ '}\n'
					+ '.rCheckbox svg {\n'
    				+ '	user-select: none;\n'
    				+ '	width: 1em;\n'
    				+ '	height: 1em;\n'
    				+ '	display: inline-block;\n'
    				+ '	fill: currentcolor;\n'
    				+ '	flex-shrink: 0;\n'
    				+ '	transition: fill 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;\n'
    				+ '	font-size: 1.5rem;\n'
    				+ '	margin-right: 8px;\n'
					+ '}\n'
					+ '.rCBChecked {\n'
					+ '	display: none;\n'
					+ '}\n'
					+ 'input[type="checkbox"]:checked + .rCBChecked {\n'
					+ '	display: inline;\n'
					+ '}\n'
					+ 'input[type="checkbox"]:checked ~ .rCBUnchecked {\n'
					+ '	display: none;\n'
					+ '}\n'
					+ '.rDropdown {\n'
					+ '	display: inline-flex;\n'
					+ '	-webkit-box-align: center;\n'
					+ '	align-items: center;\n'
					+ '	-webkit-box-pack: center;\n'
					+ '	justify-content: center;\n'
					+ '	position: relative;\n'
					+ '	box-sizing: border-box;\n'
					+ '	-webkit-tap-highlight-color: transparent;\n'
					+ '	outline: 0px;\n'
					+ '	margin: 0px;\n'
					+ '	cursor: pointer;\n'
					+ '	user-select: none;\n'
					+ '	vertical-align: middle;\n'
					+ '	appearance: none;\n'
					+ '	text-decoration: none;\n'
					+ '	text-transform: none;\n'
					+ '	font-family: "Lucida Console", "Lucida Sans Unicode", "Fira Mono", Consolas, "Courier New", Courier, monospace, "Times New Roman";\n'
					+ '	font-weight: 500;\n'
					+ '	font-size: 0.875rem;\n'
					+ '	line-height: 1.75;\n'
					+ '	min-width: 64px;\n'
					+ '	padding: 6px 22px 6px 8px;\n'
					+ '	transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;\n'
					+ '	color: rgb(0, 204, 0);\n'
					+ '	background-color: rgb(51, 51, 51);\n'
					+ '	border: 1px solid rgb(34, 34, 34);\n'
					+ '	border-radius: 0px;\n'
					+ '	background-image: linear-gradient(45deg, transparent 50%, rgb(0, 204, 0) 50%), linear-gradient(135deg, rgb(0, 204, 0) 50%, transparent 50%);\n'
					+ '	background-position: calc(100% - 10.5px) calc(1em + 1px), calc(100% - 6px) calc(1em + 1px), 100% 0;\n'
					+ '	background-size: 5px 6px, 5px 6px, 2.5em 2.5em;\n'
					+ '	background-repeat: no-repeat;\n'
					+ '	z-index: 1;\n'
					+ '}\n'
					+ '.rDropdown:hover {\n'
					+ '	background-color: rgb(0, 0, 0);\n'
					+ '}\n'
					+ '.rLink {\n'
					+ '	text-decoration: underline;\n'
					+ '	cursor: pointer;\n'
					+ '}\n'
					+ '.rLink:hover {\n'
					+ '	filter: brightness(1.5);\n'
					+ '}\n'
					));
		customStyles.id = customStyleName;
		customStyles.type = "text/css";
		customStyles.setAttribute("version", customStyleVersion);
		doc.getElementsByTagName("head")[0].appendChild(customStyles);  // Append the new CSS styling to the document.
	}
}
/* Utility code - End */


/* React element creation functions - Start */
const defaultStyle = {};  // Modify this if you want a different default styling for all of your React elements.  e.g. const defaultStyle = { color: "red" };

/**
 * rAudio: Create a React audio element.
 *
 * @param	{string}	source			The audio source.  This can be a URL or a base64-encoded music file.
 * @param	{string=}	id				**(Optional)** A unique HTML element ID.
 * @param	{object=}	style			**(Optional)** An object containing pairs of CSS styling properties (in camel case) and values.
 * @param	{string}	[altText=""]	**(Optional)** Text visible when hovering the mouse over this element.
 * @returns	{React.ReactNode}
 **/
export function rAudio (source, id = "", style = defaultStyle, altText = "") {
	let audioStyle = clone(defaultStyle);
	if (style != undefined) {
		audioStyle = Object.assign(audioStyle, style);  // Merge the style parameter's values into the default styling.
	}
	if (id == "" || id == undefined) {
		id = getUniqueID("rAudio");
	}
	let rProps = { className: "rAudio", controls: "controls", src: source, style: audioStyle, id: id };
	if (altText) rProps.title = altText;
	return React.createElement('audio', rProps);
}

/**
 * rBreak: Create a React line break.
 *
 * @returns {React.ReactNode}
 **/
export function rBreak () {
	return React.createElement("br", {}, undefined);
}

/**
 * rButton: Create a React button element that triggers a callback.
 *
 * @param	{string}	text			The text shown in the link.
 * @param	{Function=}	trigger			**(Optional)** The event handler function to call when the link is clicked.  `.id` and `.text` properties can be accessed from the event parameter.
 * @param	{string=}	id				**(Optional)** A unique HTML element ID.
 * @param	{object=}	style			**(Optional)** An object containing pairs of CSS styling property names (in camel case) and their values.
 * @param	{string}	[altText=""]	**(Optional)** Text visible when hovering the mouse over this element.
 * @returns	{React.ReactNode}
 **/
export function rButton (text, trigger, id = "", style = defaultStyle, altText = "") {
	let buttonStyle = clone(defaultStyle);
	if (style != undefined) {
		buttonStyle = Object.assign(buttonStyle, style);  // Merge the style parameter's values into the default styling.
	}
	if (id == "" || id == undefined) {
		id = getUniqueID("rButton");
	}
	/** @type {React.Attributes & React.ClassAttributes<...> | null} */
	let rProps = { className: "rButton", style: buttonStyle, id: id };
	if (isFunction(trigger)) {  // Add an event handler.
		rProps.onClick = function (/** @type {Event} */ event) {  // Add custom event properties for simplicity.
			event.text = event.target.textContent;
			event.id = event.target.id;
			trigger(event);
		};
	}
	if (altText) rProps.title = altText;
	return React.createElement("button", rProps, text);
}

/**
 * rCheckbox: Create a React checkbox element that triggers a callback.
 *
 * @param	{string}	label			The label for the checkbox.
 * @param	{Function=}	trigger			**(Optional)** The function to call when the link is clicked.  `.id`, `.label`, and `.checked` properties can be accessed from the event parameter.
 * @param	{boolean=}	checked			**(Optional)** Determines if the checkbox starts out checked.  (Defaults to `false`.)
 * @param	{string=}	id				**(Optional)** A unique HTML element ID.
 * @param	{object=}	style			**(Optional)** An object containing pairs of CSS styling property names (in camel case) and their values.
 * @param	{string}	[altText=""]	**(Optional)** Text visible when hovering the mouse over this element.
 * @returns	{React.ReactNode}
 **/
export function rCheckbox (label, trigger, checked = false, id = "", style = defaultStyle, altText = "") {
	function rSVGx (svgContent, spanClass) {  // Placeholder function for creating a React SVG element.
		let rSVGElement = React.createElement("svg", { className: "MuiSvgIcon-root MuiSvgIcon-fontSizeMedium", style: { verticalAlign: "middle" },
			focusable: "false", ariaHidden: "true", viewBox: "0 0 24 24" }, React.createElement("path", { d: svgContent }));
		let spanProps = { className: "MuiTypography-root MuiTypography-body1 " + spanClass };
		return React.createElement("span", spanProps, rSVGElement);
	}

	// let uncheckedCB = '<svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CheckBoxOutlineBlankIcon"><path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"></path></svg>';
	let uncheckedCB = "M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z";
	// let checkedCB = '<svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CheckBoxIcon"><path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path></svg>';
	let checkedCB = "M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z";
	let checkboxStyle = clone(defaultStyle);
	if (style != undefined) {
		checkboxStyle = Object.assign(checkboxStyle, style);  // Merge the style parameter's values into the default styling.
	}
	if (id == "" || id == undefined) {
		id = getUniqueID("rCheckbox");
	}
	let labelProps = { className: "rCheckbox", style: checkboxStyle };
	if (altText) labelProps.title = altText;
	let rCBProps = { type: "checkbox", style: { display: "none" }, id: id };
	if (checked) rCBProps.defaultChecked = true;
	if (isFunction(trigger)) {  // Add an event handler.
		rCBProps.onClick = function (/** @type {Event} */ event) {  // Add custom event properties for simplicity.
			event.checked = event.target.checked;
			event.label = label;
			event.id = event.target.id;
			trigger(event);
		};
	}
	// This uses a hidden checkbox with two SVG images which are made visible or hidden based on the `checked` state of that checkbox to customize its appearance.
	return React.createElement("label", labelProps, React.createElement("input", rCBProps), rSVGx(checkedCB, "rCBChecked"), rSVGx(uncheckedCB, "rCBUnchecked"), label);
}
/**
 * rCheckboxValue: Get the `checked` value of the checkbox element related to the given ID.
 *
 * @param	{string}				id	The ID of the checkbox element to get the `checked` value from.
 * @returns	{boolean | undefined}		Whether the checkbox is checked, or `undefined` if a checkbox with that ID is not found.
 **/
export function rCheckboxValue (id) {
	if (doc.getElementById(id) != null && isProperty(doc.getElementById(id), "checked")) {
		return doc.getElementById(id).checked;
	} else {
		return undefined;
	}
}

/**
 * @typedef		{Object} 						DropdownItems
 * @property	{string}						text
 * @property	{(string | boolean | number)}	value
 **/
/**
 * rDropdown: Create a React dropdown list element that triggers a callback.
 *
 * @param	{DropdownItems[]}	dropdownItems	The text shown in the link.
 * @param	{Function}			trigger			The function to call when the selection changes.
 * @param	{string=}			label			**(Optional)** A label for the dropdown list.  Defaults to an empty string (no label).
 * @param	{number=}			defaultIndex	**(Optional)** The default dropdown entry to select.  Defaults to `0` (the first entry).
 * @param	{object=}			style			**(Optional)** An object containing pairs of CSS styling property names (in camel case) and their values.
 * @param	{string=}			id				**(Optional)** A unique HTML element ID.
 * @returns	{React.ReactNode}
 **/
export function rDropdown (dropdownItems, trigger, label, defaultIndex = 0, style = defaultStyle, id = "") {
	/* isNumber: Returns if a value is a number. */
	function isNumber (value) {
		return (typeof value === "number") && Number.isFinite(value) && (!Number.isNaN(value));
	}

	let dropdownStyle = clone(defaultStyle);
	if (style != undefined) {
		dropdownStyle = Object.assign(dropdownStyle, style);  // Merge the style parameter's values into the default styling.
	}
	if (!isNumber(defaultIndex) || !Number.isInteger(defaultIndex) || defaultIndex >= dropdownItems.length) {  // If it's not a valid index number...
		defaultIndex = 0;  // ...start on the first item.
	}
	if (id == "" || id == undefined) {
		id = getUniqueID("rDropdown");
	}
	let optionList = [];
	for (let i = 0; i < dropdownItems.length; i++) {  // Generate the options within the dropdown list.
		if (i == defaultIndex) {
			optionList.push(React.createElement("option", { value: dropdownItems[i].value, selected: "selected" }, dropdownItems[i].text));
		} else {
			optionList.push(React.createElement("option", { value: dropdownItems[i].value }, dropdownItems[i].text));
		}
	}
	// ToDo: Create an intermediary event handler which adds the element ID, value, text, and maybe a reference to the HTML element.
	let ddElement = React.createElement("select", { style: dropdownStyle, className: "rDropdown", onChange: trigger, id: id }, ...optionList);  // Create the dropdown element.
	if (label == "") {
		return React.createElement("span", { className: "rDropdownWrapper" }, ddElement);
	} else {
		return React.createElement("span", { className: "rDropdownWrapper" }, React.createElement("label", { htmlFor: id }, label), ddElement);
	}
}
/**
 * rDropdownValue: Returns the value of the currently selected dropdown HTML element referred to by the ID passed.  Returns `undefined` if a value is not found.
 *
 * @param	{string}	id	HTML element ID.
 * @returns	{*}				Either the value of the currently selected element or `undefined` if not found.
 **/
export function rDropdownValue (id) {
	if (doc.getElementById(id) != null) {
		return doc.getElementById(id).value;
	} else {
		return undefined;
	}
}
/**
 * rDropdownText: Returns the value of the currently selected dropdown HTML element referred to by the ID passed.  Returns `undefined` if a value is not found.
 *
 * @param	{string}	id	HTML element ID.
 * @returns	{*}				Either the value of the currently selected element or `undefined` if not found.
 **/
export function rDropdownText (id) {
	if (doc.getElementById(id) != null) {
		return doc.querySelector('#' + id + ' [value="' + doc.getElementById(id).value + '"]').text;
	} else {
		return undefined;
	}
}

/**
 * rEmoji: Simple method for correctly displaying emoji characters.
 *
 * @param	{string}	text	A string of text including emoji characters.
 * @returns	{React.ReactNode}
 **/
export function rEmoji (text) {
	return rText(text, { "font-family": "emoji" });
}

// Parse an HTML string into React elements.  (Not verified to work with all valid HTML strings.)
// export 
function rHTMLParse (HTMLString) {
	/* See: https://legacy.reactjs.org/docs/dom-elements.html
		x-y       -> xY
		checked   -> defaultChecked
		class     -> className
		for       -> htmlFor
		innerHTML -> dangerouslySetInnerHTML
		style     -> style: { styleName: "value", ... }
		tabindex  -> tabIndex
		value     -> defaultValue (?)

	Boolean attributes:  https://html.spec.whatwg.org/multipage/indices.html#attributes-3
		allowfullscreen -> allowFullscreen (?)
		async
		autofocus
		autoplay
		checked -> defaultChecked: "checked"
		controls
		default
		defer
		disabled -> disabled: "disabled"
		formnovalidate -> formNoValidate (?)
		inert
		ismap -> isMap (?)
		itemscope -> itemScope (?)
		loop
		multiple
		muted
		nomodule -> noModule (?)
		novalidate -> noValidate (?)
		open
		playsinline -> playsInline (?)
		readonly -> readOnly (?)
		required
		reversed
		selected -> selected: "selected"
	*/
}

/**
 * rLinkCL: Create a React link element that runs commands on the command line.
 *
 * @param	{string}	text			The text shown in the link.
 * @param	{string}	command			The terminal command(s) to run when the link is clicked.
 * @param	{object=}	style			**(Optional)** An object containing pairs of CSS styling property names (in camel case) and their values.
 * @param	{string=}	id				**(Optional)** A unique HTML element ID.
 * @param	{string}	[altText=""]	**(Optional)** Text visible when hovering the mouse over this element.
 * @returns	{React.ReactNode}
 **/
export function rLinkCL (text, command, style = defaultStyle, altText = "") {
	let linkStyle = clone(defaultStyle);
	linkStyle = Object.assign(linkStyle, style);  // Merge the style parameter's values into the default styling.
	let rProps = { style: linkStyle, className: "rLink", onClick: function (event) { runTerminalCommand(command); } };
	if (altText) rProps.title = altText;
	return React.createElement("a", rProps, text);
}

/**
 * rLinkFunc: Create a React link element that calls a function.
 *
 * @param	{string}	text			The text shown in the link.
 * @param	{Function}	func			The function to execute when the link is clicked.
 * @param	{object=}	style			**(Optional)** An object containing pairs of CSS styling property names (in camel case) and their values.
 * @param	{string=}	id				**(Optional)** A unique HTML element ID.
 * @param	{string}	[altText=""]	**(Optional)** Text visible when hovering the mouse over this element.
 * @returns	{React.ReactNode}
 **/
export function rLinkFunc (text, func, style = defaultStyle, altText = "") {
	let linkStyle = clone(defaultStyle);
	if (style != undefined) {
		linkStyle = Object.assign(linkStyle, style);  // Merge the style parameter's values into the default styling.
	}
	let rProps = { style: linkStyle, className: "rLink", onClick: func };
	if (altText) rProps.title = altText;
	return React.createElement("a", rProps, text);
}

/**
 * rLinkSC: Create a React link element that runs script commands.
 *
 * @param	{string}	text			The text shown in the link.
 * @param	{string}	command			The command(s) to run when the link is clicked.
 * @param	{NS}		ns				The NetScript object.
 * @param	{object=}	style			**(Optional)** An object containing pairs of CSS styling property names (in camel case) and their values.
 * @param	{string=}	id				**(Optional)** A unique HTML element ID.
 * @param	{string}	[altText=""]	**(Optional)** Text visible when hovering the mouse over this element.
 * @returns	{React.ReactNode}
 **/
export function rLinkSC (text, command, ns, style = defaultStyle, altText = "") {
	let linkStyle = clone(defaultStyle);
	linkStyle = Object.assign(linkStyle, style);  // Merge the style parameter's values into the default styling.
	let rProps = { style: linkStyle, className: "rLink", onClick: function (event) { runCommands(ns, command); } };
	if (altText) rProps.title = altText;
	return React.createElement("a", rProps, text);
}

/**
 * rText: Create a React text element.
 *
 * @param	{string}	text			The text to be shown in the span.
 * @param	{object=}	style			**(Optional)** An object containing pairs of CSS styling property names (in camel case) and their values.
 * @param	{string=}	id				**(Optional)** A unique HTML element ID.
 * @param	{string}	[altText=""]	**(Optional)** Text visible when hovering the mouse over this element.
 * @returns	{React.ReactNode}
 **/
export function rText (text, style = defaultStyle, id = "", altText = "") {
	let textStyle = clone(defaultStyle);
	if (style != undefined) {
		textStyle = Object.assign(textStyle, style);  // Merge the style parameter's values into the default styling.
	}
	let rProps = { style: textStyle };
	if (id) rProps.id = id;
	if (altText) rProps.title = altText;
	return React.createElement("span", rProps, text);
}
/**
 * rTextGet: Gets the text from within an HTML element.  Returns `undefined` if the element isn't found.
 *
 * @param	{string}			id	The ID for the HTML element.
 * @returns {string|undefined}		Returns the text from the given HTML element.
 **/
export function rTextGet (id) {
	if (doc.getElementById(id) == null) {
		return undefined;
	}
	return doc.getElementById(id).textContent;
}
/**
 * rTextSet: Sets the text within an HTML element.  Returns whether the element is found.
 *
 * @param	{string}			id		The ID for the HTML element.
 * @param	{string}			text	The text to set within the HTML element.
 * @returns {string|undefined}			Returns whether the element is found.
 **/
export function rTextSet (id, text) {
	if (doc.getElementById(id) == null) {
		return false;
	}
	doc.getElementById(id).textContent = text;
	return true;
}

// Text colors:
export function rCyan (text) {
	return rText(text, { color: "#0ff" });
}

export function rGreen (text) {
	return rText(text, { color: "#0c0" });
}

export function rMagenta (text) {
	return rText(text, { color: "#f0f" });
}

export function rRed (text) {
	return rText(text, { color: "#f00" });
}

export function rWhite (text) {
	return rText(text, { color: "#fff" });
}

export function rYellow (text) {
	return rText(text, { color: "#ff0" });
}

/* React element creation functions - End */
