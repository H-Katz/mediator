const config = {
    drivers:{

    },
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
    },
    computed : {        
    },
    mounted: function(ev){        
        // UIを整える        
        console.log("mounted");
        /* document.addEventListener('touchmove', function(e) { // バウンススクロールの禁止for Safari
            e.preventDefault();
        }, {passive: false}); */

    },
    methods:{
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
