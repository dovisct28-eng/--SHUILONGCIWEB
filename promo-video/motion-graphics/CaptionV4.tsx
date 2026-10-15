import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig,interpolate} from 'remotion';
type Values={text:string;color:string;font:string;size:number;align:string};
export default function CaptionV4({item}:{item:{props:Values}}):React.ReactElement{
 const f=useCurrentFrame(),{durationInFrames:d}=useVideoConfig(),p=item.props;
 return <AbsoluteFill style={{background:'transparent',justifyContent:'center',alignItems:'center',opacity:interpolate(f,[0,8,d-8,d],[0,1,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}}><div style={{display:'flex',alignItems:'center',justifyContent:p.align==='left'?'flex-start':'center',gap:20,width:'100%',padding:'0 12px',boxSizing:'border-box',fontFamily:p.font,fontSize:p.size,color:p.color,lineHeight:1.5,letterSpacing:'.035em',textAlign:p.align==='left'?'left':'center',textShadow:'0 2px 14px #000,0 1px 4px #000',whiteSpace:'normal',overflowWrap:'break-word'}}>{p.text.split('→').map((part,i)=><React.Fragment key={i}>{i>0&&<svg width="40" height="28" viewBox="0 0 40 28"><path d="M2 14H36M26 4L36 14L26 24" fill="none" stroke="currentColor" strokeWidth="2"/></svg>}<span style={{minWidth:0}}>{part.trim()}</span></React.Fragment>)}</div></AbsoluteFill>;
}
