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

// クラスメソッド
Array.sequent = function(n, f){
  return Array.apply(null, Array(n)).map(function(v, i){return f == null ? i : f(i)});
}

// インスタンスメソッド

// 1. 参照系
Array.prototype.first= function(){return this.length > 0 ? this[0] : null};

Array.prototype.last = function(key){
  if (key == null)
    return this.length > 0 ? this[this.length - 1]: null;
  else
    return this.length > 0 ? this[this.length - 1][key] : null;
};

// 2. 削除系
Array.prototype.delete = function(o, block){
  var k = this.findIndex(function(a, i, self){ return a == o })
  if (k != -1)
    return this.splice(k, 1);
  else
    return (block == null) ? null : block.call(this);
}

Array.prototype.delete_at = function(k){
  return this.splice(k, 1)[0];
}

// 3. 更新系
Array.prototype._push  = function(v){
  this.push(v);
  return this;
}

// イテレータ系
// Array.prototype.delete_if = function(block){

Array.prototype.each = function(f){
  this.forEach(f, this);
}

Array.prototype.inject = function(init, f){
  return this.reduce(f.bind(this), init);
}


Array.prototype.uniq  = function(v){
  return this.filter(function(x, i, self){return self.indexOf(x) === i});
}


Array.prototype.intersect = function(y){
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

Array.prototype.complement = function(y){
  var intersection_set = this.intersect(y);

  var diff_set = y.filter(function(e){return (intersection_set.indexOf(e) == -1);});
    
  return {intersection: intersection_set, diff: diff_set};
}

Array.prototype.diff = function(y){
  return this.complement(y).diff;
}

Array.prototype.sortby= function(key, isDesc){
  
  return this.sort(function(a, b){
    var x = (key == null) ? a : a[key];
    var y = (key == null) ? b : b[key];
    if (x-0 > y-0) return  isDesc == null? 1 : -1;
    if (x-0 < y-0) return  isDesc == null?-1 :  1;
    return 0;
  })
}
Array.prototype.uniq= function(){
  
  return this.filter(function(x, i, self){return self.indexOf(x) === i})

}

Array.prototype._reverse= function(){
  
  return [].concat(this).reverse();

}

Array.prototype.flatten = function() {
  return Array.prototype.concat.apply([], this);
};

Array.prototype.account = function(alignment, key2, cb){
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




Array.prototype.tag = function(tagname, prec){
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

Array.prototype.tagging = function(tagname, cb){
  return this.map(function(e, i){
    var isNum = e != null && e != "" && typeof e.toFixed == 'function';
    var tagged = {}._assign(tagname.split("_")[0], isNum ? e-0: e);
    if (isNum && /^td(_(\d+))?/.test(tagname)){
      tagged = {'td': tagged.td.toFixed(RegExp.$2)};
    }
    return cb==null ? tagged : cb.call(this, tagged, i);
  })
}

Array.prototype.zip= function(a){
  return this.inject([], function(new_a, e, i, self){
    return new_a._push([e, a[i]]);
  })
}

Array.prototype.transpose= function(){
  var transposed = this[0] == null ? [] : this[0].map(function(col, ncol){
    var transposed_rows = this.map(function(row, j){return row[ncol]})
    return transposed_rows;
  }, this)
  return transposed;
}

Array.prototype.invert = function(){
  return this.inject({}, function(hash, e, i){
    return hash._assign(e, i);
  })
}

Array.prototype.index_by = function(cond){
  return this.inject({}, function(ret, e){
    var val = cond(e);
    if (ret[val] == null)
      ret[val] = [e]
    else
      ret[val].push(e);
    return ret;
  }) 
}

Array.prototype.group_by = function(cond){
  var hash = this.index_by(cond);
  return Object.values(hash);
}

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
  return this.replace(/.+\/(.*)(\..*)/g, ext == null ? "$1$2" : "$1"+ext)
}