var fs = require('fs');
const http = require('http');
var RateLimiter = require('request-rate-limiter');
var baseUrl = "http://www.dnd5eapi.co/api/";
const limiter = new RateLimiter({
  rate:400,
  maxWaitingTime:10000
});
const input = './data/rL1.json';

function httpGetList(data) {
  let urlArr = [];
  let resourceListResponse = {
    count: 0,
    list: []
  };
  //
  //get resource lists
  //
  let count = 0;
  data.list.forEach(function(d){
    limiter.request(function(err, backoff){
      if(err){
        return console.log(err);
      }else{
        http.get(d.url, (res) => {
            //console.log(d.url+" outer loop");
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
                if(d.name == "features"){
                  resourceListResponse.count = resourceListResponse.count + (parsedData.count/9);
                }else{
                  resourceListResponse.count += parsedData.count;
                }
                resourceListResponse.count;
                //console.log(parsedData);
                //console.log(resourceListResponse.count+"   "+count);
                
                parsedData.results.forEach(function(e){
                  //console.log(e.url);
                  if(!urlArr.includes(e.url)){
                    urlArr.push(e.url);
                    let responseData = {
                      listName: d.name,
                      name: e.name,
                      url: e.url
                    };
                    resourceListResponse.list.push(responseData);
                  }
                  if(/*resourceListResponse.count*/1225 === ++count){
                    getFullData(resourceListResponse);
                  }
                  
                }); 
            } catch (e) {
              console.error(e.message);
            }
          });
        }).on('error', (e) => {
          console.error(`Got error: ${e.message}`);
        });
      }
    });
  });
}

function getFullData(data){
  console.log(data.count);

  let numOfCalls = data.count;
  let fullData = [];
  fs.readFile(input, function(err, lData){
    if(err){
      
    }
    var names = JSON.parse(lData);
    names.list.forEach(function(f){
      var tmp = {
        resourceType: f,
        resourceData: []
      };
      fullData.push(tmp);
    });
  });

  let count = 0;
  data.list.forEach(function(d){
    limiter.request(function(err, backoff){
      if(err){
        return console.log(err+"error:1a");
      }else{
        http.get(d.url, (res) => {
          //console.log(d.url+" outer loop");
          const { statusCode } = res;
          const contentType = res.headers['content-type'];
          
          let error;
          if (statusCode !== 200) {
            error = new Error('Request Failed.\n' + `Status Code: ${statusCode}`);
          } else if (!/^application\/json/.test(contentType)) {
            error = new Error('Invalid content-type.\n' + `Expected application/json but received ${contentType}`);
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
              let mappedData = {
                resourceType: d.listName,
                data: parsedData
              };
              fullData.forEach(function(element){
                console.log(mappedData.resourceType+": "+count);
                if(element.resourceType == mappedData.resourceType){
                  element.resourceData.push(parsedData);
                }
              });
              /*
              if(numOfCalls == ++count){
                console.log("done");
                saveData(fullData);
              }
              */
              saveData(fullData);
          } catch (e) {
            console.error(e.message);
          }
        });
      }).on('error', (e) => {
        console.error(`Got error: ${e.message}`);
      });
      }
    });
  });
}

function saveData(iData){
  var dataString = JSON.stringify(iData, null, "\t");
  fs.writeFile('./data/data.json', dataString, 'utf8', (err) => {if(err){console.error(err)}});
}



function crawl(input) {
  fs.readFile(input, function(err, data){
    if (err){
      return console.log(err);
    }
    var resources = JSON.parse(data);
    var urls = {
      count: 0,
      list: []
    };
    resources.list.forEach(function(elem){
      //var fData = [];
      var rqstUrl = baseUrl+elem;
      var result = {
        name: elem, 
        url: rqstUrl
      };
      urls.list.push(result);
      ++urls.count;
      /*
      fData.forEach(function(e){
        var data = {
          rqstUrl: e.url,
          name: e.name,
          dir: "./data/full/",
          fileType: ".json",
          write: false
        };
      });
      */
    });
    httpGetList(urls, false);
  });

}

crawl(input);
