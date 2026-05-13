/**
 * Generated schemas live in `./generated/api`. Orval v7+ exports camelCase names;
 * we re-export PascalCase aliases for existing server route imports.
 */
export * from "./generated/api";

export {
  registerUserBody as RegisterUserBody,
  loginUserBody as LoginUserBody,
  healthCheckResponse as HealthCheckResponse,
  createBannerBody as CreateBannerBody,
  updateBannerBody as UpdateBannerBody,
  createCategoryBody as CreateCategoryBody,
  updateCategoryBody as UpdateCategoryBody,
  updateCategoryParams as UpdateCategoryParams,
  deleteCategoryParams as DeleteCategoryParams,
  createCouponBody as CreateCouponBody,
  updateCouponBody as UpdateCouponBody,
  validateCouponBody as ValidateCouponBody,
  getRecentOrdersQueryParams as GetRecentOrdersQueryParams,
  getRevenueChartQueryParams as GetRevenueChartQueryParams,
  createOrderBody as CreateOrderBody,
  updateOrderStatusBody as UpdateOrderStatusBody,
  listOrdersQueryParams as ListOrdersQueryParams,
  createProductBody as CreateProductBody,
  updateProductBody as UpdateProductBody,
  getProductParams as GetProductParams,
  updateProductParams as UpdateProductParams,
  deleteProductParams as DeleteProductParams,
  listProductsQueryParams as ListProductsQueryParams,
  getLowStockProductsQueryParams as GetLowStockProductsQueryParams,
  getTopSellingProductsQueryParams as GetTopSellingProductsQueryParams,
  addReviewParams as AddReviewParams,
  addReviewBody as AddReviewBody,
  updateSettingsBody as UpdateSettingsBody,
  updateUserBody as UpdateUserBody,
  toggleBlockUserBody as ToggleBlockUserBody,
  listUsersQueryParams as ListUsersQueryParams,
} from "./generated/api";
