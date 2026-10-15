import { AbsoluteFill, Composition, OffthreadVideo, staticFile } from "remotion";

export const MyComposition = () => {
  return (
    <Composition
      id="MyComp"
      component={MyComponent}
      durationInFrames={3900}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};

// Studio is a review monitor for the native export. The editable master is
// ChatCut's five-track timeline, recorded in production-state-v2.json.
export const MyComponent: React.FC = () => {
  return <AbsoluteFill style={{backgroundColor: "#0b151a"}}>
    <OffthreadVideo src={staticFile("preview-review-v2.mp4")} />
  </AbsoluteFill>;
};
