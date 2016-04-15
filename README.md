# Concurrent-Editing-Manager

###[Watch a demo](https://www.youtube.com/watch?v=k2a6rzk2SvM)

The Concurrent Editing Manager keeps track of multiple clients making concurrent edits to a single document.

### How it works: Server Side

The server recieves edits from a client, and sends them to to all other clients. Each edit is assigned a number to clarify order, and operation transformation is used if two clients send in an edit with the same number. 

###How it works: Client Side

The client checks a div for changes, and sends those to the server. 
