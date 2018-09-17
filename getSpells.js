var fs = require('fs');
const http = require('http');
var list = [];
var resourceLists = null;


//httpGetRequest("http://www.dnd5eapi.co/api/spells/1", "spells");



function httpGetRequest(rqstUrl,flName) {

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
        const spellUrls = parsedData.results.map(spellRef => spellRef.url);

        let spells = [];
        let progress = 1;

        //note: this could be too fast if the api rate limits (or blocks subsequent fast calls)
        //      since these are async calls, this will not work consistently in js.
        //      because of this, we use a progress counter to ensure that the code after this for loop is run at the right time.
        spellUrls.forEach(url => {
          http.get(url, res => {
            res.setEncoding('utf8');
            let rawSpell = '';
            res.on('data', chunk => { rawSpell += chunk; });
            res.on('end', () => {
              spells.push(JSON.parse(rawSpell));
              if(spellUrls.length === ++progress)
                saveSpells();
            });
          })
        })

        function saveSpells() {
          const transformedData = spells.map(spell => {
            return {
              id: spell.index,
              name: spell.name,
              desc: spell.desc,
              range: spell.range,
              school: spell.school.name,
              classes: spell.classes.map(c => c.name),
            }
          });

          var serializedSpells = JSON.stringify(transformedData, null, "\t");
          fs.writeFile("./data/spells/spellsData.json", serializedSpells, "utf8");
        }

      } catch (e) {
        console.error(e.message);
      }
    });
  }).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
  });
}

function init(path, input) {
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


crawl();
