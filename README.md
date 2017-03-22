<img src="http://postfiles5.naver.net/MjAxNzAzMTVfMjMz/MDAxNDg5NTY4NjY0OTEw.NW1l-5VOppvl5pdxBfUnBJGv5bmnM7NM6sPoUr4fNQwg.c44oVld7u1gitW1YDpk-B9qGKrTKlkqSrfkjGpQyllYg.PNG.synth9/ev.PNG?type=w2"></img>
<br> prototype version.. 
<br><br>
sample mysql DB
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
  goOnData: { switch : 'off' }
}, {
  query: 'SELECT * FROM gym '
}, {
  query: 'SELECT * FROM gym WHERE id = ? and name = ? order by id asc ',
  preValues: [ { 1: 'id' }, { 1: 'name'} ] // get plan[1] query result with desired column
}, {
  customData : [ 1 ],
  customQuery : (data) => {
    // just give a number to customData you can retrive all plan[1] query result 
    return { query: 'SELECT * FROM gym '};
  }
}, {
  // if query result not matched do not query
  customData : [ { 1: 'name'} ], // you can set static value or query result like preValues
  customQuery : (data, goOnData) =>{
    if(data[0]==='gym'){
      goOnData['switch'] = 'on'; // let's get more tricky
      return {
        query: 'SELECT * FROM ' + data[0],
        goOnData: goOnData 
      };
    } else {
      return 'end';
    }
  }
}, {
  customQuery : (data, goOnData)=>{
    if(goOnData.switch==='on') return {query: 'SELECT * FROM day'}; // you can change program flow by goOnData
    return 'end';
  }
} ];

let Q = new evens(pool, {queryTimeout: 10000}); // set general query timeout
Q.query(plan);
Q.on('end', (r)=>{
  if(r.pass){
    console.log(r.esult);    
  } else {
    console.log(JSON.stringify(r)); // err
  }
});
```
