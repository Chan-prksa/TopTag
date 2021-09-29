/*
 This example code I find it at :
 https://github.com/Blackmist/hdinsight-eventhub-example/blob/master/dashboard/server.js
*/

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;
var exec = require('exec');

//Serve up static files
//app.use(express.static(__dirname + '/public'));
app.use('/chart', express.static('public'));

server.listen(port, function() {
  console.log('server listening at port %d', port)
});


//Handle Socket.io connections
var blankCnt = 0;
var pathToJAR = '../../java2/out/artifacts/TweetTopTagByLanguage_jar/';
var startcmd = 'spark-submit --class TopTagByLanguage --master local[4] ' + pathToJAR + 'TweetTopTagByLanguage.jar';

function startSpark(){
  exec(startcmd, function(err, out, code) {
    if (err instanceof Error) throw err;
    process.stderr.write(err);
    //process.stdout.write(out);
    //process.exit(code);
  });
}

function terminateAndRerunSpark(){
        exec("kill -9 $(ps x | awk '/TweetTopTagByLanguage\.jar/ { print $1}')", function(err, out, code){
          startSpark();
        });
}

io.on('connection', function(socket) {
  socket.emit('server',{});
  socket.on('browser' ,function(data) {
    exec("ps x | awk '/TweetTopTagByLanguage\.jar/ && !/awk/'", function(err,out,code){
      console.log("Spark is running? ="+ (out ? "Yes": "No"))
      if(!out) {
        console.log("No instance of Spark running. Start a new process!")
        startSpark();
      } else{
        console.log("Spark is running. Terminate it and rerun");
        terminateAndRerunSpark();
      }
    });
     console.log("Visited by Browser");
     exec('find /tmp -name "blockmgr*" | xargs rm -r', function(err,out,code){});
  });

  socket.on('topTags', function(data) {
    console.log('topTags N=' + data.length );
    socket.broadcast.emit('topTags', data);
  });

  socket.on('topTagByLangs', function(data) {
    //console.log('got topLangsByTag' );
    socket.broadcast.emit('topTagByLangs', data);
  });

});
