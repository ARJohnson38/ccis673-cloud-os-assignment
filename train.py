"""Reproducible synthetic regression; only standard library required."""
import json, math, random, statistics
from pathlib import Path
SEED=673; rng=random.Random(SEED)
rows=[]
for i in range(240):
    concurrent=rng.randint(1,100)
    payload=rng.randint(1,1024)
    # Synthetic target, with deterministic seeded noise; NOT real Azure measurements.
    latency=35+1.8*concurrent+0.12*payload+rng.gauss(0,8)
    rows.append((concurrent,payload,latency))
rng.shuffle(rows)
train,test=rows[:192],rows[192:]
# Center and scale using TRAIN ONLY. Closed-form normal equation with two features.
means=[statistics.mean(r[j] for r in train) for j in range(2)]
scales=[statistics.pstdev(r[j] for r in train) for j in range(2)]
def vector(r): return [1.0]+[(r[j]-means[j])/scales[j] for j in range(2)]
def solve(A,b):
 n=len(b); mat=[list(A[i])+[b[i]] for i in range(n)]
 for j in range(n):
  pivot=max(range(j,n),key=lambda i:abs(mat[i][j]));mat[j],mat[pivot]=mat[pivot],mat[j]
  d=mat[j][j]
  if abs(d)<1e-12: raise ValueError('singular matrix')
  mat[j]=[v/d for v in mat[j]]
  for i in range(n):
   if i==j:continue
   k=mat[i][j];mat[i]=[a-k*c for a,c in zip(mat[i],mat[j])]
 return [r[-1] for r in mat]
X=[vector(r) for r in train];y=[r[2] for r in train]
A=[[sum(x[i]*x[j] for x in X) for j in range(3)] for i in range(3)]
b=[sum(x[i]*v for x,v in zip(X,y)) for i in range(3)]
coef=solve(A,b)
def predict(r):return sum(c*x for c,x in zip(coef,vector(r)))
mae=lambda vals:sum(abs(a-b) for a,b in vals)/len(vals)
baseline=statistics.mean(y)
metrics={'seed':SEED,'train_rows':len(train),'test_rows':len(test),'baseline':'training-target mean','baseline_mae_ms':round(mae([(baseline,r[2]) for r in test]),4),'model_mae_ms':round(mae([(predict(r),r[2]) for r in test]),4)}
artifact={'model_version':'1.0.0','training_seed':SEED,'target':'synthetic_latency_ms','units':'ms','feature_names':['concurrent_requests','payload_kb'],'feature_ranges':{'concurrent_requests':[1,100],'payload_kb':[1,1024]},'preprocessing':{'method':'standardize','means':means,'stds':scales},'intercept':coef[0],'coefficients':coef[1:],'training_rows':len(train),'test_rows':len(test),'warning':'Synthetic demonstration, not a validated predictor of actual Azure latency'}
root=Path(__file__).resolve().parents[1]
(root/'api/model.json').write_text(json.dumps(artifact,indent=2)+'\n')
(root/'training/metrics.json').write_text(json.dumps(metrics,indent=2)+'\n')
(root/'training/heldout_cases.json').write_text(json.dumps([{'concurrent_requests':r[0],'payload_kb':r[1],'target_ms':round(r[2],3),'predicted_ms':round(predict(r),3)} for r in test[:5]],indent=2)+'\n')
print(json.dumps(metrics,indent=2))
