var exports;
if (typeof(module) != "undefined") exports = module.exports = {};
else exports = {};

function min(a, b) {
	return a < b ? a : b;
}

function getText(div) {

	if (div.nodeName.toLowerCase() != "div") {
		console.error("getText2 wasn't given a div");
		alert("getText2 wasn't given a div");
	}
	return getTextHelper(div, "div").replace(/ /g, ' '); // char code 160 for char code 32

}

function getTextHelper(node, parentNodeType, position, length) {
	var nodeType = node.nodeName.toLowerCase();

	if (nodeType == "#text") {
		return node.textContent;
	}

	if (nodeType == "span" || nodeType == "font" || nodeType == "div") {
		var texts = [];
		var children = node.childNodes;
		for (var i = 0; i < children.length; i++) {

			texts.push(getTextHelper(children[i], nodeType, i, children.length));
			if (children[i].nodeName.toLowerCase() == "div" && i != children.length-1) {
				texts.push('\n');
			}
		}
		return texts.join("");
	}

	if (nodeType == "br") {
		if (length != 0 && position != length - 1) {
			return '\n';
		}	
		return "";
	}

	console.error("unsupported tag: " + nodeType);

}

function colorsLength(colors) {
	var l = 0;
	for (var i = 0; i < colors.length; i++) {
		l += colors[i][0];
		if (colors[i][0] < 0) {
			throw new Error("negative color");
		}
		if (!colors[i][1]) {
			console.log(JSON.stringify(colors));
			throw new Error("null color");
		}
	}
	return l;
}

function fixSpaces(text) {
	/*for (var j = 0; j < text.length && text.charAt(j) == ' '; j+=6) {
		text = text.substring(0, j) + '&nbsp;' + text.substring(j+1);
	}
	for (var j = text.length-1; j >= 0 && text.charAt(j) == ' '; j--) {
		text = text.substring(0, j) + '&nbsp;' + text.substring(j+1);
	}*/
	return text.replace(/ /g, '&nbsp');
}


function setText(text, div, colors) {
	div.innerHTML = "";


	if (!colors) {
		colors = [[text.length, 'green']];
	}

	if (text == "") {
		div.innerHTML = '';
		return;
	}

	if (colorsLength(colors) != text.length) {
		console.log(JSON.stringify(colors));
		console.log(text);
		throw new Error('length mismatch');
	}

	var lines = text.split('\n');
	
	var colorsIndex = 0, pos = 0;
	
	for (var i = 0; i < lines.length; i++) {
		var d = document.createElement('div');
		

		var text = lines[i];

		if (text == "") {
			text = "<br/>";
			d.innerHTML = text;
			div.appendChild(d);


			pos++;
			if (colorsIndex < colors.length && pos >= colors[colorsIndex][0]) {
				pos = 0;
				colorsIndex++;
			}


			continue;
		}


		var texts = [];
		while (text.length > 0) {
			//console.log(JSON.stringify(colors));
			//console.log(colorsIndex, pos, text);
			if (text.length <= colors[colorsIndex][0] - pos) {

				texts.push([text, colors[colorsIndex][1]]);
				pos += text.length;
				if (colorsIndex < colors.length && pos >= colors[colorsIndex][0]) {
					pos = 0;
					colorsIndex++;
				}
				text = "";
			}
			else {
				texts.push([text.substring(0, colors[colorsIndex][0] - pos), colors[colorsIndex][1]]);
				text = text.substring(colors[colorsIndex][0] - pos);
			

				pos = 0;
				colorsIndex++;
			}
		}

		for (var n = 0; n < texts.length; n++) { // replace leading spaces with &nbsp;
			texts[n][0] = fixSpaces(texts[n][0]);
		}

		for (var n = 0; n < texts.length; n++) {
			d.innerHTML += '<span style="color:' + texts[n][1] + '">' + texts[n][0] + '</span>';
		}

		div.appendChild(d);
		if (i != lines.length - 1) {
			pos++;
			if (colorsIndex < colors.length && pos >= colors[colorsIndex][0]) {
				pos = 0;
				colorsIndex++;
			}
		}
	}
}


function checkColors(colors, div, pos, subpos) {

	if (!subpos && !pos) {
		pos = subpos = 0;
	}

	var children = div.childNodes;
	for (var i = 0; i < div.children.length; i++) {

	}
}


