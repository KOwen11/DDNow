var fs = require('fs');
var http = require('http');
var completeData;
var inputPath = "./data/resourceList/";

                //   |  Resource Name Goes Here
                //   |  example: classes, features, equipment, etc
                //   |  To update resoureData file enter resource name and run script.
                //   v   
var inputResource = "startingequipment";
                //   ^
                //   |
                //   |
                //   |

var outputPath = "./data/resourceData/";
var fileType = ".json";
var inputFile = inputPath+inputResource+"List"+fileType;
var outputFile = outputPath+inputResource+"Data"+fileType;
fs.readFile(inputFile, function(err, data){
        if(err){
            return console.log(err);
        }
        var iData = JSON.parse(data);
        setCompleteData(iData, 'true');
});
main();
function main() {
    fs.readFile(inputFile, function(err, data){
        if(err){
            return console.log(err);
        }
        var iData = JSON.parse(data);
        iData.resources.forEach(function(e){
            e.data.results.forEach(function(f){
                var d = {
                    name: f.name,
                    url: f.url,
                    resourceName: e.name
                };
                getData(d);
            });
        });
    });
}

function printAsString(data){
    console.log(JSON.stringify(data, null, "\t"));
}

function getData(d){
    var rUrl = d.url;
    var resourceName = d.resourceName;
    var name = d.name;
    
    http.get(rUrl, (res) => {
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
        var f = {
            resourceType: resourceName,
            data: parsedData
        };
        addToCompleteData(f);
      } catch (e) {
        console.error(e.message);
      }
    });
  }).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
  });
}

function addToCompleteData(d){
    completeData.resources.forEach(function(f){
        if(d.resourceType == f.name){
            console.log(d.resourceType+":"+f.name);
            f.data.results.push(d.data);
        }
        writeCompleteData(completeData);
    });
}

function setCompleteData(d){
    completeData = d;
    completeData.resources.forEach(function(e){
    e.data.results = [];
    });
    //printAsString(completeData.resources);
}

function writeCompleteData(data){
    var dataString = JSON.stringify(data, null, "\t");
    fs.writeFile(outputFile, dataString, "utf8");
    //printAsString(completeData.resources);
}
main();