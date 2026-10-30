export const WAYPOINTS = [
  {
    "id": "m01-return",
    "position": [
      3.85,
      1.38,
      7.65
    ],
    "target": [
      4.05,
      1.38,
      2.4
    ],
    "fov": 48
  },
  {
    "id": "east-mid",
    "position": [
      3.85,
      1.38,
      0
    ],
    "target": [
      3.85,
      1.38,
      -7.3
    ],
    "fov": 48
  },
  {
    "id": "hall-approach",
    "position": [
      3.85,
      1.38,
      -6.5
    ],
    "target": [
      2.5,
      1.38,
      -9
    ],
    "fov": 48
  },
  {"id":"gallery-exit-turn","position":[2.5,1.38,-6.5],"target":[2.5,1.6,-11],"fov":48},
  {
    "id": "hall-front",
    "position": [
      2.5,
      1.38,
      -7.5
    ],
    "target": [
      2.5,
      1.6,
      -11
    ],
    "fov": 48
  },
  {
    "id": "hall-inside",
    "position": [
      2.5,
      1.38,
      -9.5
    ],
    "target": [
      4.515,
      1.85,
      -11.75
    ],
    "fov": 48
  },
  {
    "id": "m02-dock",
    "position": [
      1.4,
      1.85,
      -11.75
    ],
    "target": [
      4.515,
      1.85,
      -11.75
    ],
    "fov": 48
  },
  {
    "id": "rear-right",
    "position": [
      1.4,
      1.85,
      -12
    ],
    "target": [
      2.25,
      1.85,
      -14.865
    ],
    "fov": 48
  },
  {
    "id": "rear-left",
    "position": [
      -1.4,
      1.85,
      -12
    ],
    "target": [
      -2.25,
      1.85,
      -14.865
    ],
    "fov": 48
  },
  {
    "id": "m05-dock",
    "position": [
      -1.4,
      1.85,
      -11.75
    ],
    "target": [
      -4.515,
      1.85,
      -11.75
    ],
    "fov": 48
  }
];
export function segmentHits(runtime,a,b,radius=.16){
 const offsets=[[0,0,0],[radius,0,0],[-radius,0,0],[0,radius,0],[0,-radius,0]];
 return offsets.flatMap(d=>{const x=a.map((v,i)=>v+d[i]),y=b.map((v,i)=>v+d[i]);return [...runtime.intersections(x,y),...runtime.intersections(y,x)];});
}
export const lerpPose=(a,b,t)=>({position:a.position.map((v,i)=>v+(b.position[i]-v)*t),target:a.target.map((v,i)=>v+(b.target[i]-v)*t),fov:a.fov+(b.fov-a.fov)*t,time:3});
export function routeSlice(from,to){const ends=[0,6,7,8,9],a=ends[from],b=ends[to];return to>from?WAYPOINTS.slice(a+1,b+1):WAYPOINTS.slice(b,a).reverse();}
