/* rb.js extends javascript wrapped basic ruby class library
 */
RB = {};

Object.defineProperty(Object.prototype, 'rename', {
  enumerable: false,
  value: function(ordered_hash){
    return Object.keys(orderd_hash).inject({}, function(ret, key, val, i, org){
      ret[val] = this[key]
      return ret;
    }.bind(this))
  }
});

Object.defineProperty(Object.prototype, 'forIn', {
  enumerable: false,
  value: function(fn, self) {
    Object.keys(this).forEach(function(key, index) {
      fn.call(self||this, key, this[key], index);
    }, this);
  }
});

Object.defineProperty(Object.prototype, 'merge', {
  enumerable: false,
  value: function(hash) {
    hash.forIn(function(k, v){this[k] = v}, this);
    return this;
  }
});

Object.defineProperty(Object.prototype, '_assign', {
  enumerable: false,
  value: function(key, value) {
    this[key] = value
    return this;
  }
});

Object.defineProperty(Object.prototype, 'fold', {
  enumerable: false,
  value: function(acc, fn, self) {
    Object.keys(this).forEach(function(key, index) {
      acc = fn.call(self||this, acc, key, this[key], index, self);
    }, this);
    return acc;
  }
});

Object.defineProperty(Object.prototype, 'keys', {
  enumerable: false,
  value: function() {
    return Object.keys(this);
  }
});


// クラスメソッド
Array.sequent = function(n, f){
  return Array.apply(null, Array(n)).map(function(v, i){return f == null ? i : f(i)});
}

// インスタンスメソッド

// 1. 参照系

Object.defineProperties(Array.prototype, {
  first: {
    enumerable: false,
    value: function(){
      return this.length > 0 ? this[0] : null;
    }
  },
  last: {
    enumerable: false,
    value: function(key){
    if (key == null)
      return this.length > 0 ? this[this.length - 1]: null;
    else
      return this.length > 0 ? this[this.length - 1][key] : null;
    }
  },
  delete: { // 2. 削除系
    enumerable: false,
    value: function(o, block){
      var k = this.findIndex(function(a, i, self){ return a == o })
      if (k != -1)
        return this.splice(k, 1);
      else
        return (block == null) ? null : block.call(this);
    }
  },
  delete_at: {
    enumerable: false,
    value: function(k){
      return this.splice(k, 1)[0];
    }
  },
  _push: { // 3. 更新系
    enumerable: false,
    value: function(v){
        this.push(v);
      return this;
    }
  },
  each: { // イテレータ系
    enumerable: false,
    value: function(f){
      this.forEach(f, this);
    }
  },
  inject: {
    enumerable: false,
    value: function(init, f){
      return this.reduce(f.bind(this), init);
    }
  },
  uniq: {
    enumerable: false,
    value: function(v){
      return this.filter(function(x, i, self){return self.indexOf(x) === i});
    }
  }, 
  intersect: {
    enumerable: false,
    value: function(y){
      if (this.length < 1 || y.length < 1)
        return [];
    
      var a = this.sort();
      var b = y.sort();
      var a_i=0, b_i=0;
      var result = [];
    
      while( a_i < a.length && b_i < b.length ){
        if      (a[a_i] < b[b_i] ){ a_i++; }
        else if (a[a_i] > b[b_i] ){ b_i++; }
        else /* they're equal */
        {
          result.push(a[a_i]);
          a_i++;
          b_i++;
        }
      }
    
      return result;
    }    
  },
  complement: {
    enumerable: false,
    value: function(y){
      var intersection_set = this.intersect(y);
    
      var diff_set = y.filter(function(e){return (intersection_set.indexOf(e) == -1);});
        
      return {intersection: intersection_set, diff: diff_set};
    }
  },
  diff: {
    enumerable: false,
    value: function(y){
      return this.complement(y).diff;
    }
  },
  sortby: {
    enumerable: false,
    value: function(key, isDesc){  
      return this.sort(function(a, b){
        var x = (key == null) ? a : a[key];
        var y = (key == null) ? b : b[key];
        if (x-0 > y-0) return  isDesc == null? 1 : -1;
        if (x-0 < y-0) return  isDesc == null?-1 :  1;
        return 0;
      })
    }
  },
  _reverse: {
    enumerable: false,
    value: function(){  
      return [].concat(this).reverse();
    }
  },
  flatten: {
    enumerable: false,
    value: function() {
      return Array.prototype.concat.apply([], this);
    }
  },
  account: {
    enumerable: false,
    value: function(alignment, key2, cb){
      if (alignment.length < 1)
        return null
      var list  = [].concat(alignment);
      return this.map(function(v, k){
        var under = list.first();
        if (v < under[key2])
          return cb == null ? {under: clone(under)._assign("n", 0)._assign(key2, v),
            upper: under._assign("n", 0)}
        : cb.call(this, v, clone(under)._assign("n", 0), under._assign("n",0), k)
        for (;list.length > 0; list.shift()){
          var under_i = alignment.length - list.length;
          under = list[0];
          var upper = list.length < 2 ? null : list[1];
          if (upper == null || v  < upper[key2]){
      return cb == null ?
        {under: under._assign("n", under_i),
        upper: upper._assign("n", under_i+1)
        }._assign(key2, v) : cb.call(this, v, under._assign("n",under_i), upper==null?null:upper._assign("n",under_i+1), k)
          }
        }
        throw new Error("not classified.")
      })
    }
  },
  tag: {
    enumerable: false,
    value: function(tagname, prec){
      return this.map(function(e, i){
        if (tagname == 'th'){
          return {'th': e};
        }else if (tagname == 'td'){
          return e != null && e != "" && isFinite(e-0) ? {'td': e.toFixed(prec)} : {'td': e};
        }else if (tagname == 'thtd' || tagname == 'tdth' ){
          return ((i % 2) == (tagname == 'thtd' ? 0:1)) ? {'th': e} :
          (e != null && e != "" && isFinite(e-0) ? {'td': e.toFixed(prec)} : {'td': e});
        }else{
          var new_element = {};
          new_element[tagname] = e;
          return new_element
        }
      })
    }
  },
  tagging: {
    enumerable: false,
    value: function(tagname, cb){
      return this.map(function(e, i){
        var isNum = e != null && e != "" && typeof e.toFixed == 'function';
        var tagged = {}._assign(tagname.split("_")[0], isNum ? e-0: e);
        if (isNum && /^td(_(\d+))?/.test(tagname)){
          tagged = {'td': tagged.td.toFixed(RegExp.$2)};
        }
        return cb==null ? tagged : cb.call(this, tagged, i);
      })
    }
  },
  zip: {
    enumerable: false,
    value: function(a){
      return this.inject([], function(new_a, e, i, self){
        return new_a._push([e, a[i]]);
      })
    }
  },
  transpose: {
    enumerable: false,
    value: function(){
      var transposed = this[0] == null ? [] : this[0].map(function(col, ncol){
        var transposed_rows = this.map(function(row, j){return row[ncol]})
        return transposed_rows;
      }, this)
      return transposed;
    }
  }, 
  invert: {
    enumerable: false,
    value: function(){
      return this.inject({}, function(hash, e, i){
        return hash._assign(e, i);
      })
    }
  },
  index_by: {
    enumerable: false,
    value: function(cond){
      return this.inject({}, function(ret, e){
        var val = cond(e);
        if (ret[val] == null)
          ret[val] = [e]
        else
          ret[val].push(e);
        return ret;
      }) 
    }
  },
  group_by: {
    enumerable: false,
    value: function(cond){
      var hash = this.index_by(cond);
      return Object.values(hash);
    }
  },

});

