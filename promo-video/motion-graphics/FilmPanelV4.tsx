import React from 'react';
import {AbsoluteFill,Img,useCurrentFrame,useVideoConfig,interpolate} from 'remotion';
type Values={image:string;image2:string;image3:string;mode:string;label:string;opacity:number;color:string;font:string};
export default function FilmPanel({item}:{item:{props:Values}}):React.ReactElement{const f=useCurrentFrame(),{durationInFrames:d}=useVideoConfig(),props=item.props;
 const progress=Math.min(1,Math.max(0,f/Math.max(1,d-1)));
 const figure=props.mode==='figure',compare=props.mode==='compare';
 const selected=compare?(f<d/3?props.image:f<d*2/3?props.image2:props.image3):props.image;
 const scale=figure?1+progress*.04:props.mode==='detail'?1.7+progress*.12:1.03+progress*.025;
 const x=figure?0:interpolate(progress,[0,1],[20,-20]);
 return <AbsoluteFill style={{background:'#0b151a',color:props.color,overflow:'hidden'}}>
 {figure&&props.image2&&<Img src={props.image2} style={{position:'absolute',inset:0,width:1920,height:1080,objectFit:'cover',opacity:.2,transform:`translateX(${-30+progress*60}px) scale(1.1)`}}/>}
 {selected&&<Img src={selected} style={{position:'absolute',left:figure?520:0,top:figure?120:0,width:figure?880:1920,height:figure?800:1080,objectFit:figure||compare||props.mode==='wide'?'contain':'cover',opacity:props.opacity,transform:`translateX(${x}px) scale(${scale})`}}/>}
 {props.label&&<div style={{position:'absolute',left:92,top:65,fontFamily:props.font,fontSize:27,letterSpacing:'.09em',textShadow:'0 2px 8px #000'}}>{props.label}{compare?' · '+(f<d/3?'原壁画':f<d*2/3?'高清线稿':'数字色稿'):''}</div>}
 </AbsoluteFill>;}
