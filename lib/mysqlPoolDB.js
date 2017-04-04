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
      this.emit('makeQuery', r, db);
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
      if(typeof(r.esult[r.op].customQuery)==='function'){
        let c = r.esult[r.op].customData.get; // description for query params []
        for(let k in c){
        if(typeof(c[k])==='object'){
            let key = parseInt(Object.keys(c[k])[0]);
            if(r.esult[key].rows=='' || typeof(r.esult[key].rows)==='undefined'){
              r.esult[r.op].customData.set.push(false);
            } else {
              r.esult[r.op].customData.set.push(r.esult[key].rows[0][c[k][key]]);  
            }
          } else if(typeof(c[k])==='string'){
            r.esult[r.op].customData.set.push(c[k]);
          } else if(typeof(c[k])==='number'){
            if(r.esult[c[k]].rows=='' || typeof(r.esult[c[k]].rows)==='undefined'){
              r.esult[r.op].customData.set.push(false);
            } else {
              r.esult[r.op].customData.set.push(r.esult[c[k]].rows);
            }
          }
        }
        
          let call = r.esult[r.op].customQuery(r.esult[r.op].customData.set, r.cD);
          r.esult[r.op].query = {
              sql : call.query,
              timeout : r.qT
          };
          r.esult[r.op].values = typeof(call.values)==='undefined' ? [] : call.values;
          if(typeof(call.cData)!=='undefined'){
            r.cD = call.cData;
          }
        this.emit('query',r, db);
      } else {
        this.emit('query',r, db);
      } 
    });
  
     this.on('query', (r, db)=>{
      if(r.esult[r.op].query.sql==='end'){
        this.emit('connectionEnd', r, db);
      } else if(r.esult[r.op].query.sql==='pass'){
        r.op++;
        this.emit('makeQuery', r, db);
      } else if(r.esult[r.op].query.sql==='cancel'){
        db.rollback((rollbackErr)=>{
            if(rollbackErr) this.emit('err', rollbackErr);
            db.release();  
            r.cancel = true;
            this.emit('connectionClose', r);
            this.removeAllListeners();
        });
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
              this.emit('makeQuery', r, db);
            }
          }
        });
      }
    });
}

util.inherits(mysqlPoolDB, require('events').EventEmitter); 