if(!Array.isArray) {
  Array.isArray = function (vArg) {
    return Object.prototype.toString.call(vArg) === "[object Array]";
  };  
}

RB.WDAY = ['日','月','火','水','木','金','土'];

function sleep(time, callback){
  setTimeout(callback == null ? function(){return null} : callback, time);
}

// Angle Extension;

Object.defineProperties(Number.prototype, {
    'rad'   : {
	get : function(){
	    return this / 180 * Math.PI;
	}
    },
    'degree': {
	get : function(){
	    return this * 180 / Math.PI;
	}
    },/*
    'deg': {
	get : function(){
	    return Math.floor(this.degree);
	}
    },
    'min': {
	get : function(){
	    return new Date(this.degree*60*60*1000).getMinutes();
	}
    },
    'sec': {
	get : function(){
	    return new Date(this.degree*60*60*1000).getSeconds();	    
	}
    },
    'msec': {
	get : function(){
	    return new Date(this.degree*60*60*1000).getMilliseconds();
	}
    },
    'seconds': {
	get : function(){
	    return ((this.degree - this.deg)*60 - this.min)*60
	}
    },
    'toString': {
	enumerable: false,
	value: function(digits=4){
	    return [this.deg, this.min, digits==null? this.seconds : this.seconds.toFixed(digits)].join("-");
	}
    }*/
})

class Cookies {
    constructor(){
        const encodedCookie  = document.cookie;
        this._cookies = encodedCookie.split(/;/).inject({}, (prev, encoded)=>{
            const [key, value] = encoded.split("=");
            return prev._assign(key.trim(), value);
        })
    }
    static get status(){
        return new Cookies();
    }
    static read(key){
        return this.status._cookies[key];
    }
    static write(key, value){
        document.cookie = `${key}=${value}`;
    }
}

function getFile(url, callbackf){
    var http = new XMLHttpRequest();
    http.callback = callbackf;
    http.arguments= Array.prototype.slice.call(arguments, 2);
    http.onreadystatechange = function(){
        if (this.readyState == 4 && this.status == 200){
            this.arguments[0] = this.responseText;
            this.arguments[1] = this.getAllResponseHeaders()
        }
    }
    http.onload = function(){this.callback.apply(this, this.arguments);}
    http.onerror= function(){console.error(this.statusText);}
    http.open("GET", url);
    http.send(null);
}

String.prototype.basename = function(ext){
    const i = this.lastIndexOf('/');
    const basename = (i < 0) ? this : this.slice(i+1);
    if(ext==null)
      return basename
      
    const j = basename.lastIndexOf('.');
    return ((j < 0) ? basename : basename.substring(0, j)) + ext;
}

String.prototype.extname = function(){
  return this.replace(/.+(\..*)$/, "$1");
}
String.prototype.filename = function(){
    return this.basename();
}

FileReader.prototype.readAs = function(file, ctx){    
    return new Promise((resolv, reject)=>{
      this.addEventListener("load", ({target}) => resolv(target.result,));
      this.addEventListener("error", ({target}) => reject(target.error));
      ["loadstart", "progress", "loadend"].forEach( (ev) => {
          if(this.handlers && this.handlers[ev]){
              reader.addEventListener(ev, this.handlers[ev])
          }                    
      })
      console.log("FileReader open: ", file.name);
      this[ctx || this.context](file);
  });
}

RB.File = class extends FileReader {
    constructor(file, handlers={}){
      super();
      const ext = file.name.extname();
      this.context = File.drivers[ext] || "readAsText";
      this.handlers = handlers;
    }
}

File.open = function(blob, handlers){
    const fd = new RB.File(blob, handlers);    
    return fd.readAs(blob);
}

File.types = {};
File.drivers = {
    ".xlsm": "readAsBinaryString",
    ".json": "readAsText"
};