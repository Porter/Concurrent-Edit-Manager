var exports;
if (typeof(module) != "undefined") exports = module.exports = {};
else exports = {};

function max(a, b) {
	return a > b ? a : b;
}

function editPathToString(path) {
	var s = "";
	for (var i = 0; i < path.length; i++) {
		var p = path[i];
		if (p[0] == "down") {
			s += "i" + p[1] + "," + p[2];
		}
		else {
			s += "d" + p[1];
		}
	}

	return s;
}
exports.editPathToString = editPathToString;

function stringToEditPath(string) {
	var path = [];

	while (string.length > 0) {
		var c = string.charAt(0);
		if (c == 'd') {
			var i = 1;
			while (/\d/.test(string.charAt(i)) && i < string.length) { i++; }

			path.push(['right', parseInt(string.substring(1, i))]);

			string = string.substring(i);




		}
		else if (c == 'i') {
			var comma = string.indexOf(',');
			var num = parseInt(string.substring(1, comma));
			var ch = string.charAt(comma+1);

			path.push(['down', num, ch]);

			string = string.substring(comma+2);
		}
		else {
			alert('unexpected start: ' + c)
			break;
		}
	}

	return path;
}
exports.stringToEditPath = stringToEditPath;

function applyEditPath(string, path) {
	var r = "";
	var point = 0;
	for (var i = 0; i < path.length; i++) {
		var p = path[i];
		var num = p[1];

		r += string.substring(point, num);
		point = num;

		if (p[0] == "down") r += p[2]; 	// make the addition
		else point++; 					// move point foward, skipping (and therefore deleting) the one character at num
	}

	r += string.substring(point);
	return r;
}
exports.applyEditPath = applyEditPath;

function applyEditPathToColors(colors, edit, color) {
	if (colors.length == 0) {
		colors.push([0, '']);
	}

	var offset = 0;
	for (var i = 0; i < edit.length; i++) {
		var e = edit[i];

		var length = 0;
		var broke = false;

		for (var n = 0; n < colors.length; n++) {
			length += colors[n][0];
			
			if (e[0] == 'down') {

				if (e[1] + offset <= length) {
					if (color == colors[n][1]) {
						colors[n][0]++;
					}
					else {
						//            |                     totalLength               |    
						// |||||||||||| e[1] |||||| length |||||||||||||||||||||||||||||||||||
						var totalLength = colors[n][0];


						var right = length - (e[1] + offset);
						var mid = 1;
						var left = totalLength - right;

						colors[n][0] = left;
						colors.splice(n+1, 0, [mid, color], [right, colors[n][1]]);
					}
					broke = true;
					break;
				}
			}
			else {
				if (e[1] + offset < length) {
					colors[n][0]--;

					if (colors[n][0] <= 0) {
						colors.splice(n, 1);
					}

					broke = true;
					break;
				}
			}
		}
		offset += e[0] == 'down' ? 1 : -1;
	}

	for (var i = 0; i < colors.length; i++) {
		if (colors[i][0] == 0) {
			colors.splice(i, 1);
			i--;
		}

		if (i < 0) continue;
		if (i < colors.length - 1 && colors[i][1] == colors[i+1][1]) {
			colors[i][0] += colors[i+1][0];
			colors.splice(i+1, 1);
		}
	}



}
exports.applyEditPathToColors = applyEditPathToColors;

function reverseEditPath(path, a, b) {
	var reversed = [];
	var offset = 0;

	for (var i = 0; i < path.length; i++) {
		var p = path[i];
		var num = p[1];


		if (p[0] == "down") {
			reversed.push(["right", num+offset]);
			offset++;
		}
		else {
			reversed.push(["down", num+offset, a.charAt(num)]);
			offset--;
		}

	}


	return reversed;
}

exports.reverseEditPath = reverseEditPath;


function charsAreEqual(a, b) {
	if (a == b) return true;
	a = a.charCodeAt(0);
	b = b.charCodeAt(0);
	return (a == 32 || b == 32) && (a == 160 || b == 160);
}

function diff(a, b) {

	var M = a.length, N = b.length;
	var MAX = M + N;


	var v = new Array(max( 2*MAX - 1, 1) );
	var paths = new Array(max( 2*MAX - 1, 1) );

	v[N] = 0;
	while (v[N] < M && v[N] < N && charsAreEqual(a.charAt(v[N]), b.charAt(v[N]))) {
		v[N]++;	
	}

	paths[N] = [];

	if (v[N] == M && v[N] == N) {
		//document.getElementById("test").innerHTML = "no diff";
		return [];
	}


	for (var d = 1; d <= MAX; d++) {
		//document.getElementById("test").innerHTML += "D: " + d + "<br/>";
		for (var k = -d; k <= d; k += 2) {
			var path = k+N;

			var x, y;
			
			/*if (k == -d) {
				x = v[k + N + 1];
			}
			else if (k == d) {
				x = v[k + N - 1] + 1;
			}
			else {
				if (v[k + N -1 ] + 1 > v[k + N + 1]) {
					x = v[k + N - 1] + 1;
				}
				else {
					x = v[k + N + 1];
				}
			}*/


			if ((k == -d || v[path - 1] < v[path + 1]) && k != d) { // compact version of above if else statements
				x = v[path + 1];

				var cpy = paths[path + 1].slice();
				cpy.push(['down', x, b.charAt(x-k-1)]);
				paths[path] = cpy;

				//document.getElementById("test").innerHTML += "moving down on k " + k + " x is " + x + "<br/>";
			}
			else {
				x = v[path - 1] + 1;

				var cpy = paths[path - 1].slice();
				cpy.push(['right', x-1]);
				paths[path] = cpy;

				//document.getElementById("test").innerHTML += "moving right on k " + k + " x is " + x + "<br/>";
			}

			y = x-k;

			while (x < M && y < N && charsAreEqual(a.charAt(x), b.charAt(y))) {
				x++; y++;
			}

			if (x >= M && y >= N) {
				//document.getElementById("test").innerHTML += "d: " + d + " ans: " + JSON.stringify(paths[path]);
				return paths[path];
			}

			v[path] = x;

		}
	}	
}
exports.diff = diff;

function hashString(string) {
  var hash = 0, i, chr, len;
  if (string.length === 0) return hash;
  for (i = 0, len = string.length; i < len; i++) {
    chr   = string.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

exports.hashString = hashString;



function testEditPaths() {
	for (var i = 0; i < 1000; i++) {
		console.log(i);
		var m = Math.floor(Math.random()*100), n = Math.floor(Math.random()*100);
		var a = "", b = "";

		for (var q = 0; q < m; q++) {
			a += String.fromCharCode(65 + Math.floor(Math.random()*40));
		}
		for (var q = 0; q < n; q++) {
			b += String.fromCharCode(65 + Math.floor(Math.random()*40));
		}

		if (i == 0) {
			b = "abcabc";
			a = "abecaebc";
		}

		//console.log(a, b);

		var edit = diff(a, b);
		var reversed = reverseEditPath(edit, a, b);
		var test = applyEditPath(applyEditPath(a, edit), reversed) == a;

		if (!test) {
			return false;
		}
	}
	return true;
}


function testCursor() {
	
	var c = getCursor(textarea);
	console.log(JSON.stringify(c));
	setCursor(c, textarea);

	setTimeout(testCursor, 100);
}


