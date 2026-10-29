import model from './model.json' with { type: 'json' };
const json=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin'}});
export function predict(data){
 if(data===null || typeof data!=='object' || Array.isArray(data)) return {status:400,body:{error:{code:'INVALID_SHAPE',message:'Expected a JSON object with exactly two named features'}}};
 const names=model.feature_names;
 if(Object.keys(data).length!==names.length || names.some(n=>!Object.hasOwn(data,n))) return {status:400,body:{error:{code:'INVALID_FIELDS',message:'Provide only concurrent_requests and payload_kb'}}};
 for(const name of names){
  const value=data[name], [min,max]=model.feature_ranges[name];
  if(typeof value!=='number'||!Number.isFinite(value))return {status:400,body:{error:{code:'INVALID_TYPE',message:name+' must be a finite number'}}};
  if(value<min||value>max||(name==='concurrent_requests'&&!Number.isInteger(value)))return {status:400,body:{error:{code:'OUT_OF_RANGE',message:name+' is outside its allowed range'}}};
 }
 let y=model.intercept;
 names.forEach((name,i)=>{y+=model.coefficients[i]*(data[name]-model.preprocessing.means[i])/model.preprocessing.stds[i]});
 return {status:200,body:{prediction_ms:Math.round(y*1000)/1000,units:model.units,model_version:model.model_version,synthetic:true}};
}
export default {async fetch(request,env){
 const url=new URL(request.url);
 if(url.pathname==='/api/health'){
  if(request.method!=='GET')return json(405,{error:{code:'METHOD_NOT_ALLOWED',message:'Use GET'}});
  return json(200,{status:'ok',model_version:model.model_version});
 }
 if(url.pathname==='/api/predict'){
  if(request.method!=='POST')return json(405,{error:{code:'METHOD_NOT_ALLOWED',message:'Use POST'}});
  if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))return json(415,{error:{code:'UNSUPPORTED_MEDIA_TYPE',message:'Send application/json'}});
  let raw;try{raw=await request.text()}catch{return json(400,{error:{code:'INVALID_BODY',message:'Unable to read request'}})}
  if(raw.length>2048)return json(413,{error:{code:'TOO_LARGE',message:'Request body too large'}});
  let data;try{data=JSON.parse(raw)}catch{return json(400,{error:{code:'INVALID_JSON',message:'Malformed JSON request'}})}
  const result=predict(data);return json(result.status,result.body);
 }
 if(url.pathname.startsWith('/api/'))return json(404,{error:{code:'NOT_FOUND',message:'API route not found'}});
 return env.ASSETS.fetch(request);
}};
