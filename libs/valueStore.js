// valueStore will help keep edits
var exports;
if (typeof(module) != "undefined") {
	exports = module.exports = {};
	var change = require('./change');
	var util = require('./util');

	applyEditPath = change.applyEditPath;
	applyEditPathToColors = change.applyEditPathToColors;

	applyOffsets = util.applyOffsets;
}
else exports = {}

function nextNumber(num, cycleLen) {
	return (cycleLen + num + 1)%cycleLen;
}

function ValueStore(currentText, colors, cycleLen) {
	this.currentText = currentText;
	this.colors = colors;
	this.cycleLen = cycleLen;
}

if (typeof(copyColors) == "undefined") {
	var util = require("./util");
	copyColors = util.copyColors;
	copyEdit = util.copyEdit;
}

ValueStore.prototype.addEdit = function(edit, usersColor, history, editNumber, offsetDepth) {

	/*edit = copyEdit(edit); // don't want to modify the original

	editNumber = ((editNumber - offsetDepth) + this.cycleLen) % this.cycleLen;

	for (var i = 0; i < offsetDepth; i++, editNumber = nextNumber(editNumber, this.cycleLen)) {
		if (!history[editNumber]) {
			console.log(JSON.stringify(history));
			console.log(editNumber);
			console.error("History is missing");
		}

		console.log('applying ', JSON.stringify(history[editNumber]['edit']));
		applyOffsets(edit, history[editNumber]['edit']);
		console.log('new edit ', JSON.stringify(edit));
	}*/

	this.currentText = applyEditPath(this.currentText, edit);
	applyEditPathToColors(this.colors, edit, usersColor);
}

ValueStore.prototype.getText = function() { return this.currentText; }
ValueStore.prototype.getColors = function() { return copyColors(this.colors); }

exports.ValueStore = ValueStore;
