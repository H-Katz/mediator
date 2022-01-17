import Datum from '../lib/datum.js';

const config = {
    drivers:{

    },
}

class OffRadio {
    constructor(){
        this.checked = {}
        this.onclick= (evt)=>{
            const sender = evt.target;
            const name = sender.name;
            if (this.checked[name] === sender) {
                delete this.checked[name];
                sender.checked = false
            } else {
                this.checked[name] = sender;
            }
        }
    }  
    static get onclick(){
        if (!OffRadio.checked){
            OffRadio.checked = new OffRadio()
        }
        return OffRadio.checked.onclick
    }
}

class Repository {
    constructor(drivers){
        this.tableList={
        }
    }
    async _fetch(uri){
        return fetch(uri).then(response => {
            if(!response.ok)
                throw new Error(response.statusText);
            return response;
        })
    }
}


const REPO = new Repository(config.drivers);
const datum= new Datum();

const vm = new Vue({
    el: "#app",
    data:{        
        taskList: [],
        programName: "",
        program: {
            'mymap2xy': 0,
            'xy2latlng': 0
        },
        offRadio: {},
        org : "",
        isUnsort: true,
        nth : 1,
        coordinateType: "latlng",
        xyPlane : ""
    },
    computed : { 
        src : function(){
            return this.isUnsort ? 
                this.format(this.org) :
                this.sortLabel(this.format(this.org));
        },
        planeRectangularCoodinateSystem: function(){
            return this.src.map((line)=>{
                const [latitude, longitude, label] = line;                
                const lat = parseFloat(latitude);
                const lng = parseFloat(longitude);
                const {x, y} = datum.getXY(lat, lng, this.nth);
                return [lat, lng, label.replace(/\n/,""), x, y]
            })
        },
        latlngCoordinateSystem: function(){
            return this.xyPlane.split("\n").map((line)=>{
                const [label, x, y, others] = line.split(",")
                const X = parseFloat(x);
                const Y = parseFloat(y);
                const {latitude, longitude} = datum.getLatLng(X, Y, this.nth); 
                return [latitude, longitude, label];
            })
        }
    },
    watch: {
    },
    mounted: function(ev){        
        // UIを整える        
        console.log("mounted");


        /* document.addEventListener('touchmove', function(e) { // バウンススクロールの禁止for Safari
            e.preventDefault();
        }, {passive: false}); */

    },
    methods:{
        uncheck(evt){            
            const sender = evt.target;
            const name = sender.name;
            if (this.offRadio[name] === sender) {
                delete this.offRadio[name];
                sender.checked = false
            } else {
                this.offRadio[name] = sender;
            }            
            if(this.offRadio[name] == null){
                this.program[sender.id.split('_')[0]] = 0
            }
        },
        readfile(evt){
            const ifile = evt.target.files[0]
            new FileReader().readAs(ifile, "readAsText").then((content)=>{
                if(this.programName=='mymap2xy'){
                    this.org = content;
                }else{
                    this.xyPlane = content;
                }
            })
        },
        toggleSort(){
            this.isUnsort = !this.isUnsort;
        },
        format(org){
            const lines = org.split("\n");
            const latlngRE = /\((.*), (.*)\)/;
            var latlng = "";
            var matchs, lat, lng, all, label, others;
            return lines.inject([], (result, line)=>{
                if(matchs = line.match(latlngRE)){
                    if(lat == null && lng == null){
                        [all, lat, lng] = matchs                        
                    }else{
                        result.push([lat, lng, ""]);　
                        [all, lat, lng] = matchs
                    }
                }else if( line.match(/.*N.*E/)){
                    lat = null
                    lng = null 
                }else if( matchs = line.match(/^\d.*/) ){
                    [all, others] = matchs  
                    result.push([lat, lng, all]);　
                    lat = null
                    lng = null
                }
                return result;
            })
        },
        toCSV(a){
            return a.map((e)=>{ return e.join(",") });
        },
        sortLabel(lines){
            return lines.sort((a, b)=>{
                if(a[2] > b[2])
                    return 1;
                if(a[2] == b[2])
                    return 0;
                if(a[2] < b[2])
                    return -1
            })
        },
        downloadGMyMap(){
            this.localDownload(this.toCSV(this.src).join("\r\n"), "mymap.csv")
        },
        downloadLatLng2XY(){
            this.localDownload(this.toCSV(this.planeRectangularCoodinateSystem).join("\r\n"), "latlng2xy.csv")
        },
        downloadXY2LatLng(){
            this.localDownload(this.toCSV(this.latlngCoordinateSystem).join("\r\n"), "xy2mymap.csv")
        },
        localDownload(content, filename){
            const blob = new Blob([ content ], {"type": "text/plain"});
            var link = document.createElement("a")                                                            
            link.download = filename;
            link.href     = window.URL.createObjectURL(blob);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },
    }
});

class Usecase {
    constructor(presenter){
        this.out = presenter;        
    }
    initialize(config){
        this.repo = REPO 
        // UIを整える        
    }
    start(){
    }
}

class Controller{
    constructor(usecase){
        this.out = usecase
    }
    execute(config){
        this.out.initialize(config);
        this.out.start();
    }
}

window.addEventListener("DOMContentLoaded", function(evt){
    const presenter = vm // new Presenter();
    const usecase   = new Usecase(presenter);
    const controller = new Controller(usecase);
    
    controller.execute(config);
})
