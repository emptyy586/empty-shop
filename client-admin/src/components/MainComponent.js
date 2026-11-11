import React, { Component } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import HomeComponent from './HomeComponent';
import MenuComponent from './MenuComponent';
import CategoryComponent from './CategoryComponent';
import Order from './OrderComponent';
import Product from './ProductComponent';
import Customer from './CustomerComponent';
import MyContext from '../contexts/MyContext';
import NotFound from './ui/NotFound';
import RouteTransition from './ui/RouteTransition';

class MainComponent extends Component {
  static contextType = MyContext;

  render() {
    if (!this.context.token) {
      const path = window.location.pathname.replace(/\/$/, '') || '/';
      const knownPaths = ['/','/admin','/admin/home','/admin/category','/admin/product','/admin/order','/admin/customer'];
      return knownPaths.includes(path) ? null : <NotFound />;
    }

    return (
      <div className="body-admin">
        <MenuComponent />
        <RouteTransition><Routes>
          <Route path="/admin" element={<Navigate to="/admin/home" replace />} />
          <Route path="/admin/home" element={<HomeComponent />} />
          <Route path="/admin/category" element={<CategoryComponent />} />
          <Route path="/admin/product" element={<Product />} />
          <Route path="/admin/order" element={<Order />} />
          <Route path="/admin/customer" element={<Customer />} />
          <Route path="*" element={<NotFound />} />
        </Routes></RouteTransition>
      </div>
    );
  }
}

export default MainComponent;
