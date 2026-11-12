import {simulate} from './engine.mjs';
self.onmessage=({data})=>{try{self.postMessage({id:data.id,result:simulate(data.rows,data.weights,data.settings)});}catch(error){self.postMessage({id:data.id,error:error.message});}};