function testText(div) {
	var t = getText(div);
	setText(t, div);


	return t == getText(div);
}

function testText2(div) {
	for (var i =0; i < 100; i++) {
		var text = "";

		for (var n = 0; n < 100; n++) {
			text += String.fromCharCode(65 + Math.floor(Math.random()*40));
			while (Math.random() < .2) text += '\n';
		}

		setText(text, div);
		if (!testText(div)) {
			console.log('fail');
			console.log(text);
			return;
		}
	}
	return 'pass';
}

function removeEmptyDivs(div) {
	var children = div.childNodes;
	for (var i = 0; i < children.length; i++) {
		var child = children[i];
		if (child.nodeName.toLowerCase() != "div") continue;

		if (child.childNodes.length == 0) {
			div.removeChild(child);
		}
		else {
			removeEmptyDivs(child);
		}
	}
}


function isAncestor(child, ancestor) {
	child = child.parentNode;
	if (!child) return false;

	if (child == ancestor) return true;

	return isAncestor(child, ancestor);
}

function previousNode(node, stopAt) {
	if (node.previousSibling != undefined) { return node.previousSibling; }
	
	node = node.parentNode;
	if (node == stopAt) return;
	
	return previousNode(node, stopAt);
	
}

function nextNode(node, stopAt) {
	if (node.nextSibling != undefined) { return node.nextSibling; }
	
	node = node.parentNode;
	if (node == stopAt) return;
	
	return nextNode(node);
}

function getPosOfCaret(mainDiv, caret, caretOffset) {
	var divs = mainDiv.childNodes;

	if (mainDiv.textContent == "" && (isAncestor(caret, mainDiv) || caret == mainDiv)) {
		return 0;
	}

	var position = 0;
	for (var i = 0; i < divs.length; i++) {

		if (divs[i].nodeName.toLowerCase() == "div") {
			if (isAncestor(caret, divs[i])) {
				var spans = divs[i].childNodes;
				for (var n = 0; n < spans.length; n++) {
					if (isAncestor(caret, spans[n]) || caret == spans[n]) {
						return position + caretOffset;
					}
					position += spans[n].textContent.length;
				}
			}
			if (caret == divs[i]) {
				return position + caretOffset;
			}

			position += divs[i].textContent.length + 1;
		}
		else {
			if (isAncestor(caret, divs[i]) || caret == divs[i]) {
				return position + caretOffset;
			}
			position += divs[i].textContent.length;
		}
	}
}

function getCursor(div) {
	var sel = window.getSelection();
    if (sel.rangeCount > 0) {
        var range = window.getSelection().getRangeAt(0);

        //if (!isAncestor(range.startContainer, div)) return;

        
        var r = [];
        var start = range.startOffset, startContainer = range.startContainer;

        for (var i = 0; i < 2; i++) {
        	
            var len = getPosOfCaret(div, range.startContainer, range.startOffset);

            /*if ((start == 0 || startContainer.nodeName.toLowerCase() != "#text") && div.textContent.length != 0) {
            	info = 1;

            	var node = previousNode(startContainer);
            	if (!isAncestor(node, div)) node = startContainer;

            	while (node && node.textContent.length == 0) {
            		node = previousNode(node);
            		len++;
            	}
            }
			*/
            r.push(len);


            /*preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(div);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            start = range.endOffset;
            startContainer = range.endContainer;*/
        }

        return r;
    }
}


function nodeAt(pos, node, isStructure) {
	var len = pos;

	var children = node.childNodes;

	for (var i = 0; i < children.length; i++) {
		var child = children[i];

		var textLength;
		if (isStructure) { textLength = structureLength(child); }//console.log(strip(child), " is ", textLength);}
		else { textLength = child.textContent.length; }

		len -= textLength;
		//console.log("len is now", len);

		if (len <= 0) {
			len += textLength;
			
			if (child.nodeName.toLowerCase() == "#text") return [child, len];
			return nodeAt(len, child, isStructure);

		}
	}
}

function getRange(pos, div) {

	var n = nodeAt(pos[0], div);

	if (!n) return n;

	if (n[1] != 0) {
		for (var i = 0; i < pos[1]; i++) {
			n[0] = nextNode(n[0]);
			n[1] = 0;
		}
	}

	var nodeName = n[0].nodeName.toLowerCase();
	while (nodeName != "#text" && n[0].childNodes.length > 0) {
		n[0] = n[0].childNodes[0];
	 }

	 if (n[0].nodeName.toLowerCase() == "br") n[0] = n[0].parentNode; // can't have the cursor in a <br>

	return n;
}

