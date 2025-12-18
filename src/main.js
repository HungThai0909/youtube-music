import { home } from "./pages/home";
import { explore } from "./pages/explore";
import { MoodsSection } from "./components/sections/home/MoodsSection";
import { QuickPickSection } from "./components/sections/home/QuickPickSection";
import { AlbumSection } from "./components/sections/home/AlbumSection";
import { TodayHitSection } from "./components/sections/home/TodayHitsSection";
import { VMusicSection } from "./components/sections/home/VMusicSection";
import { PlaylistDetail, setPlaylistDetailRouter } from "./pages/PlaylistDetails";
import { MoodDetail, setMoodDetailRouter } from "./pages/MoodDetails";
import { AlbumDetail, setAlbumDetailRouter } from "./pages/AlbumDetails";
import Navigo from "navigo";

const router = new Navigo("/");
MoodsSection.setRouter(router);
QuickPickSection.setRouter(router);
AlbumSection.setRouter(router);
TodayHitSection.setRouter(router);
VMusicSection.setRouter(router);
setMoodDetailRouter(router);
setPlaylistDetailRouter(router);
setAlbumDetailRouter(router);

router
  .on("/", home)
  .on("/explore", explore)
  .on("/mood/:id", MoodDetail)
  .on("/playlist/details/:id", PlaylistDetail)
  .on("/album/details/:id", AlbumDetail)
  .resolve();

router.updatePageLinks();
