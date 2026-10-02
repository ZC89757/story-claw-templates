import {Composition, registerRoot} from "remotion";
import {RealNewsDemo} from "./real-news-demo";

const Root = () => <Composition id="RealNewsDemo" component={RealNewsDemo} width={1920} height={1080} fps={30} durationInFrames={540} />;
registerRoot(Root);
