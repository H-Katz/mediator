class Datum {
    static get a() {return 6378137 }
    static get RF(){return 298.257222101}
    static get m0(){return 0.9999 }
    static get n() {return this._n || (this._n = 1/(2*Datum.RF -1));}
    static get ra(){
	const n   = Datum.n;
	const nsq = n * n;
	return this._ra || ( this._ra = [
	    1+nsq/4+nsq*nsq/64, 
	    -3/2*(1-nsq/8-nsq*nsq/64)*n,
	    15/16*(1-nsq/4)*nsq,
	    -35/48*(1-5*nsq/16)*n*nsq,
	    315/512*nsq*nsq,
	    -693/1280*n*nsq*nsq
	])
    }
    static get RA(){
	return this._RA ||(this._RA = Datum.m0*Datum.a/(1+Datum.n)*Datum.ra[0]);
    }

    static get alpha(){
	    const n = Datum.n;
	    const nsq = n * n;
	    return this._alpha || (this._alpha = [
	        null,
	        (1/2+(-2/3+(5/16+(41/180-127/288*n)*n)*n)*n)*n,
	        (13/48+(-3/5+(557/1440+281/630*n)*n)*n)*nsq,
	        (61/240+(-103/140+15061/26880*n)*n)*n*nsq,
	        (49561/161280-179/168*n)*nsq*nsq,
	        34729/80640*n*nsq*nsq
	    ]);
    }

    rs(phi0){
	const m0 = Datum.m0;
	const a  = Datum.a;
	const n  = Datum.n;
	return (m0*a/(1+n))*(Datum.ra[0]*phi0 + Datum.ra.reduceRight((prev, ra_j, j)=>{
	    return j < 1 ? prev : (prev + ra_j * Math.sin(2*j*phi0));
	}, 0))
    }
    phi0(num=2){
	// 平面直角座標の座標系原点の緯度を度単位で、経度を分単位で格納
	const phi0 =[0,33,33,36,33,36,36,36,36,36,40,44,44,44,26,26,26,26,20,26] // 1-19
	return phi0[num].rad;
    }
    lmbd0(num=2){
	// 平面直角座標の座標系原点の緯度を度単位で、経度を分単位で格納
	const lmbd0=[0,7770,7860,7930,8010,8060,8160,8230,8310,8390,8450,8415,   // 1-19
		     8535,8655,8520,7650,7440,7860,8160,9240]
	return (lmbd0[num]/60).rad
    }
    
    nphi(phi){
	const n = Datum.n;
	return (1-n)/(1+n)*Math.tan(phi);
    }

    getXY(lat, lng, num){
	const phi = lat.rad;
	const lmbd= lng.rad;
	const phi0= this.phi0(num);
	const lmbd0=this.lmbd0(num);
	
	const a   = Datum.a;
	const RF  = Datum.RF;
	const m0  = Datum.m0;
	const n   = Datum.n;
	
	const nsq = n*n;    
	const e2n = 2*Math.sqrt(n)/(1+n);
	const sphi= Math.sin(phi);
	
	const t   = Math.sinh(Math.atanh(sphi) - e2n*Math.atanh(e2n*sphi)), _t  = Math.sqrt(1+t*t);
	const lmbd_c = Math.cos(lmbd - lmbd0), lmbd_s = Math.sin(lmbd - lmbd0);
	const xip = Math.atan(t/lmbd_c),       etap   = Math.atanh(lmbd_s/_t);

	const sum_alpha = Datum.alpha.map((e_j, j)=>{
	    return {sin2jxip: e_j*Math.sin(2*j*xip), cos2jxip: e_j*Math.cos(2*j*xip)};
	});
	const xi  = xip + sum_alpha.reduceRight((prev, alp_j, j)=>{
	    return (prev +     alp_j.sin2jxip * Math.cosh(2*j*etap)) 
	}, 0)
	const eta = etap+ sum_alpha.reduceRight((prev, alp_j, j)=>{
	    return (prev +     alp_j.cos2jxip * Math.sinh(2*j*etap)) 
	}, 0)
	const sgm = 1   + sum_alpha.reduceRight((prev, alp_j, j)=>{
	    return (prev + 2*j*alp_j.cos2jxip * Math.cosh(2*j*etap)) 
	}, 0)
	const tau =       sum_alpha.reduceRight((prev, alp_j, j)=>{
	    return (prev + 2*j*alp_j.sin2jxip * Math.sinh(2*j*etap))
	}, 0)
	
	const RA  = Datum.RA;
	const nphi= this.nphi(phi);
	/* target values */
	const x = RA * xi - this.rs(phi0), y = RA * eta;
	const gmm = Math.atan((tau*_t*lmbd_c+sgm*t*lmbd_s)*(sgm*_t*lmbd_c-tau*t*lmbd_s)),
	      m = RA/a * Math.sqrt((sgm*sgm+tau*tau)/(t*t+lmbd_c*lmbd_c)*(1+nphi*nphi));
	return {x: x, y: y, gamma: gmm, m: m};
    }
    
    static get beta(){
	const n = Datum.n;
	const nsq = n * n;
	return this._beta || (this._beta = [
	    null,
	    (1/2 + (-2/3 + (37/96 + (-1/360 -81/512*n)*n)*n)*n)*n,
	    (1/48+ (1/15 + (-437/1440 + 46/105*n)*n)*n)*nsq,
	    (17/480+ (-37/840 -209/4480*n)*n)*n*nsq,
	    (4397/161280 -11/504*n)*nsq*nsq,
	    4583/161280*n*nsq*nsq
	])
    }
    static get delta(){
	const n = Datum.n;
	const nsq = n * n;
	return this._delta || (this._delta = [
	    null,
	    (2 + (-2/3 + (-2 + (116/45 + (26/45 - 2854/675*n)*n)*n)*n)*n)*n,
	    (7/3 + (-8/5 + (-227/45 + (2704/315 + 2323/945*n)*n)*n)*n)*nsq,
	    (56/15 + (-136/35 + (-1262/105 + 73814/2835*n)*n)*n)*n*nsq,
	    (4279/630 + (-332/35 -399572/14175*n)*n)*nsq*nsq,
	    (4174/315 -144838/6237*n)*n*nsq*nsq,
	    601676/22275*nsq*nsq*nsq
	])
    }

    getLatLng(x, y, num){
	const phi0 = this.phi0(num);    
	const lmbd0= this.lmbd0(num);
	
	const a   = Datum.a;
	const RF  = Datum.RF;
	const m0  = Datum.m0;
	const n   = Datum.n;
	const RA  = Datum.RA;
	
	const nsq = n * n;
	const xi  = (x + this.rs(phi0)) / RA;
	const eta = y / RA
	
	const sum_beta= Datum.beta.map((e_j, j)=>{
	    return { sin2jxi: e_j*Math.sin(2*j*xi), cos2jxi: e_j*Math.cos(2*j*xi) }
	});
	
	const xip = xi - sum_beta.reduceRight((prev, beta_j, j)=>{
	    return (prev +     beta_j.sin2jxi * Math.cosh(2*j*eta));
	}, 0);
	const etap= eta- sum_beta.reduceRight((prev, beta_j, j)=>{
	    return (prev +     beta_j.cos2jxi * Math.sinh(2*j*eta));
	}, 0);
	const sgmp= 1  - sum_beta.reduceRight((prev, beta_j, j)=>{
	    return (prev + 2*j*beta_j.cos2jxi * Math.cosh(2*j*eta));
	}, 0);
	const taup=      sum_beta.reduceRight((prev, beta_j, j)=>{
	    return (prev + 2*j*beta_j.sin2jxi * Math.sinh(2*j*eta));
	}, 0)
	
	const chi = Math.asin(Math.sin(xip)/Math.cosh(etap));    
	
	/* target values */
	const phi = chi + Datum.delta.reduceRight((prev, delta_j, j)=>{
	    return prev + delta_j * Math.sin(2*j*chi);
	}, 0);  
	const lmbd= lmbd0 + Math.atan(Math.sinh(etap)/Math.cos(xip));
	const gmm = Math.atan((taup + sgmp*Math.tan(xip)*Math.tanh(etap))/(sgmp-taup*Math.tan(xip)*Math.tanh(etap)))
	const xip_c = Math.cos(xip), etap_sh = Math.sinh(etap), nphi = this.nphi(phi);
	const m   = RA/a*Math.sqrt((xip_c*xip_c+etap_sh*etap_sh)/(sgmp*sgmp+taup*taup)*(1+nphi*nphi));

	return {
	    latitude: phi * 180/Math.PI, longitude: lmbd * 180/Math.PI, gamma: gmm, m: m
	};
    }
    getEnvelope(north, east, south, west, epsg=6670){
	const horizontalDatum = (epsg-0) > 6667 ? "JGD2011" : ((epsg-0) > 2441 ? "JGD2000" : "TD");
	const horizontalCoordinateSystemName = function(datum){
	    if(datum == "JGD2011")
		return epsg - 6668;
	    if(datum == "JGD2000")
		return epsg - 2442;
	    return null;
	}(horizontalDatum);

	const nw = this.getLatLng(north, west, horizontalCoordinateSystemName);
	const se = this.getLatLng(south, east, horizontalCoordinateSystemName);
	const c  = {latitude: (nw.latitude + se.latitude)/2, longitude: (nw.longitude + se.longitude)/2, gamma: (nw.gamma + se.gamma)/2};

	const leftop = rotate(c, nw, (t)=>{ return -t.gamma }, (p)=>{return [p.latitude, p.longitude]}, (u,v)=>{return {lat:u, lng:v}});
	const rghbot = rotate(c, se, (t)=>{ return -t.gamma }, (p)=>{return [p.latitude, p.longitude]}, (u,v)=>{return {lat:u, lng:v}});
	
	return {north: leftop.lat, south: rghbot.lat, east: rghbot.lng, west: leftop.lng, rotation: c.gamma.degree}

	function rotate(center, p, theta, xy, resolve){
		const t   = theta(center);
		const [x_p, y_p] = xy(p), [x_c, y_c] = xy(center);

		const sin = Math.sin(t), cos = Math.cos(t);
		const x0  = x_p - x_c, y0 = y_p - y_c;
	    const x1  = x0 * cos - y0 * sin + x_c;
	    const y1  = x0 * sin + y0 * cos + y_c;
		return resolve == null ? [x1, y1] : resolve(x1, y1);
	}}
}

export default Datum;

(function() {
	'use strict';

	/** Used to determine if values are of the language type `Object`. */
	var objectTypes = {
		'function': true,
		'object': true
	};

	/** Used as a reference to the global object. */
	var root = (objectTypes[typeof window] && window) || this;

	/** Backup possible global object. */
	var oldRoot = root;

	/** Detect free variable `exports`. */
	var freeExports = objectTypes[typeof exports] && exports;

	/** Detect free variable `module`. */
	var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;

	/** Detect free variable `global` from Node.js or Browserified code and use it as `root`. */
	var freeGlobal = freeExports && freeModule && typeof global == 'object' && global;
	if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal || freeGlobal.self === freeGlobal)) {
		root = freeGlobal;
	}

	root.Datum = Datum;
	
}.call(this));
