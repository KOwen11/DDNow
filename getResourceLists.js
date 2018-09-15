var fs = require('fs');
const http = require('http');

function httpGetRequest(rqstUrl,flName) {
  var result;
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
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      try {
        const parsedData = JSON.parse(rawData);
        result = rawData;
        fs.writeFile("./data/resourceList/"+flName+".json", rawData, "utf8");
        console.log("write: "+flName+".json");
      } catch (e) {
        console.error(e.message);
      }
    });
  }).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
  });
}

function init() {
  fs.readFile('./data/rL1.json', function(err, data){
    if (err){
      return console.log(err);
    }
    var result = JSON.parse(data.toString());
    result.list.forEach(function(elem){
      var rqstUrl = "http://www.dnd5eapi.co/api/"+elem+"/";
      console.log(rqstUrl);
      httpGetRequest(rqstUrl, elem);
    });
  });
}

init();


