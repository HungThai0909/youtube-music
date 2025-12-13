import { home } from "./pages/home";
import Navigo from "navigo";
const router = new Navigo("/");
router.on("/", home);

router.resolve();
