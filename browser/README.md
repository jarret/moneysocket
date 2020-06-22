In-Browser Example
==================

![browser](../doc/img/browser-connected.png)

This is a an example client to the example servers. It connects over websocket, displays the balance and when two sockets are connected, allows you to `push` and `pull` satoshis between them (not sure that is good jargon to introduce, what do you think?)

Running
=======

This uses `gulp` to build. Will need to `npm install` dependencies. `gulp quick_watch` will build the app and copy resources into a `htdocs/` subdirectory.

