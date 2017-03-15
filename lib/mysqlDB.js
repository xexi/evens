"use strict";
var util = require('util');
var _mysql = require('mysql');

module.exports = mysqlDB;

function mysqlDB(conf){
  
   this.connect = (r) =>{
     this.emit('query', r);
   };
  
   this.on('query', (r) =>{
     let db = _mysql.createConnection(conf);
      db.query(r.esult[r.op].query, r.esult[r.op].values, (err, rows)=>{
        db.end();
        r.esult[r.op].rows = rows;
        r.op++;
        if(err){
          this.emit('err', err);
          this.removeAllListeners();
        } else {
          if(r.op === r.ed){
            this.emit('queryEnd', r);
            this.removeAllListeners();
          } else {
            this.emit('query', r, db);
          }
        }
      });
   });
           
}

util.inherits(mysqlDB, require('events').EventEmitter); 
