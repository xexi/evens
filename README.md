<a href="https://snyk.io/test/github/xexi/evens"><img src="https://snyk.io/test/github/xexi/evens/badge.svg" alt="Known Vulnerabilities" data-canonical-src="https://snyk.io/test/github/xexi/evens" style="max-width:100%;"></a>
<img src="http://postfiles5.naver.net/MjAxNzAzMTVfMjMz/MDAxNDg5NTY4NjY0OTEw.NW1l-5VOppvl5pdxBfUnBJGv5bmnM7NM6sPoUr4fNQwg.c44oVld7u1gitW1YDpk-B9qGKrTKlkqSrfkjGpQyllYg.PNG.synth9/ev.PNG?type=w2"></img>
<br><b>someone who hates callback or promise</b>
<br><b> - still in the development process don't use </b>
<br><br>
<b>sample mysql DB</b>
<br>
<img src="http://postfiles12.naver.net/MjAxNzAzMjJfNSAg/MDAxNDkwMTUwODY4MTQ4.Z5KxDrrNyRgB42XJMAkGEPAT88DD8nWrhaHgWWQdNQsg.g9mqlU1JUriax-jNoBElUIfiyVRiXgVSz7V0uj9dmU4g.PNG.synth9/dd.PNG?type=w2"></img>
<br><br>

# simple query
```
"use strict";
let evens = require('evens').mysql;
let conf = require('./db').singleConfig;
let t = new evens(conf);

let plan = [ { query: 'SELECT * FROM gym'}]; // add more query by { query: 'blabla' }
t.query(plan);
t.on('end', (r)=>{ console.log(r.esult); });
```
<br><br>

# advanced query
```
"use strict";
let evens = require('evens').mysqlPool;
let pool = require('./db').pool; // your DB pool ex> var mysql = require('mysql'); var pool  = mysql.createPool({});

let plan = [ {
  query: { sql: 'UPDATE gym SET name = ? WHERE id = \'bird\'', timeout : 500000 },
  values: ['gym'],
  cData: { switch : 'off' } // must assign if you're going to use data chainning
}, {
  query: 'SELECT * FROM gym '
}, {
  customData : [ 1 ],
  customQuery : (data) => {
    // just give a number to customData you can retrive all plan[1] query result 
    if(data){
      return { query: 'SELECT * FROM gym '};
    } else {
      return 'pass'; /* must consider customData exception 
                        by 'pass' command you can just skip this query
                        or you can just quit process and end connection by 'end' command */
    }
  }
}, {
  // if query result not matched do not query
  customData : [ { 1: 'name'} ], // you can set static value or query result ( obj,str,arr )
  customQuery : (data, cData) =>{
    if(data[0]==='gym'){
      cData['switch'] = 'on'; // let's get more tricky
      return {
        query: 'SELECT * FROM ' + data[0],
        cData: cData 
      };
    } else {
      return 'pass'; 
    }
  }
}, {
  customQuery : (data, cData)=>{
    if(cData.switch==='on') return {query: 'SELECT * FROM day'}; // you can change program flow by cData   
  }
} ];

let Q = new evens(pool, {queryTimeout: 10000}); // set general query timeout
Q.query(plan);
Q.on('end', (r)=>{
  if(r.success){
    console.log(r.esult);    
  } else {
    console.log(JSON.stringify(r)); // err
  }
});
```

# todo
end with using pass exception
opt.queryTimeout input exception
naming fix

# furtuer todo 
test code
security 