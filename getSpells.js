var fs = require('fs');
const http = require('http');
var list = [];

//httpGetRequest("http://www.dnd5eapi.co/api/spells/1", "spells");

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
    let rawResponse = '';
    res.on('data', (chunk) => { rawResponse += chunk; });
    res.on('end', () => {
      try {
        const parsedData = JSON.parse(rawResponse);
        var listString = JSON.stringify(parsedData, null, "\t");
        list.push(listString);
        fs.writeFile("./data/spellsData.json", list, "utf8");
        //console.log("write: "+flName+".json");
        
        
        
      } catch (e) {
        console.error(e.message);
      }
    });
  }).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
  });
}

function init() {
    fs.writeFile('./data/spells/spellsList.json', '', "utf8");
    fs.readFile('./data/resourceList/spells.json', function(err, data){
        if (err){
          return console.log(err);
        }
        var rLists = JSON.parse(data.toString());
        rLists.results.forEach(function(elem){
          var rqstUrl = elem.url;
          console.log(rqstUrl);
          httpGetRequest(rqstUrl, elem);
        });
    });
}

init();
