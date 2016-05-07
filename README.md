# Concurrent-Edit-Manager

###[Watch a demo](https://www.youtube.com/watch?v=-TKJ1zuLnsg)

The Concurrent Editing Manager keeps track of multiple clients making concurrent edits to a single document.

Known Bugs:
* Cursor occasionally is moved when an edit is recieved
* If a character is added right before that same chacarter (eg '1234' -> '12334'), then it is viewed as the new character being inserted after, not before, the old character
