import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import productsRouter from "./products";
import categoriesRouter from "./categories";
import ordersRouter from "./orders";
import usersRouter from "./users";
import bannersRouter from "./banners";
import couponsRouter from "./coupons";
import settingsRouter from "./settings";
import dashboardRouter from "./dashboard";
import uploadRouter from "./upload";
import adsRouter from "./ads";
import cartRouter from "./cart";
import wishlistRouter from "./wishlist";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(productsRouter);
router.use(categoriesRouter);
router.use(ordersRouter);
router.use(usersRouter);
router.use(bannersRouter);
router.use(couponsRouter);
router.use(settingsRouter);
router.use(dashboardRouter);
router.use(uploadRouter);
router.use(adsRouter);
router.use(cartRouter);
router.use(wishlistRouter);

export default router;
