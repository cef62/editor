define([
    "hr/hr",
    "hr/utils",
    "hr/promise"
], function(hr, _, Q) {
    var http = node.require('http');
    var url = node.require('url');
    var send = node.require('send');

    var Server = hr.Class.extend({
        initialize: function() {
            Server.__super__.initialize.apply(this, arguments);

            this.running = null;
            this.port = 0;
        },

        // Return true if the server is running
        isRunning: function() {
            return this.running != null;
        },

        // Open the server if running
        open: function() {
            if (!this.isRunning()) return false;

            node.gui.Shell.openExternal('http://localhost:'+this.port);
            return true;
        },

        // Stop the server
        stop: function() {
            var that = this;
            if (!this.isRunning()) return Q();

            var d = Q.defer();
            this.running.close(function(err) {
                that.running = null;
                that.trigger("state", false);

                if (err) d.reject(err);
                else d.resolve();
            });

            return d.promise;
        },

        // Start the server
        start: function(dir, port) {
            var that = this, pre = Q();
            port = port || 8004;

            if (that.isRunning()) pre = this.stop();
            return pre
            .then(function() {
                var d = Q.defer();

                that.running = http.createServer(function(req, res){
                    // Render error
                    function error(err) {
                        res.statusCode = err.status || 500;
                        res.end(err.message);
                    }

                    // Redirect to directory's index.html
                    function redirect() {
                        res.statusCode = 301;
                        res.setHeader('Location', req.url + '/');
                        res.end('Redirecting to ' + req.url + '/');
                    }

                    // Send file
                    send(req, url.parse(req.url).pathname)
                    .root(dir)
                    .on('error', error)
                    .on('directory', redirect)
                    .pipe(res);
                });

                that.running.listen(port, function(err) {
                    if (err) return d.reject(err);

                    that.port = port;
                    that.trigger("state", true);
                    d.resolve();
                });

                return d.promise;
            });
        }
    });

    return (new Server());
});