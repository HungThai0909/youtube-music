import { home } from "./pages/home";
import { explore } from "./pages/explore";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register"; 
import { NewReleases, setNewReleasesRouter } from "./pages/NewReleases";
import { MoodsSection } from "./components/sections/home/MoodsSection";
import { QuickPickSection } from "./components/sections/home/QuickPickSection";
import { AlbumSection as HomeAlbumSection } from "./components/sections/home/AlbumSection";
import { TodayHitSection } from "./components/sections/home/TodayHitsSection";
import { VMusicSection } from "./components/sections/home/VMusicSection";
import { CategorySection } from "./components/sections/explore/CategorySection";
import { AlbumSection as ExploreAlbumSection } from "./components/sections/explore/AlbumSection";
import { PersonalizedSection } from "./components/sections/home/PersonalizedSection";
import { MetaSection } from "./components/sections/explore/MetaSection";
import { VideoSection } from "./components/sections/explore/VideoSection";
import { PlaylistDetail, setPlaylistDetailRouter } from "./pages/PlaylistDetails";
import { MoodDetail, setMoodDetailRouter } from "./pages/MoodDetails";
import { AlbumDetail, setAlbumDetailRouter } from "./pages/AlbumDetails";
import { CategoryDetail, setCategoryDetailRouter } from "./pages/CategoryDetails";
import { Charts, setChartsRouter } from "./pages/Charts";
import { MetaPage, setMetaPageRouter } from "./pages/MetaPage";
import { LineDetail, setLineDetailRouter } from "./pages/LineDetails";
import { SongDetail, setSongDetailRouter } from "./pages/SongDetails";
import { VideoDetail, setVideoDetailRouter } from "./pages/VideoDetails";


import Navigo from "navigo";
const router = new Navigo("/");

MoodsSection.setRouter(router);
QuickPickSection.setRouter(router);
HomeAlbumSection.setRouter(router);
TodayHitSection.setRouter(router);
VMusicSection.setRouter(router);
CategorySection.setRouter(router);
ExploreAlbumSection.setRouter(router);
MetaSection.setRouter(router);
VideoSection.setRouter(router);
PersonalizedSection.setRouter(router);

setMoodDetailRouter(router);
setPlaylistDetailRouter(router);
setAlbumDetailRouter(router);
setCategoryDetailRouter(router);
setLineDetailRouter(router);
setNewReleasesRouter(router);
setChartsRouter(router);
setMetaPageRouter(router);
setSongDetailRouter(router);
setVideoDetailRouter(router);

router
  .on("/", home)
  .on("/explore", explore)
  .on("/login", Login)
  .on("/register", Register)
  .on("/new-releases", NewReleases)
  .on("/charts", Charts)
  .on("/moods", MetaPage)
  .on("/mood/:id", MoodDetail)
  .on("/playlist/details/:id", PlaylistDetail)
  .on("/album/details/:id", AlbumDetail)
  .on("/category/:id", CategoryDetail)
  .on("/line/:id", LineDetail)
  .on("/song/details/:id", SongDetail)
  .on("/video/details/:id", VideoDetail)
  .on("/profile", () => {
    if (window.location.pathname !== "/") {
      home();
      setTimeout(() => {
        window.openProfileModal?.();
      }, 60);
    } else {
      window.openProfileModal?.();
    }
  })
  .on("/change-password", () => {
    home();
    setTimeout(() => {
      document.querySelector('a[href="/change-password"]')?.click();
    }, 60);
  });

router.resolve();

router.updatePageLinks();
