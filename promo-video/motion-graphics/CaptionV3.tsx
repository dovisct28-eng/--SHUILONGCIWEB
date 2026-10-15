import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';
type Values={text:string;color:string;font:string;size:number;align:string};
export default function Caption({item}:{item:{props:Values}}){
 const f=useCurrentFrame(),{durationInFrames:d}=useVideoConfig(),p=item.props;
 const opacity=interpolate(f,[0,8,d-8,d],[0,1,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 return <AbsoluteFill style={{justifyContent:'center',alignItems:'center',background:'transparent',opacity}}><div style={{fontFamily:p.font,fontSize:p.size,color:p.color,lineHeight:1.5,letterSpacing:'0.045em',maxWidth:'100%',width:'100%',boxSizing:'border-box',padding:'0 10px',textAlign:p.align==='left'?'left':'center',textShadow:'0 2px 14px #000, 0 1px 4px #000',whiteSpace:'normal',overflowWrap:'break-word',display:'flex',alignItems:'center',gap:22}}>{p.text.split('→').map((part,i)=><React.Fragment key={i}>{i>0&&<svg width="42" height="28" viewBox="0 0 42 28"><path d="M2 14H38M28 4L38 14L28 24" fill="none" stroke="currentColor" strokeWidth="2"/></svg>}<span style={{minWidth:0}}>{part.trim()}</span></React.Fragment>)}</div></AbsoluteFill>;
}