// filters out all elements from arr where func(arr[i]) is false
function filter(arr, func) {
	var n = [];
	for (var i = 0; i < arr.length; i++) {
		if (func(arr[i])) {
			n.push(arr[i]);
		}
	}

	return n;
}

function getSpanInPos(pos, div) {
	var divs = filter(div.childNodes, function(a) { return a.nodeName.toLowerCase() == "div"; });


	for (var i = 0; i < divs.length; i++) {
		if (pos <= divs[i].textContent.length) {

			var spans = filter(divs[i].childNodes, function(a) { return a.nodeName.toLowerCase() == "span"; });
			for (var n = 0; n < spans.length; n++) {
				if (pos <= spans[n].textContent.length) {
					return [spans[n].childNodes[0], pos];
				}
				pos -= spans[n].textContent.length;
			}

		}

		if (pos == 0) {
			return [divs[i], 0];
		}

		pos -= divs[i].textContent.length + 1;
	}
	console.error(JSON.stringify(pos) + " is out of setCursor range");
}

function setCursor(pos, div) {
	console.log('setting cursor', JSON.stringify(pos));
	if (!pos) return;
	
	var start = getSpanInPos(pos[0], div);
	var end = getSpanInPos(pos[1], div);


	/*if (pos[1][0] >= pos[0][0]) {
		if (pos[1][0] > pos[0][0] || pos[1][1] > pos[0][1]) {
			var t = start;
			start = end;
			end = t;
		}
	}*/
	
	if (start && end) {
		var range = document.createRange();

		range.setStart(start[0], start[1]);
		range.setEnd(start[0],  start[1]);
		//range.setEnd(end[0], end[1]);
		var sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(range);
	}
}

function testCursor() {
	setCursor(getCursor(textarea), textarea);
}


function copyColors(colors) {
	var c = [];
	for (var i = 0; i < colors.length; i++) {
		c.push(colors[i].slice());
	}
	return c;
}
exports.copyColors = copyColors;

exports.copyEdit = copyEdit = copyColors; // colors and edits are both arrays of arrays


function setDivForm(textarea) {
	var previousDiv = null;
	var divs = textarea.childNodes;
	for (var i = 0; i < divs.length; i++) {
		if (divs[i].nodeName.toLowerCase() != "div") {
			if (previousDiv) {
				var inner = divs[i].innerHTML;

				previousDiv.innerHTML += inner;

				textarea.removeChild(divs[i]);
			}
			else {
				var d = document.createElement('div');
				d.innerHTML = divs[i].innerHTML;

				//textarea.insertBefore(d, divs[i]);
				//textarea.removeChild(divs[i]);
				textarea.replaceChild(d, divs[i]);
			}
		}
		else {
			previousDiv = divs[i];
		}
	}
}

// precondition: textarea's childNodes are only divs
function setSpanForm(textarea) {
	var divs = textarea.childNodes;
	for (var i = 0; i < divs.length; i++) {
		if (divs[i].nodeName.toLowerCase() != "div") {
			console.error('setSpanForm precondition not met');
		}
		else {
			var spans = divs[i].childNodes;
			for (var n = 0; n < spans.length; n++) {
				if (spans[n].nodeName.toLowerCase() == "#text") {
					var t = document.createElement('span');
					console.log('span', spans[n], spans[n].textContent);
					t.textContent = spans[n].textContent;
					divs[i].replaceChild(t, spans[n]);	
				}
			}
		}
	}
}

function setForm(textarea) {
	if (textarea.textContent == "") {
		textarea.innerHTML = '';
		return;
	}

	setDivForm(textarea);
	setSpanForm(textarea);
}

// This will apply the offsets of an edit that came first so that the second edit is as the user inteded
function applyOffsets(second, first) {
	for (var i = 0; i < second.length; i++) {

		var location = second[i][1];
		for (var n = 0; n < first.length; n++) {

			if (first[n][1] == location && first[n][0] == "right" && second[i][0] == "right") { // if two people delete the same thing
				// then delete the second person's deletion
				second.splice(i, 1);
				i--;
				break;
			}

			if (first[n][1] > location) break;

			if (first[n][0] == "right" && first[n][1] == location) break;

			var off = first[n][0] == "down" ? 1 : -1;

			second[i][1] += off;
		}
	}
}
exports.applyOffsets = applyOffsets;

