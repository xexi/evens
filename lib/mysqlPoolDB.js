"use strict";
var util = require('util');

// poolcluster mysql
module.exports = mysqlPoolDB;

function mysqlPoolDB(pool){
    
    this.connect = (r) => pool.getConnection((err, db)=>{
        if(err) this.emit('err', err);
          db.beginTransaction((err)=>{
            if(err){
              db.release();
              this.emit('err', err);
            } else {
              this.emit('connectionOK', r, db);
            }
          });
    });
  
    this.on('connectionOK', (r, db)=>{
      this.emit('PreData', r, db);
    });
  
    this.on('connectionEnd', (r, db)=>{
      db.commit((commitErr)=>{
        if(commitErr){
          this.emit('err', commitErr);
          this.removeAllListeners(); 
        } else {
          db.release();
          this.emit('connectionClose', r);
          this.removeAllListeners();
        }
      });
    });
        
    this.on('makeQuery', (r, db)=>{
      if(typeof(r.esult[r.op].customQuery)!=='undefined'){
        let isEmpty = false;
        let c = r.esult[r.op].customData.get; // description for query params []
        for(let k in c){
        if(typeof(c[k])==='object'){
            let key = parseInt(Object.keys(c[k])[0]);
            if(r.esult[key].rows==''){
              isEmpty = true;
              break;
            } else {
              r.esult[r.op].customData.set.push(r.esult[key].rows[0][c[k][key]]);  
            }
          } else if(typeof(c[k])==='string'){
            r.esult[r.op].customData.set.push(c[k]);
          } else if(typeof(c[k])==='number'){
            if(r.esult[c[k]].rows==''){
              isEmpty = true;
              break;
            } else {
              r.esult[r.op].customData.set = r.esult[c[k]].rows;
            }
          }
        }
        if(isEmpty){
          r.esult[r.op].query = r.esult[r.op].customQuery(false);
        } else {
          let s = r.esult[r.op].customData.set;           
          r.esult[r.op].query = r.esult[r.op].customQuery(s, r.gD).query;
          if(typeof(r.esult[r.op].customQuery(s, r.gD).goOnData)!=='undefined'){
            r.gD = r.esult[r.op].customQuery(s, r.gD).goOnData;  
          }
        }
        this.emit('query',r, db);
      } else {
        this.emit('query',r, db);
      } 
    });
    
   // retrive previous sql results (only row[0])
   this.on('PreData', (r, db)=>{     
      if(typeof(r.esult[r.op].preValues)!=='undefined'){
        let p = r.esult[r.op].preValues;
        for(let j in p){
        let key = parseInt(Object.keys(p[j])[0]);
          if(r.esult[key].rows==''){
            r.esult[r.op].query = 'end';
              break;
          } else {
            r.esult[r.op].values.push(r.esult[key].rows[0][p[j][key]]);  
          }
        }
        this.emit('makeQuery',r, db);
      } else {
        this.emit('makeQuery',r, db);
      } 
    });
  
    this.on('query', (r, db)=>{
      if(r.esult[r.op].query==='end'){
        this.emit('connectionEnd', r, db);
      } else {
        db.query(r.esult[r.op].query, r.esult[r.op].values, (err, rows)=>{
          r.esult[r.op].rows = rows;
          r.op++;
          if(err){
            db.rollback((rollbackErr)=>{
              db.release();
              if(rollbackErr) this.emit('err', rollbackErr);
              this.emit('err', err);
              this.removeAllListeners();
            });
          } else {
            if(r.op === r.ed){
              this.emit('connectionEnd', r, db);
            } else {
              this.emit('PreData', r, db);
            }
          }
        });
      } 
    });
}

util.inherits(mysqlPoolDB, require('events').EventEmitter); 