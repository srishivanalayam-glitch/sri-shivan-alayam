try{await import('./live.js');}catch(error){console.error(error);document.querySelector('#loading').hidden=true;document.querySelector('#failure').hidden=false;}
