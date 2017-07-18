"use strict";
var util = require('util');

// poolcluster mysql
module.exports = mysqlPoolDB;

function typeCheck(key){
    if(typeof(key)!=='undefined') {
        if (typeof(key.rows) !== 'undefined') {
            return key.rows !== '';
        } else {
            return false;
        }
    } else {
        return false;
    }
}

function mysqlPoolDB(pool){

    this.connect = (r) => pool.getConnection((err, db)=>{
        if(err){
          r.mysqlDBerr = err;
          this.emit('err', r);
        } else {
          db.beginTransaction((err)=>{
            if(err){
              db.release();
              r.mysqlDBerr = err;
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
          r.mysqlDBerr = commitErr;
          this.emit('err', r);
          this.removeAllListeners();
        } else {
          this.emit('connectionClose', r);
          this.removeAllListeners();
        }
      });
    });

    this.on('makeQuery', (r, db)=>{
        r.esult[r.op].op = r.op;
        if(typeof(r.esult[r.op])!=='undefined'){
          if(typeof(r.esult[r.op].customQuery)==='function'){
              if(typeof(r.esult[r.op].customData) !== 'undefined'){
                  let c = r.esult[r.op].customData.get; // description for query params []
                  for(let k in c){
                      if(typeof(c[k])==='object'){
                          const key = parseInt(Object.keys(c[k])[0]);
                          if(typeCheck(r.esult[key])){
                              r.esult[r.op].customData.set.push(r.esult[key].rows[0][c[k][key]]);
                          } else {
                              r.esult[r.op].customData.set.push(false);
                          }
                      } else if(typeof(c[k])==='string'){
                          r.esult[r.op].customData.set.push(c[k]);
                      } else if(typeof(c[k])==='number'){
                          if(typeCheck(r.esult[c[k]])){
                              r.esult[r.op].customData.set.push(r.esult[c[k]].rows);
                          } else {
                              r.esult[r.op].customData.set.push(false);
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
          } else {
              this.emit('query',r, db);
          }
      } else {
        this.emit('query',r, db);
      }
    });

    this.on('query', (r, db)=>{
        if(typeof(r.esult[r.op])!=='undefined'){
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
                        r.mysqlDBerr = rollbackErr;
                        this.emit('err', r);
                    } else {
                        this.emit('err', r);
                        this.removeAllListeners();
                    }
                });
            } else {
                db.query(r.esult[r.op].query, r.esult[r.op].values, (err, rows)=>{
                    r.esult[r.op].rows = rows;
                    r.op++;
                    if(err){
                        r.mysqlDBerr = err;
                        db.rollback((rollbackErr)=>{
                            db.release();
                            if(rollbackErr){
                                r.mysqlDBerr = rollbackErr;
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
        } else {
            this.emit('connectionEnd', r, db);
        }
    });
}

util.inherits(mysqlPoolDB, require('events').EventEmitter);