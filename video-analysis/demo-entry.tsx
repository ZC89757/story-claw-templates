import {Composition, registerRoot} from "remotion";
import {NewsWebDemo} from "./news-web-demo";

const Root = () => <Composition
  id="NewsWebDemo"
  component={NewsWebDemo}
  width={720}
  height={1280}
  fps={30}
  durationInFrames={540}
/>;

registerRoot(Root);
