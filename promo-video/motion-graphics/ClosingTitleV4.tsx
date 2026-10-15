import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

type Values = {title:string; statement:string; subtitle:string; color:string; titleFont:string; bodyFont:string};

// Transparent text only. The existing FilmPanelV4 remains a separate source item.
export default function ClosingTitleV4({item}:{item:{props:Values}}):React.ReactElement {
  const f = useCurrentFrame();
  const {fps, durationInFrames:d} = useVideoConfig();
  const p = item.props;
  const reveal = (seconds:number) => interpolate(f, [seconds*fps, seconds*fps+18], [0,1], {extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const exit = interpolate(f, [d-fps,d-1], [1,0], {extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return <AbsoluteFill style={{background:'transparent',color:p.color,opacity:exit,textAlign:'center'}}>
    <div style={{position:'absolute',left:100,right:100,top:105,height:170,display:'flex',alignItems:'center',justifyContent:'center',opacity:reveal(1)}}>
      <div style={{fontFamily:p.titleFont,fontSize:98,fontWeight:500,lineHeight:1.35,letterSpacing:'.16em',whiteSpace:'normal',overflowWrap:'break-word'}}>{p.title}</div>
    </div>
    <div style={{position:'absolute',left:120,right:120,top:820,bottom:86,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:27,fontFamily:p.bodyFont}}>
      <div style={{opacity:reveal(2),fontSize:40,fontWeight:400,lineHeight:1.55,letterSpacing:'.055em',whiteSpace:'normal',overflowWrap:'break-word'}}>{p.statement}</div>
      <div style={{opacity:reveal(3),fontSize:26,fontWeight:400,lineHeight:1.6,letterSpacing:'.18em',whiteSpace:'normal',overflowWrap:'break-word'}}>{p.subtitle}</div>
    </div>
  </AbsoluteFill>;
}
