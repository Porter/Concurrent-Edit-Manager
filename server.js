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

var cycleLen = 1000;


var util = require('./libs/util');
var change = require('./libs/change');


var text = "";
var colors = [];


var colorList = ['blue', 'red', 'green'];
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


function cleanUpEdits(clients) {
	var clients = findClientsSocket();
	
	if (clients.length == 0) {
		edits = {};
		return;
	}

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

	for (var i = 0; i < cycleLen/2; i++) {
		lowest--;
		if (lowest < 0) lowest += cycleLen;

		edits[lowest] = undefined;
	}

	return ((r-1) + cycleLen) % cycleLen;

}

io.on('connection', function(socket){

	console.log("connection");


	var userColor = colorList.pop();
	colorsInUse.push(userColor);

	socket.emit('init', {text:text, number:number, colors:colors, color:userColor});
	connections++;
	socket.color = userColor;

	socket.on('input', function(input) {
		var c = input['change'];
		var n = input['number'];

		var edit = change.stringToEditPath(c);
		


		//console.log(n + ", " + number + ": " + text);
		console.log("got edit", n, "at", number, JSON.stringify(edit));

		if (n != number) {
			for (var i = n; n != number; n = (n+1)%cycleLen) {
				util.applyOffsets(edit, edits[i]);
				console.log('applying', JSON.stringify(edits[i]));
				console.log('new edit', JSON.stringify(edit));
			}
		}

		var offsetDepth = Math.abs(number - n);
		if (offsetDepth > cycleLen/2) offsetDepth = cycleLen - offsetDepth;

		
		console.log(text + " -> " + change.applyEditPath(text, edit));
		text = change.applyEditPath(text, edit);
		change.applyEditPathToColors(colors, edit, input['color']);

		edits[number] = edit;
		var lowest = cleanUpEdits();


		number = (number + 1) % cycleLen;

		var hash = change.hashString(text);

		io.emit('editConfirmed', {user:"", color:input['color'], number:number, offsetDepth:offsetDepth, edit:edit, hash:hash,
					text:text, lowest:lowest});
	});

	socket.on('editConfirmationRecieved', function(data) {
		socket.lastEdit = data.number;
		cleanUpEdits();

	});


	socket.on('disconnect', function(){
		colorList.push(socket.color);

	});
  
});
