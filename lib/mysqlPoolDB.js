"use strict";
var util = require('util');

// poolcluster mysql
module.exports = mysqlPoolDB;

function mysqlPoolDB(pool){
    
    this.connect = (r) => pool.getConnection((err, db)=>{
        if(err){
          r.err = err;
          this.emit('err', r);
        } else {
          db.beginTransaction((err)=>{
            if(err){
              db.release();
              r.err = err;
              this.emit('err', r);
            } else {
              this.emit('connectionOK', r, db);
            }
          });
        }
    });
  
    this.on('connectionOK', (r, db)=>{
      this.emit('makeQuery', r, db);
    });
  
    this.on('connectionEnd', (r, db)=>{
      db.commit((commitErr)=>{
        db.release();
        if(commitErr){
          r.err = commitErr;
          this.emit('err', r);
          this.removeAllListeners(); 
        } else {
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
            if(typeof(r.esult[key].rows)==='undefined' || r.esult[key].rows==''){
              r.esult[r.op].customData.set.push(false);
            } else {
              r.esult[r.op].customData.set.push(r.esult[key].rows[0][c[k][key]]);  
            }
          } else if(typeof(c[k])==='string'){
            r.esult[r.op].customData.set.push(c[k]);
          } else if(typeof(c[k])==='number'){
            if(typeof(r.esult[c[k]].rows)==='undefined' || r.esult[c[k]].rows==''){
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
            db.release();
            r.cancel = true;
            if(rollbackErr){
              r.err = rollbackErr;
              this.emit('err', r);
            } else {
              this.emit('connectionClose', r);
              this.removeAllListeners();  
            }
        });
      } else {
        db.query(r.esult[r.op].query, r.esult[r.op].values, (err, rows)=>{
          r.esult[r.op].rows = rows;
          r.op++;
          if(err){
            r.err = err;
            db.rollback((rollbackErr)=>{
              db.release();
              if(rollbackErr){
                r.err = rollbackErr;
                this.emit('err', r);
              } else {
                this.emit('err', r);
                this.removeAllListeners();  
              }
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