var fs = require('fs');
const http = require('http');
var baseUrl = "http://www.dnd5eapi.co/api/";
var list = {
  resources: []
};

function httpGetRequest(data) {
  var rqstUrl = data.rqstUrl;
  var fileName = data.name;

  
  http.get(rqstUrl, (res) => {
    const { statusCode } = res;
    const contentType = res.headers['content-type'];
  
    let error;
    if (statusCode !== 200) {
      error = new Error('Request Failed.\n' +
                        `Status Code: ${statusCode}`);
    } else if (!/^application\/json/.test(contentType)) {
      error = new Error('Invalid content-type.\n' +
                        `Expected application/json but received ${contentType}`);
    }
    if (error) {
      console.error(error.message);
      // consume response data to free up memory
      res.resume();
      return;
    }
    res.setEncoding('utf8');
    let rawResponse = '';
    res.on('data', (chunk) => { rawResponse += chunk; });
    res.on('end', () => {
      try {
        const parsedData = JSON.parse(rawResponse);
        //console.log(parsedData);
        var result = {
          name: fileName,
          data: parsedData
        };
        list.resources.unshift(result);
        var finalList = JSON.stringify(list, null,"\t");
        fs.writeFile("./data/data.json", finalList, "utf8");
        //console.log(JSON.stringify(list, null, "\t"));
      } catch (e) {
        console.error(e.message);
      }
    });
  }).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
  });
}

function crawl(input) {
  fs.readFile(input, function(err, data){
    if (err){
      return console.log(err);
    }
    var resources = JSON.parse(data);
    resources.list.forEach(function(elem){
      var fData = [];
      var rqstUrl = baseUrl+elem;
      var result = {
        name: elem, 
        url: rqstUrl
      };
      fData.push(result);
      fData.forEach(function(e){
        
        var data = {
          rqstUrl: e.url,
          name: e.name,
          dir: "./data/full/",
          fileType: ".json",
          write: false
        };
        httpGetRequest(data);
      });
    });
  });

}

crawl('./data/rL1.json');
