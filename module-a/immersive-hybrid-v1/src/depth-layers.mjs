// Homography maps the unchanged rectangular mural into the model's projected
// four corners. CSS retains the source bitmap separately from the AI backdrop.
export function homography(points,width=1000,height=1000*1.2547/3.65){
 const source=[[0,0],[width,0],[width,height],[0,height]],rows=[];
 for(let i=0;i<4;i++){const[x,y]=source[i],[u,v]=points[i];rows.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v]);}
 for(let col=0;col<8;col++){let pivot=col;for(let row=col+1;row<8;row++)if(Math.abs(rows[row][col])>Math.abs(rows[pivot][col]))pivot=row;[rows[col],rows[pivot]]=[rows[pivot],rows[col]];const factor=rows[col][col];if(Math.abs(factor)<1e-10)throw Error('Degenerate mural projection');for(let c=col;c<9;c++)rows[col][c]/=factor;for(let row=0;row<8;row++)if(row!==col){const f=rows[row][col];for(let c=col;c<9;c++)rows[row][c]-=f*rows[col][c];}}
 const h=rows.map(r=>r[8]);return [h[0],h[3],0,h[6],h[1],h[4],0,h[7],0,0,1,0,h[2],h[5],0,1];
}
export function placeMural(button,points,frame){const w=frame.clientWidth,h=frame.clientHeight;button.style.transform=`matrix3d(${homography(points.map(([x,y])=>[x*w,y*h])).join(',')})`;}
