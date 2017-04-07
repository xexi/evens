"use strict";
module.exports = mysqlPool;
let mysqlPoolDB = require('./mysqlPoolDB');
let util = require('util');

class DB{
  constructor(o){
    this.query = typeof(o.query) === 'undefined' ? 'end' : {
      sql : typeof(o.query.sql) === 'undefined' ? o.query : o.query.sql,
      timeout : o.query.timeout
    };
    this.values = typeof(o.values) === 'undefined' ? [] : o.values;
    this.rows = o.rows;   
    this.customData = {
      get : o.customData,
      set : []
    };
    this.customQuery = o.customQuery;
  }
}

function mysqlPool(pool, opt){
  
  let mysql = new mysqlPoolDB(pool); 
    this.query = (r)=>{
      this.emit('queryTale', r);
    };
  
  let _queryTale = (r) => {
    let plot = [];
    let queryTimeout = typeof(opt) === 'undefined' ? 10000 : opt.queryTimeout;
    for(var i=0; i<r.length; i++){
      if(typeof(r[i].query) ==='string'){
        r[i].query = {
          sql : r[i].query,
          timeout : queryTimeout
        };
      }
      plot.push(new DB(r[i]));
    }
    let write = {
      op : 0,
      cD : r[0].cData,
      ed : r.length,
      qT : queryTimeout,
      esult : plot,
      mysqlDBerr : false
    };
    this.emit('bindQuery', write);
  };
  
  let _process = (r) => {
    mysql.on('connectionClose', (rst)=>{
      this.emit('processEnd', rst);
    });
    mysql.connect(r);
  };
      
  let _success = (r) => {
      r.success = true;
      this.emit('end', r);
      this.removeAllListeners();
  };
  
  let _fail = (err) => {
      this.emit('end', err);
      this.removeAllListeners();
  };
  
  this.on('queryTale', _queryTale);
  this.on('bindQuery', _process);
  this.on('processEnd', _success);
  
  mysql.on('err', _fail);
}

util.inherits(mysqlPool, require('events').EventEmitter);