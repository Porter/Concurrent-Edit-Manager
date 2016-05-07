//test commit
console.log('---------------------------------------------------------');
console.log('here we go');
console.log('---------------------------------------------------------');


var express = require('express');
var app = express();

var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));


var http = require('http').Server(app);
var io = require('socket.io')(http);


// In order to keep track of the order the edits came in, each edit is assigned a number
// To prevent the numbers from getting too big, they reset to 0 upon reaching cycleLen
var cycleLen = 1000;


var util = require('./libs/util');
var change = require('./libs/change');


var text = ""; // the text
var colors = []; // the colors; [[1, "green"], [5, "red"]] means the first character in text is green, while the next 5 are red


var colorList = ['white', 'black', 'gray', 'blue', 'red', 'green'];
var colorsInUse = [];

app.use('/', express.static(__dirname + '/static'));
app.use('/libs', express.static(__dirname + '/libs'));


app.set('port', 8080);

http.listen(app.get('port'), function(){
	console.log('listening on *:' + app.get('port'));
});


var number = 0;
var connections = 0;
var edits = {};

// Gets all the sockets in a room with a namespace
function findClientsSocket(roomId, namespace) { 
    var res = []
    , ns = io.of(namespace ||"/");    // the default namespace is "/"

    if (ns) {
        for (var id in ns.connected) {
            if(roomId) {
                var index = ns.connected[id].rooms.indexOf(roomId) ;
                if(index !== -1) {
                    res.push(ns.connected[id]);
                }
            } else {
                res.push(ns.connected[id]);
            }
        }
    }
    return res;
}

// deletes older edits we no longer need
function cleanUpEdits(clients) {
	var clients = findClientsSocket();
	
	if (clients.length == 0) {
		edits = {};
		return;
	}

	// this function is called after an edit, there will be at least one client 
	var lowest = clients[0].lastEdit;

	if (lowest == undefined) return;

	for (var i = 1; i < clients.length; i++) {

		var differenceForward = clients[i].lastEdit - lowest;
		var differenceBackward = -differenceForward;

		while (differenceForward < 0) differenceForward += cycleLen/2;
		while (differenceBackward < 0) differenceBackward += cycleLen/2;

		if (differenceForward > differenceBackward) {
			lowest = clients[i].lastEdit;
		}
	}

	var r = lowest;

	// delete every edit that came before lowest
	for (var i = 0; i < cycleLen/2; i++) {
		lowest--;
		if (lowest < 0) lowest += cycleLen;

		delete edits[lowest];
	}

	return r;

}

io.on('connection', function(socket){

	console.log("connection");


	var userColor = colorList.pop();
	if (!userColor) return;
	colorsInUse.push(userColor);



	socket.emit('init', {text:text, number:number, colors:colors, color:userColor, history:edits});
	connections++;
	socket.color = userColor;

	socket.on('input', function(input) {
		var c = input['change'];
		var n = input['number'];

		var edit = change.stringToEditPath(c);
		


		//console.log("got edit", n, "at", number, JSON.stringify(edit));

		var originalEdit = util.copyEdit(edit);


		// if an edit recieved thinks it is the next one to be commited, but we have recieved other edit(s) from others first
		if (n != number) {
			// go back into our edit history
			for (var i = n; i != number; i = (i+1)%cycleLen) {
				// apply the offsets of the older edits to this new edit
				util.applyOffsets(edit, edits[i]);
				console.log('applying', JSON.stringify(edits[i]));
				console.log('new edit', JSON.stringify(edit));
			}
		}

		// This number will tell the client that they need to apply the offsets of older edits to their own edit
		var offsetDepth = Math.abs(number - n);
		if (offsetDepth > cycleLen/2) offsetDepth = cycleLen - offsetDepth;

		
		console.log(text + " -> " + change.applyEditPath(text, edit));

		// commit the edit
		// TODO sanitize the edit. Edit could be out of bounds, input['color'] could be null
		text = change.applyEditPath(text, edit);
		change.applyEditPathToColors(colors, edit, input['color']);

		// store this edit in our edit history
		edits[number] = originalEdit;

		// we will let the client know they can delete edits older than lower from their history
		var lowest = cleanUpEdits();


		number = (number + 1) % cycleLen; // inc the edit count

		var hash = change.hashString(text);

		io.emit('editConfirmed', {user:"", color:input['color'], number:number, offsetDepth:offsetDepth, edit:edit, hash:hash,
					text:text, lowest:lowest});
	});

	// the client has let us know the last edit they recieved from us
	socket.on('editConfirmationRecieved', function(data) {
		socket.lastEdit = data.number;
		cleanUpEdits();
	});


	socket.on('disconnect', function(){
		colorList.push(socket.color); // put the users color back into commision
	});
  
});
