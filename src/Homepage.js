//Homepage react component.
import React from 'react';
import Product from './Homepage(UI)/views/Product';
import Categories from './Homepage(UI)/views/Categories';

function Index() {
  return (
    <React.Fragment>
      <Product />
      <Categories/>
    </React.Fragment>
  );
}

export default Index;