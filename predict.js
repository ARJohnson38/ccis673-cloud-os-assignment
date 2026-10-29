const form=document.getElementById('prediction-form'),output=document.getElementById('prediction-output'),btn=document.getElementById('submit-prediction');
form.addEventListener('submit',async e=>{e.preventDefault();btn.disabled=true;output.setAttribute('role','status');output.textContent='Requesting prediction…';try{
const concurrent_requests=Number(form.elements.concurrent_requests.value),payload_kb=Number(form.elements.payload_kb.value);
const r=await fetch('/api/predict',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({concurrent_requests,payload_kb})});
const data=await r.json();if(!r.ok)throw Error(data.error?.message||'Request failed ('+r.status+')');
output.textContent='Predicted synthetic latency: '+data.prediction_ms+' '+data.units+' | Model '+data.model_version+'. This is not a real cloud performance forecast.';
}catch(err){output.textContent='Prediction unavailable: '+err.message+' (Check that the Cloudflare Worker API is deployed.)'}finally{btn.disabled=false}});
