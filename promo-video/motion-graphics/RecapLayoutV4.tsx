// Transparent upper window: native source video remains a separate editable item.
import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig,interpolate} from 'remotion';
type Values={title:string;description:string;color:string;accent:string;font:string;background:string};
export default function RecapLayoutV4({item}:{item:{props:Values}}):React.ReactElement{
 const p=item.props,f=useCurrentFrame(),{durationInFrames:d}=useVideoConfig();
 const a=interpolate(f,[0,8,d-8,d],[0,1,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 return <AbsoluteFill style={{background:'transparent',color:p.color,fontFamily:p.font}}>
  <div style={{position:'absolute',left:0,top:0,width:154,height:910,background:p.background}}/>
  <div style={{position:'absolute',right:0,top:0,width:154,height:910,background:p.background}}/>
  <div style={{position:'absolute',left:0,right:0,top:0,height:3,background:p.background}}/>
  <div style={{position:'absolute',left:0,right:0,top:910,bottom:0,background:p.background,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:14}}>
   <div style={{opacity:a,display:'flex',flexDirection:'column',alignItems:'center',gap:13,maxWidth:1550,lineHeight:1.3,textAlign:'center'}}><div style={{fontSize:23,color:p.accent,letterSpacing:'.08em'}}>{p.title}</div><div style={{fontSize:38,letterSpacing:'.035em',whiteSpace:'normal',overflowWrap:'break-word'}}>{p.description}</div></div>
  </div>
 </AbsoluteFill>;
}
