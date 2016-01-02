# Concurrent-Editing-Engine


The Concurrent Editing Engine keeps track of concurrent edits on a single file, while also keeping track of who wrote what. Different users’ text will be in different colors. It is written in javascript and runs on Node.js. Most of the work is actually done on the client’s side, so the server should be able to manage lots of traffic. In fact, all the server has to do is respond to edits by applying them to the file and letting all the other connected clients know about the edit. Once a client receives an edit, it applies it to its version of the file, keeping it up to date. Hashes of the file are always sent to ensure that the clients and the server always have the same file.

### How it works: Server Side

The server serves a html file with the client side javascript, and a socket connection is made using Socket.io. Throught the socket (the file may be large), the text is passed onto the client. When the user edits the text, the server receives the edit and applies the edit to its version of the text. Now that the editor and the server have the same text, the server sends the edit to all the other clients, which then update their texts. Once this is complete, the server and all the other clients have the updated text.

###How it works: Client Side

To keep the text up to date, the client listens for any to the server. If any other client makes an edit, the server will let the other clients know, and they will then apply it to their text.

To transmit the user’s edits, a function is setup to run every 100 milliseconds, checking to see if there are any changes to the text. To find the shortest edit graph (the shortest number of steps to go from one string to another), the algorithm described in “An O(ND) Difference Algorithm and its Variations" (Myers, 1986) was implemented. This algorithm was ideal because it is really quick when the edit is small, and for in this application the edit is one or two keystrokes. If the user copies or pastes, it may be slower. However, due to the speed of computers today, this process usually completes within a couple milliseconds.

Once an edit has been detected, it is sent to the server, and the client awaits its response. A number of things may happen now.

The first possibility is that the server responds, saying that the edit has been accepted. This is the best case scenario. The text is kept as is, and the client continues to wait for more the the user’s edits.

The second possibility is that the server responds, saying that there is an edit from another client. This is possible because it takes time for the edit to be transmitted across the internet, and another client may have made an edit just before this client did. This client will then undo its user’s previous edit, apply the edit from server, and redo the user’s edit. The undoing and redoing is necessary because the edit from the server happened first, and it is important to apply the edits chronologically.

The third possibility is we receive another edit from the server. With multiple clients editing one document, this client may receive numerous edits from the server before the server tells it that its edit has been accepted. When this is the case, the client then undoes the users edit, applies this new one, and redoes the users edit.
