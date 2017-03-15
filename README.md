<img src="http://postfiles5.naver.net/MjAxNzAzMTVfMjMz/MDAxNDg5NTY4NjY0OTEw.NW1l-5VOppvl5pdxBfUnBJGv5bmnM7NM6sPoUr4fNQwg.c44oVld7u1gitW1YDpk-B9qGKrTKlkqSrfkjGpQyllYg.PNG.synth9/ev.PNG?type=w2"></img>
<br> beta version release.. <br>
# simple query
```
"use strict";
let evens = require('evens').mysql;
let conf = require('./db').singleConfig;
let t = new evens(conf);

let plan = [ { query: 'SELECT * FROM gym'}];
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
  values: ['gym']
}, {
  query: 'SELECT * FROM gym '
}, {
  // query result set
  query: 'SELECT * FROM gym WHERE id = ? and name = ? order by id asc ',
  preValues: [ { 1: 'id' }, { 1: 'name'} ]
}, {
  // if query result not matched do not query
  customData : [ { 1: 'name'} ], // you can set static value or query rst 
  customQuery : (data) =>{
    if(data[0]==='gym'){
      return 'SELECT * FROM ' + data[0];
    } else {
      return 'end';
    }
  }
}
];

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
