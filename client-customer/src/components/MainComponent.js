import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Menu from './MenuComponent';
import Home from './HomeComponent';
import Product from './ProductComponent';
import ProductDetail from './ProductDetailComponent';
import Signup from './SignupComponent';
import Active from './ActiveComponent';
import Login from './LoginComponent';
import Myprofile from './MyprofileComponent';
import Mycart from './MycartComponent';
import Myorders from './MyordersComponent';
import Toast from './ui/Toast';
import NotFound from './ui/NotFound';
import ProductsPage from './ProductsPageComponent';
import Bestsellers from './BestsellersComponent';
import RouteTransition from './ui/RouteTransition';
import AuthLayout from './ui/AuthLayout';

function Main() {
  const { pathname } = useLocation();
  const isAuthRoute = ['/login', '/signup', '/active'].includes(pathname);

  return (
    <div className={`body-customer${isAuthRoute ? ' auth-mode' : ''}`}>
      {!isAuthRoute && <Menu />}
      <RouteTransition><Routes>
        <Route path="/" element={<Navigate replace to="/home" />} />
        <Route path="/home" element={<Home />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/bestsellers" element={<Bestsellers />} />
        <Route path="/product/category/:cid" element={<Product />} />
        <Route path="/product/search/:keyword" element={<Product />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/signup" element={<AuthLayout title="Đăng ký"><Signup /></AuthLayout>} />
        <Route path="/active" element={<AuthLayout title="Kích hoạt tài khoản"><Active /></AuthLayout>} />
        <Route path="/login" element={<AuthLayout title="Đăng nhập"><Login /></AuthLayout>} />
        <Route path="/myprofile" element={<Myprofile />} />
        <Route path="/mycart" element={<Mycart />} />
        <Route path="/myorders" element={<Myorders />} />
        <Route path="*" element={<NotFound />} />
      </Routes></RouteTransition>
      <Toast />
    </div>
  );
}

export default Main;