function applyOffsetToCursor(cursor, edit) {
	if (!cursor) return;

	var s = JSON.stringify(cursor) + " -> ";
	for (var i = 0; i < cursor.length; i++) {
		for (var n = 0; n < edit.length; n++) {
			var offset = edit[n][0] == "down" ? 1 : -1;
			
			if (edit[n][1] > cursor[i]) break;
			if (edit[n][1] == cursor[i] && offset == -1) break;



			cursor[i] += offset;
		}
	}

	s += JSON.stringify(cursor);
	console.log(s);
}

// will modify the text in the given textarea within the given range
// this function is used for automated testing
function modify(textarea, range, ch) {
	if (stopAllJavascript) return;
	var originalRange = range;
	var text = getText(textarea);
	if (!range) {
		range = [0, text.length]
	}
	// ['sd', true] will be a range from the index of 'sd' and on
	// ['sd', false] will be a range from 0 to the index of 'sd'
	// if the given string is not found, the range will be from the beginning to the end
	if (typeof(range[0]) == "string") {
		var index = text.indexOf(range[0]);
		if (index == -1) {
			range = [0, text.length];
		}
		else {
			if (range[1]) {
				range = [index+1, text.length];
			}
			else {
				range = [0, index];
			}
		}
	}
	var rangeLength = range[1] + 1 - range[0];
	var position = parseInt(range[0] + Math.random() * rangeLength);
	var length = parseInt(text.length*Math.random() * .01 + Math.random() * 5);
	// 50-50 chance of adding or deleting
	if (Math.random() > .5) {
		console.log('adding');
		var toAdd = "";
		for (var i = 0; i < length; i++) {
			toAdd += ch();
		}
		var divs = textarea.childNodes;//.filter(function(div) { return div.nodeName.toLowerCase() == "div"; });

		for (var i = 0; i < divs.length; i++) {
			var divLength = divs[i].textContent.length;
			if (divLength >= position) {

				if (divLength == 0) {
					divs[i].textContent = toAdd;
					break;
				}

				var spans = divs[i].childNodes;//.filter(function(span) { return span.nodeName.toLowerCase() == "span"; });

				for (var n = 0; n < spans.length; n++) {
					if (spans[n].textContent.length >= position) {
						spans[n].textContent = spans[n].textContent.substring(0, position) + toAdd + spans[n].textContent.substring(position);
						break;
					}

					position -= spans[n].textContent.length;
				}

				break;
			}

			position -= divLength + 1;
		}


		
	}
	else {
		console.log('subbing');
		if (position + length > range[1]) { // if we would delete text past the range
			position = range[1] - length; // then move the position back
			if (position < range[0]) { // but if our position is then before our range
				position = range[0]; // set the position to the begginning of the range
				length = Math.max(0, range[1] - position); // and set the length to the length of the range
			}
		}

		var divs = textarea.childNodes;//.filter(function(div) { return div.nodeName.toLowerCase() == "div"; });

		console.log("pos: " +position);

		for (var i = 0; i < divs.length; i++) {
			var divLength = divs[i].textContent.length;
			if (divLength >= position) {

				console.log("found div");
				var spans = divs[i].childNodes;//.filter(function(span) { return span.nodeName.toLowerCase() == "span"; });

				var startAt = 0, startAtPos = 0;
				for (var n = 0; n < spans.length; n++) {
					

					if (spans[n].textContent.length >= position) {
						startAt = n;
						startAtPos = position;
						break;
					}

					position -= spans[n].textContent.length;
				}

				var at = startAt;
				console.log(length, at, spans.length);
				while (length > 0 && at < spans.length) {
					console.log(length, at, spans.length);
					var cut = spans[n].textContent.length - Math.min(spans[n].textContent.length, startAtPos+length);
					spans[n].textContent = spans[n].textContent.substring(startAtPos, Math.min(spans[n].textContent.length, startAtPos+length));

					length -= cut;
					at++;
					startAtPos = 0;
				}



				break;
			}

			position -= divLength + 1;
		}



		//text = text.substring(0, position) + text.substring(position + length);
	}

	setTimeout(function() { modify(textarea, originalRange, ch); }, 100);

}


