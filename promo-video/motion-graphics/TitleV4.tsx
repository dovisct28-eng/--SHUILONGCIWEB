import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig,interpolate} from 'remotion';
type Values={title:string;subtitle:string;color:string;accent:string;font:string};
export default function TitleV4({item}:{item:{props:Values}}):React.ReactElement{
 const f=useCurrentFrame(),{durationInFrames:d}=useVideoConfig(),p=item.props;
 const a=interpolate(f,[0,18,d-24,d-1],[0,1,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 return <AbsoluteFill style={{background:'transparent',justifyContent:'center',alignItems:'center',color:p.color,opacity:a}}><div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:28,padding:'60px 100px',maxWidth:1500,textShadow:'0 4px 24px #000'}}><div style={{height:2,width:120,background:p.accent,transform:`scaleX(${a})`}}/><div style={{fontFamily:p.font,fontWeight:500,fontSize:130,letterSpacing:'.16em',lineHeight:1.3,textAlign:'center'}}>{p.title}</div><div style={{fontFamily:'Noto Sans SC',fontSize:30,letterSpacing:'.22em',lineHeight:1.6,textAlign:'center'}}>{p.subtitle}</div></div></AbsoluteFill>;
}
